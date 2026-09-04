import { Purchases, type CustomerInfo, type Offerings, type Offering, type Package, type PurchaseResult } from "@revenuecat/purchases-js";

// RevenueCat Public API Test Key provided by user
export const REVENUECAT_API_KEY = "test_aLsBHkgmNobJrZHUXrAefSAQdHc";

let purchasesInstance: Purchases | null = null;
let currentAppUserId: string | null = null;

/**
 * Initialize and configure the RevenueCat Purchases SDK
 */
export function initRevenueCat(customUserId?: string): Purchases {
  if (purchasesInstance) {
    return purchasesInstance;
  }

  try {
    const savedUserId = typeof window !== "undefined" ? localStorage.getItem("rc_app_user_id") : null;
    const appUserId = customUserId || savedUserId || Purchases.generateRevenueCatAnonymousAppUserId();
    
    if (typeof window !== "undefined") {
      localStorage.setItem("rc_app_user_id", appUserId);
    }
    
    currentAppUserId = appUserId;

    purchasesInstance = Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserId: appUserId,
    });

    console.log("RevenueCat SDK configured successfully with appUserId:", appUserId);
    return purchasesInstance;
  } catch (error) {
    console.error("Error configuring RevenueCat SDK:", error);
    // If getSharedInstance works, fallback to it
    try {
      purchasesInstance = Purchases.getSharedInstance();
      return purchasesInstance;
    } catch {
      throw error;
    }
  }
}

/**
 * Get the current Purchases shared instance
 */
export function getPurchasesInstance(): Purchases {
  if (!purchasesInstance) {
    return initRevenueCat();
  }
  return purchasesInstance;
}

/**
 * Get active user ID
 */
export function getRevenueCatUserId(): string {
  return currentAppUserId || Purchases.generateRevenueCatAnonymousAppUserId();
}

/**
 * Fetch Customer Info and check active entitlements
 */
export async function getRevenueCatCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    const purchases = getPurchasesInstance();
    const customerInfo = await purchases.getCustomerInfo();
    console.log("RevenueCat Customer Info fetched:", customerInfo);
    return customerInfo;
  } catch (error) {
    console.error("Failed to fetch RevenueCat customer info:", error);
    return null;
  }
}

/**
 * Check if the user has a specific entitlement active (e.g. 'AgentFlow Pro', 'pro', 'enterprise')
 */
export async function checkHasEntitlement(entitlementName: string = "AgentFlow Pro"): Promise<boolean> {
  try {
    const customerInfo = await getRevenueCatCustomerInfo();
    if (!customerInfo) return false;

    // Check directly in active entitlements
    if (entitlementName in customerInfo.entitlements.active) {
      console.log(`RevenueCat Entitlement '${entitlementName}' is ACTIVE!`);
      return true;
    }

    // Also check case-insensitive match or standard tiers
    const activeKeys = Object.keys(customerInfo.entitlements.active);
    const hasMatch = activeKeys.some(
      (k) => k.toLowerCase() === entitlementName.toLowerCase() ||
             k.toLowerCase().includes(entitlementName.toLowerCase()) ||
             k.toLowerCase().includes("pro") ||
             k.toLowerCase().includes("syncschedule")
    );

    return hasMatch;
  } catch (error) {
    console.error("Error checking entitlement:", error);
    return false;
  }
}

/**
 * Get all available Offerings from RevenueCat
 */
export async function getRevenueCatOfferings(): Promise<Offerings | null> {
  try {
    const purchases = getPurchasesInstance();
    const offerings = await purchases.getOfferings();
    console.log("RevenueCat Offerings fetched:", offerings);
    return offerings;
  } catch (error) {
    console.error("Failed to fetch RevenueCat offerings:", error);
    return null;
  }
}

/**
 * Present the RevenueCat native web paywall for the current or specified offering
 */
export async function presentRevenueCatPaywall(customOffering?: Offering): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> {
  try {
    const purchases = getPurchasesInstance();
    let targetOffering = customOffering;

    if (!targetOffering) {
      const offerings = await purchases.getOfferings();
      targetOffering = offerings.current || undefined;
    }

    if (!targetOffering) {
      console.warn("No current RevenueCat offering configured in project.");
      return { success: false, error: "No offering configured on RevenueCat project" };
    }

    const purchaseResult: PurchaseResult = await purchases.presentPaywall({ offering: targetOffering });
    const { customerInfo } = purchaseResult;

    const hasPro = "AgentFlow Pro" in customerInfo.entitlements.active || 
                  "SyncSchedule Pro" in customerInfo.entitlements.active || 
                  Object.keys(customerInfo.entitlements.active).length > 0;

    return {
      success: hasPro,
      customerInfo: customerInfo,
    };
  } catch (error: unknown) {
    console.error("RevenueCat Paywall Error:", error);
    const message = error instanceof Error ? error.message : "Paywall presentation failed";
    return { success: false, error: message };
  }
}

/**
 * Purchase a specific RevenueCat package directly
 */
export async function purchaseRevenueCatPackage(pkg: Package): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> {
  try {
    const purchases = getPurchasesInstance();
    const purchaseResult = await purchases.purchase({
      rcPackage: pkg,
    });
    return {
      success: true,
      customerInfo: purchaseResult.customerInfo,
    };
  } catch (error: unknown) {
    console.error("RevenueCat package purchase error:", error);
    const message = error instanceof Error ? error.message : "Purchase failed";
    return { success: false, error: message };
  }
}
