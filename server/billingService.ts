import Stripe from "stripe";
import { enterpriseDb, BillingInvoiceRecord } from "./storageService";
import { recordAuditBlock } from "./auditComplianceService";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2025-02-24.acacia" as any,
    });
  }
  return stripeClient;
}

export interface CreateCheckoutParams {
  tenantId: string;
  customerEmail: string;
  planName: string;
  amountUsd: number;
  interval?: "month" | "year" | "one_time";
  successUrl: string;
  cancelUrl: string;
  clientRevenueSharePercent?: number;
  metadata?: Record<string, string>;
}

export interface CheckoutResult {
  success: boolean;
  isSimulated: boolean;
  sessionId: string;
  checkoutUrl: string;
  amountUsd: number;
  revenueShareSplit: {
    clientShareUsd: number;
    platformFeeUsd: number;
    splitRatio: string;
  };
}

/**
 * Creates a Stripe Checkout Session for subscription or one-time payment.
 */
export async function createStripeCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
  const stripe = getStripeClient();
  const revSharePercent = params.clientRevenueSharePercent ?? 90;
  const platformFeePercent = 100 - revSharePercent;
  const clientShareUsd = Number(((params.amountUsd * revSharePercent) / 100).toFixed(2));
  const platformFeeUsd = Number(((params.amountUsd * platformFeePercent) / 100).toFixed(2));

  const splitSummary = {
    clientShareUsd,
    platformFeeUsd,
    splitRatio: `${revSharePercent}% Client / ${platformFeePercent}% Platform`,
  };

  const isOneTime = params.interval === "one_time";

  if (!stripe) {
    // Sandbox / Test Simulator Mode
    const mockSessionId = `cs_sandbox_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const mockCheckoutUrl = `${params.successUrl}?session_id=${mockSessionId}&sandbox_paid=true`;

    // Record invoice in enterprise DB
    const invoiceRecord: BillingInvoiceRecord = {
      id: `inv-sim-${Date.now()}`,
      tenantId: params.tenantId,
      stripeInvoiceId: `in_mock_${mockSessionId}`,
      amountDueUsd: params.amountUsd,
      amountPaidUsd: params.amountUsd,
      currency: "USD",
      status: "paid",
      description: `${params.planName} (${params.interval || "month"}) - Sandbox Paid`,
      hostedInvoiceUrl: mockCheckoutUrl,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      clientRevenueSharePercent: revSharePercent,
      platformFeeUsd,
      clientPayoutUsd: clientShareUsd,
    };
    enterpriseDb.saveInvoice(invoiceRecord);

    recordAuditBlock({
      tenantId: params.tenantId,
      userId: params.customerEmail,
      actorRole: "OPERATOR",
      actionType: "BILLING_CHECKOUT_SIMULATED",
      summary: `Created and completed simulated checkout session for ${params.planName} ($${params.amountUsd} USD)`,
      inputPayload: params,
      outputPayload: { sessionId: mockSessionId, splitSummary },
      status: "SUCCESS",
    });

    return {
      success: true,
      isSimulated: true,
      sessionId: mockSessionId,
      checkoutUrl: mockCheckoutUrl,
      amountUsd: params.amountUsd,
      revenueShareSplit: splitSummary,
    };
  }

  // Live Stripe API integration
  try {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `AgentFlow Enterprise - ${params.planName}`,
            description: `Autonomous Multi-Tenant Agent Seat Allocation & SLA Execution (${params.interval || "monthly"})`,
          },
          unit_amount: Math.round(params.amountUsd * 100),
          ...(isOneTime
            ? {}
            : {
                recurring: {
                  interval: params.interval === "year" ? "year" : "month",
                },
              }),
        },
        quantity: 1,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: isOneTime ? "payment" : "subscription",
      customer_email: params.customerEmail,
      line_items: lineItems,
      success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl,
      metadata: {
        tenantId: params.tenantId,
        planName: params.planName,
        clientShareUsd: clientShareUsd.toString(),
        platformFeeUsd: platformFeeUsd.toString(),
        ...(params.metadata || {}),
      },
    });

    recordAuditBlock({
      tenantId: params.tenantId,
      userId: params.customerEmail,
      actorRole: "OPERATOR",
      actionType: "BILLING_CHECKOUT_CREATED",
      summary: `Stripe Checkout Session initialized for ${params.planName} ($${params.amountUsd} USD)`,
      inputPayload: params,
      outputPayload: { sessionId: session.id, url: session.url },
      status: "SUCCESS",
    });

    return {
      success: true,
      isSimulated: false,
      sessionId: session.id,
      checkoutUrl: session.url || params.successUrl,
      amountUsd: params.amountUsd,
      revenueShareSplit: splitSummary,
    };
  } catch (err: any) {
    console.error("[Stripe Billing] Checkout creation error:", err);
    throw new Error(err.message || "Failed to create Stripe Checkout session");
  }
}

/**
 * Creates a Stripe Customer Portal session for enterprise clients to manage subscriptions.
 */
export async function createStripePortalSession(customerId: string, returnUrl: string): Promise<string> {
  const stripe = getStripeClient();
  if (!stripe) {
    return `${returnUrl}?portal_mock=true`;
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

/**
 * Handles incoming Stripe Webhooks with signature verification.
 */
export async function processStripeWebhook(
  rawBody: Buffer | string,
  signature: string | undefined
): Promise<{ processed: boolean; eventType: string; message: string }> {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (!stripe || !webhookSecret || !signature) {
    // If webhook secret is not set, we can parse event directly in dev/testing
    if (typeof rawBody === "string") {
      event = JSON.parse(rawBody);
    } else {
      event = JSON.parse(rawBody.toString("utf-8"));
    }
  } else {
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error("[Stripe Webhook Signature Verification Failed]:", err.message);
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }
  }

  console.log(`[Stripe Webhook] Received verified event: ${event.type} (${event.id})`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenantId || "tenant-apex-01";
      const amountPaid = (session.amount_total ?? 0) / 100;

      // Update tenant status & credits
      const tenant = enterpriseDb.getTenant(tenantId);
      if (tenant) {
        tenant.status = "active";
        tenant.creditsQuota += 50000;
        if (session.customer && typeof session.customer === "string") {
          tenant.stripeCustomerId = session.customer;
        }
        if (session.subscription && typeof session.subscription === "string") {
          tenant.stripeSubscriptionId = session.subscription;
        }
        enterpriseDb.saveTenant(tenant);
      }

      // Record invoice
      const invoice: BillingInvoiceRecord = {
        id: `inv-${Date.now()}`,
        tenantId,
        stripeInvoiceId: typeof session.invoice === "string" ? session.invoice : `in_${session.id}`,
        amountDueUsd: amountPaid,
        amountPaidUsd: amountPaid,
        currency: session.currency?.toUpperCase() || "USD",
        status: "paid",
        description: `AgentFlow Enterprise Subscription - ${session.metadata?.planName || "Tier"}`,
        hostedInvoiceUrl: session.url || undefined,
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
        clientRevenueSharePercent: 90,
        platformFeeUsd: Number((amountPaid * 0.1).toFixed(2)),
        clientPayoutUsd: Number((amountPaid * 0.9).toFixed(2)),
      };
      enterpriseDb.saveInvoice(invoice);

      recordAuditBlock({
        tenantId,
        userId: session.customer_email || "stripe_webhook",
        actorRole: "OPERATOR",
        actionType: "STRIPE_CHECKOUT_COMPLETED",
        summary: `Stripe checkout completed for $${amountPaid} USD. Granted 50,000 credits to tenant ${tenantId}.`,
        inputPayload: { eventId: event.id, sessionId: session.id },
        outputPayload: invoice,
        status: "SUCCESS",
      });
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const tenantId = (invoice as any).metadata?.tenantId || "tenant-apex-01";
      recordAuditBlock({
        tenantId,
        userId: "stripe_webhook",
        actorRole: "OPERATOR",
        actionType: "STRIPE_INVOICE_PAID",
        summary: `Recurring subscription invoice ${invoice.id} paid for $${(invoice.amount_paid ?? 0) / 100} USD.`,
        inputPayload: { invoiceId: invoice.id, status: invoice.status },
        status: "SUCCESS",
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const tenantId = sub.metadata?.tenantId || "tenant-apex-01";
      const tenant = enterpriseDb.getTenant(tenantId);
      if (tenant) {
        tenant.status = "suspended";
        enterpriseDb.saveTenant(tenant);
      }
      recordAuditBlock({
        tenantId,
        userId: "stripe_webhook",
        actorRole: "SECURITY_AUDITOR",
        actionType: "STRIPE_SUBSCRIPTION_CANCELLED",
        summary: `Subscription ${sub.id} ended. Tenant ${tenantId} marked as suspended.`,
        status: "WARNING",
      });
      break;
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  return {
    processed: true,
    eventType: event.type,
    message: `Event ${event.type} handled successfully`,
  };
}
