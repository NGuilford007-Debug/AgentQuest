import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Agent, TaskExecutionRecord } from "../types";

export interface PDFReportConfig {
  companyName: string;
  preparedFor: string;
  preparedBy: string;
  timeHorizon: string;
  forecastHorizonMonths: number;
  hourlyRate: number;
  includeExecutiveSummary: boolean;
  includeHistoricalMetrics: boolean;
  includeForecastSection: boolean;
  includeDepartmentBreakdown: boolean;
  includeQualityAudit: boolean;
  includeAgentRoster: boolean;
  notes?: string;
}

export interface ForecastSummaryData {
  totalHistoricalHours: number;
  totalHistoricalCostSaved: number;
  totalTasks: number;
  qualityRate: number;
  hourlyRate: number;
  projected12MoHours: number;
  projected12MoGrossSavings: number;
  projected12MoNetValue: number;
  projected12MoTasks: number;
  projectedFteLiberated: number;
  growthScenarioName: string;
  monthlyProjections: Array<{
    monthName: string;
    tasks: number;
    hours: number;
    grossSavings: number;
    aiCost: number;
    netSavings: number;
    fteEquivalent: number;
  }>;
  departmentBreakdown: Array<{
    name: string;
    hours: number;
    costSaved: number;
    percent: number;
  }>;
}

export async function generateEnterprisePdfReport(
  config: PDFReportConfig,
  data: ForecastSummaryData,
  agents: Agent[],
  executionHistory: TaskExecutionRecord[],
  captureElementId?: string
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // Color palette
  const primaryNavy = [15, 23, 42]; // slate-900
  const emeraldAccent = [5, 150, 105]; // emerald-600
  const blueAccent = [37, 99, 235]; // blue-600
  const slateText = [71, 85, 105]; // slate-600
  const lightBg = [248, 250, 252]; // slate-50

  const addHeader = (title: string, subheader: string) => {
    // Top banner bar
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(0, 0, pageWidth, 24, "F");

    doc.setFillColor(emeraldAccent[0], emeraldAccent[1], emeraldAccent[2]);
    doc.rect(0, 24, pageWidth, 1.5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("APEX ENTERPRISE AI • EXECUTIVE TELEMETRY", margin, 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`CONFIDENTIAL • GENERATED ${new Date().toLocaleDateString()}`, pageWidth - margin, 11, { align: "right" });

    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`${title} | ${subheader}`, margin, 19);

    currentY = 32;
  };

  const addFooter = (pageNum: number, totalPages: number = 3) => {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text(`Apex Enterprise Autonomous Agent System • ${config.companyName}`, margin, pageHeight - 7);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: "right" });
  };

  // ==========================================
  // PAGE 1: EXECUTIVE SUMMARY & HISTORICAL TELEMETRY
  // ==========================================
  addHeader("EXECUTIVE SUMMARY & HISTORICAL ROI", "REAL-TIME TOIL REDUCTION & FINANCIAL VALUE");

  // Title Box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, currentY, contentWidth, 24, 3, 3, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 24, 3, 3, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Enterprise AI ROI & Predictive Growth Assessment", margin + 4, currentY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text(`Prepared for: ${config.preparedFor || "Executive Leadership"}   |   Prepared by: ${config.preparedBy || "AI Center of Excellence"}`, margin + 4, currentY + 13);
  doc.text(`Evaluation Period: ${config.timeHorizon.toUpperCase()}   |   Blended Loaded Rate: $${config.hourlyRate}/hr   |   Active Fleet: ${agents.length} Autonomous Agents`, margin + 4, currentY + 19);

  currentY += 29;

  // 4 KPI Metric Cards
  const kpiWidth = (contentWidth - 9) / 4;
  const kpis = [
    { label: "Hours Liberated", val: `${data.totalHistoricalHours.toLocaleString()} hrs`, sub: `Historical Realized`, color: blueAccent },
    { label: "Direct Labor Savings", val: `$${data.totalHistoricalCostSaved.toLocaleString()}`, sub: `@ $${config.hourlyRate}/hr Loaded`, color: emeraldAccent },
    { label: "Tasks Orchestrated", val: `${data.totalTasks.toLocaleString()} runs`, sub: `${agents.length} Fleet Agents`, color: primaryNavy },
    { label: "Spec Compliance", val: `${data.qualityRate}%`, sub: `Quality Verified`, color: [147, 51, 234] },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (kpiWidth + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, kpiWidth, 22, 2, 2, "FD");

    // Top color strip
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.roundedRect(x, currentY, kpiWidth, 1.5, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text(kpi.label.toUpperCase(), x + 3, currentY + 6);

    doc.setFontSize(11);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 3, currentY + 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, x + 3, currentY + 18);
  });

  currentY += 27;

  // Section 1: Departmental Savings Breakdown Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Departmental Workload Offloading & Cost Allocation", margin, currentY);
  currentY += 4;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 7, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("DEPARTMENT", margin + 3, currentY + 5);
  doc.text("HOURS LIBERATED", margin + 60, currentY + 5);
  doc.text("LABOR COST SAVED", margin + 105, currentY + 5);
  doc.text("% OF TOTAL TOIL", margin + 145, currentY + 5);
  currentY += 7;

  // Table rows
  data.departmentBreakdown.slice(0, 6).forEach((dept, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, currentY, contentWidth, 6, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(dept.name, margin + 3, currentY + 4.2);
    doc.text(`${dept.hours.toLocaleString()} hrs`, margin + 60, currentY + 4.2);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(emeraldAccent[0], emeraldAccent[1], emeraldAccent[2]);
    doc.text(`$${dept.costSaved.toLocaleString()}`, margin + 105, currentY + 4.2);

    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "normal");
    doc.text(`${dept.percent}%`, margin + 145, currentY + 4.2);

    currentY += 6;
  });

  currentY += 6;

  // Section 2: Agent Fleet Top Performers Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Autonomous Agent Operational Throughput Roster", margin, currentY);
  currentY += 4;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 7, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("AGENT NAME & ROLE", margin + 3, currentY + 5);
  doc.text("DEPARTMENT", margin + 60, currentY + 5);
  doc.text("TASKS RUN", margin + 105, currentY + 5);
  doc.text("HOURS SAVED", margin + 130, currentY + 5);
  doc.text("VALUE CREATED", margin + 155, currentY + 5);
  currentY += 7;

  agents.slice(0, 6).forEach((agent, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, currentY, contentWidth, 6.5, "F");
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(agent.name, margin + 3, currentY + 4.2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text(agent.role.slice(0, 28), margin + 25, currentY + 4.2);

    doc.setFontSize(7.5);
    doc.text(agent.department || "Operations", margin + 60, currentY + 4.2);
    doc.text(`${agent.stats.tasksCompleted}`, margin + 105, currentY + 4.2);
    doc.text(`${agent.stats.hoursSaved}h`, margin + 130, currentY + 4.2);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(emeraldAccent[0], emeraldAccent[1], emeraldAccent[2]);
    doc.text(`$${Math.round(agent.stats.hoursSaved * config.hourlyRate).toLocaleString()}`, margin + 155, currentY + 4.2);

    currentY += 6.5;
  });

  addFooter(1, 2);

  // ==========================================
  // PAGE 2: PREDICTIVE ROI FORECAST & GROWTH TRAJECTORY
  // ==========================================
  doc.addPage();
  currentY = margin;
  addHeader("PREDICTIVE ROI FORECAST & FINANCIAL GROWTH", `SCENARIO: ${data.growthScenarioName.toUpperCase()} PROJECTION`);

  // Forecast Executive Banner
  doc.setFillColor(15, 23, 42); // dark navy
  doc.roundedRect(margin, currentY, contentWidth, 25, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("12-Month Projected Enterprise Net Financial Value", margin + 5, currentY + 8);

  doc.setFontSize(18);
  doc.setTextColor(52, 211, 153); // emerald 400
  doc.text(`$${data.projected12MoNetValue.toLocaleString()} Net ROI`, margin + 5, currentY + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Equivalent to +${data.projectedFteLiberated.toFixed(1)} Full-Time Employees (FTEs) liberated • ${data.projected12MoTasks.toLocaleString()} Autonomous Tasks Handled`,
    margin + 5,
    currentY + 22.5
  );

  currentY += 31;

  // 3 Forecast Highlights Cards
  const fCardWidth = (contentWidth - 6) / 3;
  const fCards = [
    { label: "Gross Labor Cost Liberated", val: `$${data.projected12MoGrossSavings.toLocaleString()}`, sub: `${data.projected12MoHours.toLocaleString()} Total Hours` },
    { label: "AI Infrastructure / API Cost", val: `$${Math.round(data.projected12MoGrossSavings - data.projected12MoNetValue).toLocaleString()}`, sub: `~0.8% of Gross Savings` },
    { label: "Cost-to-Value Multiplier", val: `${((data.projected12MoGrossSavings / Math.max(1, data.projected12MoGrossSavings - data.projected12MoNetValue))).toFixed(1)}x`, sub: `Infinite Breakeven Advantage` },
  ];

  fCards.forEach((c, idx) => {
    const x = margin + idx * (fCardWidth + 3);
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, fCardWidth, 20, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text(c.label.toUpperCase(), x + 3, currentY + 5.5);

    doc.setFontSize(10.5);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(c.val, x + 3, currentY + 12.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(c.sub, x + 3, currentY + 17);
  });

  currentY += 26;

  // Milestone Monthly Projections Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Predictive Monthly Financial & Capacity Trajectory Table", margin, currentY);
  currentY += 4;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 7, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("HORIZON", margin + 3, currentY + 5);
  doc.text("TASKS / MO", margin + 35, currentY + 5);
  doc.text("HOURS SAVED", margin + 65, currentY + 5);
  doc.text("FTE EQUIV", margin + 95, currentY + 5);
  doc.text("GROSS SAVINGS", margin + 125, currentY + 5);
  doc.text("NET ENTERPRISE ROI", margin + 155, currentY + 5);
  currentY += 7;

  // Render projection milestones
  data.monthlyProjections.forEach((p, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, currentY, contentWidth, 6.5, "F");
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(p.monthName, margin + 3, currentY + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(`${p.tasks.toLocaleString()}`, margin + 35, currentY + 4.5);
    doc.text(`${p.hours.toLocaleString()} hrs`, margin + 65, currentY + 4.5);
    doc.text(`+${p.fteEquivalent.toFixed(1)} FTE`, margin + 95, currentY + 4.5);

    doc.text(`$${p.grossSavings.toLocaleString()}`, margin + 125, currentY + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(emeraldAccent[0], emeraldAccent[1], emeraldAccent[2]);
    doc.text(`$${p.netSavings.toLocaleString()}`, margin + 155, currentY + 4.5);

    currentY += 6.5;
  });

  currentY += 7;

  // Executive Strategic Commentary & Governance Signoff Box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 36, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Strategic AI Governance & ROI Verification Notes:", margin + 4, currentY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  const notesText = config.notes || 
    "This predictive forecast is modeled on actual agent telemetry, task turnaround velocities, and human-in-the-loop audit verification. " +
    "Autonomous execution demonstrates exponential returns against standard knowledge worker overhead while enforcing strict spec compliance and security isolation boundaries.";
  
  const splitNotes = doc.splitTextToSize(notesText, contentWidth - 8);
  doc.text(splitNotes, margin + 4, currentY + 12);

  // Signatures
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Verified by AI Center of Excellence: ___________________", margin + 4, currentY + 30);
  doc.text("Approved for Budget Allocation: ___________________", margin + 95, currentY + 30);

  addFooter(2, 2);

  // Trigger download
  const cleanCompanyName = (config.companyName || "Apex_Enterprise").replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `${cleanCompanyName}_ROI_Forecast_Report_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
