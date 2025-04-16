import { jsPDF } from "jspdf";
import { RiskSummary } from "@shared/schema";
import { getColorBySeverity, getColorByCategory } from "@/lib/utils";
import { HeatmapCell, getSeverity } from "@/lib/risk-utils";
// Import jspdf-autotable to extend jsPDF with autoTable method
import 'jspdf-autotable';

/**
 * Generates a comprehensive PDF report of the dashboard
 * @param dashboardData Dashboard data containing all risk metrics and insights
 * @param chartImageUrls Object containing canvas image URLs of charts (base64)
 */
export function generateDashboardPDF(
  dashboardData: RiskSummary,
  chartImageUrls: {
    heatmap?: string;
    categories?: string;
    trend?: string;
  } = {}
) {
  // Initialize PDF document (A4 size)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  
  let currentY = margin;
  
  // ----- Cover Page -----
  addCoverPage(pdf, dashboardData);
  pdf.addPage();
  currentY = margin;
  
  // ----- Table of Contents -----
  addTableOfContents(pdf);
  pdf.addPage();
  currentY = margin;
  
  // ----- 1. Executive Summary -----
  pdf.setFontSize(18);
  pdf.setTextColor(44, 62, 80);
  pdf.setFont("helvetica", "bold");
  pdf.text("1. Executive Summary", margin, currentY);
  currentY += 10;
  
  // Summary metrics
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(60, 64, 67);
  pdf.text("This report provides an overview of the current risk landscape across projects.", margin, currentY);
  currentY += 10;
  
  // Key metrics table
  const metricsData = [
    ["Total Risks", dashboardData.totalRisks.toString()],
    ["Critical Risks", dashboardData.criticalRisks.toString()],
    ["High Risks", dashboardData.highRisks.toString()],
    ["Mitigation Progress", `${dashboardData.mitigationProgress}%`]
  ];
  
  const tableResult = (pdf as any).autoTable({
    startY: currentY,
    head: [["Metric", "Value"]],
    body: metricsData,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 10 },
    margin: { left: margin, right: margin }
  });
  
  currentY = (tableResult.lastAutoTable || tableResult).finalY + 15;
  
  // ----- 2. Risk Distribution -----
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(44, 62, 80);
  pdf.text("2. Risk Distribution", margin, currentY);
  currentY += 10;
  
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.text("Analysis of risks by severity, category, and distribution.", margin, currentY);
  currentY += 10;
  
  // 2.1 Heatmap
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("2.1 Risk Heatmap", margin, currentY);
  currentY += 8;
  
  // If heatmap image available, add it
  if (chartImageUrls.heatmap) {
    pdf.addImage(chartImageUrls.heatmap, 'PNG', margin, currentY, contentWidth, contentWidth * 0.7);
    currentY += contentWidth * 0.7 + 10;
  } else {
    // Otherwise add a table representation of the heatmap
    const heatmapResult = addHeatmapTable(pdf, dashboardData.heatmapData, currentY);
    currentY = (heatmapResult.lastAutoTable || heatmapResult).finalY + 15;
  }
  
  // Check if we need a new page for the next section
  if (currentY > pageHeight - 60) {
    pdf.addPage();
    currentY = margin;
  }
  
  // 2.2 Risks by Category
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("2.2 Risks by Category", margin, currentY);
  currentY += 8;
  
  // If category chart image available, add it
  if (chartImageUrls.categories) {
    pdf.addImage(chartImageUrls.categories, 'PNG', margin, currentY, contentWidth, contentWidth * 0.6);
    currentY += contentWidth * 0.6 + 10;
  }
  
  // Add category table
  const categoryData = dashboardData.risksByCategory.map(cat => [
    cat.category, cat.count.toString()
  ]);
  
  const categoryResult = (pdf as any).autoTable({
    startY: currentY,
    head: [["Category", "Count"]],
    body: categoryData,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 10 },
    margin: { left: margin, right: margin }
  });
  
  currentY = (categoryResult.lastAutoTable || categoryResult).finalY + 15;
  
  // Check if we need a new page
  if (currentY > pageHeight - 70) {
    pdf.addPage();
    currentY = margin;
  }
  
  // 2.3 Risk Trend Analysis
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("2.3 Risk Trend Analysis", margin, currentY);
  currentY += 8;
  
  // If trend chart image available, add it
  if (chartImageUrls.trend) {
    pdf.addImage(chartImageUrls.trend, 'PNG', margin, currentY, contentWidth, contentWidth * 0.5);
    currentY += contentWidth * 0.5 + 10;
  }
  
  // Add trend table
  const trendData = dashboardData.riskTrend.map(trend => [
    trend.month,
    trend.critical.toString(),
    trend.high.toString(),
    trend.medium.toString()
  ]);
  
  const trendResult = (pdf as any).autoTable({
    startY: currentY,
    head: [["Month", "Critical", "High", "Medium"]],
    body: trendData,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 10 },
    margin: { left: margin, right: margin }
  });
  
  currentY = (trendResult.lastAutoTable || trendResult).finalY + 15;
  
  // ----- 3. Top Risks -----
  pdf.addPage();
  currentY = margin;
  
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(44, 62, 80);
  pdf.text("3. Top Risks", margin, currentY);
  currentY += 10;
  
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.text("Details of the highest severity risks requiring attention.", margin, currentY);
  currentY += 10;
  
  const topRisksData = dashboardData.topRisks.map(risk => [
    risk.reference_id,
    risk.title,
    risk.category,
    risk.severity,
    risk.status
  ]);
  
  const topRisksResult = (pdf as any).autoTable({
    startY: currentY,
    head: [["Reference", "Title", "Category", "Severity", "Status"]],
    body: topRisksData,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 70 }
    }
  });
  
  currentY = (topRisksResult.lastAutoTable || topRisksResult).finalY + 15;
  
  // ----- 4. AI Insights -----
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(44, 62, 80);
  pdf.text("4. AI Risk Insights", margin, currentY);
  currentY += 10;
  
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.text("AI-generated insights and recommendations based on risk data analysis.", margin, currentY);
  currentY += 10;
  
  const insightData = dashboardData.insights.map(insight => [
    insight.title,
    insight.type,
    insight.description.substring(0, 100) + (insight.description.length > 100 ? "..." : "")
  ]);
  
  const insightResult = (pdf as any).autoTable({
    startY: currentY,
    head: [["Insight", "Type", "Description"]],
    body: insightData,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
    columnStyles: {
      2: { cellWidth: 80 }
    }
  });
  
  // Add footer to all pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    
    if (i > 1) { // Skip footer on cover page
      // Add page number
      pdf.setFontSize(10);
      pdf.setTextColor(150);
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
      
      // Add generation date
      const date = new Date().toLocaleDateString();
      pdf.text(`Generated: ${date}`, margin, pageHeight - 10);
    }
  }
  
  return pdf;
}

// Helper function to add the cover page
function addCoverPage(pdf: jsPDF, data: RiskSummary) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Add background color
  pdf.setFillColor(235, 245, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");
  
  // Add blue header bar
  pdf.setFillColor(41, 128, 185);
  pdf.rect(0, 0, pageWidth, 50, "F");
  
  // Add title
  pdf.setFontSize(26);
  pdf.setTextColor(255);
  pdf.setFont("helvetica", "bold");
  pdf.text("Risk Management Dashboard", pageWidth / 2, 30, { align: "center" });
  
  // Add subtitle
  pdf.setFontSize(16);
  pdf.text("Comprehensive Risk Analysis Report", pageWidth / 2, 45, { align: "center" });
  
  // Add company name/logo placeholder
  pdf.setFontSize(20);
  pdf.setTextColor(44, 62, 80);
  pdf.text("RiskAI Pro", pageWidth / 2, 80, { align: "center" });
  
  // Add report summary
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "normal");
  pdf.text("Executive Summary", pageWidth / 2, 110, { align: "center" });
  
  // Add key stats
  const centerX = pageWidth / 2;
  const statsY = 130;
  const boxWidth = 40;
  const boxHeight = 35;
  const margin = 5;
  
  // Risks box
  pdf.setFillColor(41, 128, 185);
  pdf.roundedRect(centerX - boxWidth - margin, statsY, boxWidth, boxHeight, 3, 3, "F");
  pdf.setTextColor(255);
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.totalRisks.toString(), centerX - boxWidth/2 - margin, statsY + 18, { align: "center" });
  pdf.setFontSize(10);
  pdf.text("Total Risks", centerX - boxWidth/2 - margin, statsY + 28, { align: "center" });
  
  // Critical risks box
  pdf.setFillColor(231, 76, 60);
  pdf.roundedRect(centerX + margin, statsY, boxWidth, boxHeight, 3, 3, "F");
  pdf.setTextColor(255);
  pdf.setFontSize(20);
  pdf.text(data.criticalRisks.toString(), centerX + boxWidth/2 + margin, statsY + 18, { align: "center" });
  pdf.setFontSize(10);
  pdf.text("Critical Risks", centerX + boxWidth/2 + margin, statsY + 28, { align: "center" });
  
  // High risks box
  pdf.setFillColor(243, 156, 18);
  pdf.roundedRect(centerX - boxWidth - margin, statsY + boxHeight + margin, boxWidth, boxHeight, 3, 3, "F");
  pdf.setTextColor(255);
  pdf.setFontSize(20);
  pdf.text(data.highRisks.toString(), centerX - boxWidth/2 - margin, statsY + boxHeight + margin + 18, { align: "center" });
  pdf.setFontSize(10);
  pdf.text("High Risks", centerX - boxWidth/2 - margin, statsY + boxHeight + margin + 28, { align: "center" });
  
  // Progress box
  pdf.setFillColor(46, 204, 113);
  pdf.roundedRect(centerX + margin, statsY + boxHeight + margin, boxWidth, boxHeight, 3, 3, "F");
  pdf.setTextColor(255);
  pdf.setFontSize(20);
  pdf.text(data.mitigationProgress + "%", centerX + boxWidth/2 + margin, statsY + boxHeight + margin + 18, { align: "center" });
  pdf.setFontSize(10);
  pdf.text("Mitigation", centerX + boxWidth/2 + margin, statsY + boxHeight + margin + 28, { align: "center" });
  
  // Add date
  pdf.setTextColor(100);
  pdf.setFontSize(12);
  const date = new Date().toLocaleDateString();
  pdf.text(`Generated: ${date}`, pageWidth / 2, pageHeight - 30, { align: "center" });
}

// Helper function to add table of contents
function addTableOfContents(pdf: jsPDF) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  let currentY = margin;
  
  // Title
  pdf.setFontSize(18);
  pdf.setTextColor(44, 62, 80);
  pdf.setFont("helvetica", "bold");
  pdf.text("Table of Contents", margin, currentY);
  currentY += 15;
  
  // Sections
  const sections = [
    { title: "1. Executive Summary", page: 3 },
    { title: "2. Risk Distribution", page: 3 },
    { title: "   2.1 Risk Heatmap", page: 3 },
    { title: "   2.2 Risks by Category", page: 4 },
    { title: "   2.3 Risk Trend Analysis", page: 4 },
    { title: "3. Top Risks", page: 5 },
    { title: "4. AI Risk Insights", page: 5 }
  ];
  
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  
  sections.forEach(section => {
    // Section name
    pdf.text(section.title, margin, currentY);
    
    // Add dots
    const titleWidth = pdf.getTextWidth(section.title);
    const pageNumWidth = pdf.getTextWidth(section.page.toString());
    const dotsWidth = pageWidth - margin * 2 - titleWidth - pageNumWidth - 5;
    const numDots = Math.floor(dotsWidth / pdf.getTextWidth("."));
    const dots = ".".repeat(numDots);
    
    pdf.text(dots, margin + titleWidth + 2, currentY);
    
    // Page number
    pdf.text(section.page.toString(), pageWidth - margin - pageNumWidth, currentY);
    
    currentY += 10;
  });
}

// Helper function to create a heatmap representation as a table
function addHeatmapTable(pdf: jsPDF, heatmapData: { impact: number; probability: number; count: number }[], startY: number): any {
  const cellData: string[][] = [
    ['', '1', '2', '3', '4', '5'],
    ['5', '', '', '', '', ''],
    ['4', '', '', '', '', ''],
    ['3', '', '', '', '', ''],
    ['2', '', '', '', '', ''],
    ['1', '', '', '', '', '']
  ];
  
  // Fill in the counts
  heatmapData.forEach(cell => {
    if (cell.impact >= 1 && cell.impact <= 5 && cell.probability >= 1 && cell.probability <= 5) {
      cellData[6 - cell.impact][cell.probability] = cell.count.toString();
    }
  });
  
  // Create a color map for the cells
  const colors: any[] = [];
  
  for (let i = 0; i < 6; i++) {
    colors.push([]);
    for (let j = 0; j < 6; j++) {
      colors[i].push(null);
    }
  }
  
  // Header row (white)
  for (let j = 0; j < 6; j++) {
    colors[0][j] = [240, 240, 240];
  }
  
  // First column (white)
  for (let i = 0; i < 6; i++) {
    colors[i][0] = [240, 240, 240];
  }
  
  // Fill in the heatmap colors
  for (let impact = 1; impact <= 5; impact++) {
    for (let prob = 1; prob <= 5; prob++) {
      const severity = getSeverity(prob, impact);
      let color;
      
      switch (severity) {
        case "Critical":
          color = [220, 53, 69]; // red
          break;
        case "High":
          color = [253, 126, 20]; // orange
          break;
        case "Medium":
          color = [255, 193, 7]; // yellow
          break;
        case "Low":
          color = [25, 135, 84]; // green
          break;
        case "Very Low":
          color = [13, 202, 240]; // light blue
          break;
        default:
          color = [255, 255, 255]; // white
      }
      
      colors[6 - impact][prob] = color;
    }
  }
  
  const result = (pdf as any).autoTable({
    startY: startY,
    head: [["", "Very Low", "Low", "Medium", "High", "Very High"]],
    body: [
      ["Very High", ...cellData[1].slice(1)],
      ["High", ...cellData[2].slice(1)],
      ["Medium", ...cellData[3].slice(1)],
      ["Low", ...cellData[4].slice(1)],
      ["Very Low", ...cellData[5].slice(1)]
    ],
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { 
      fontSize: 10,
      cellPadding: 5,
      halign: 'center'
    },
    didDrawCell: function(data: any) {
      // Color the cells based on severity
      if (data.row.index >= 0 && data.column.index >= 1) {
        const rowIndex = data.row.index + 1;
        const colIndex = data.column.index;
        if (colors[rowIndex] && colors[rowIndex][colIndex]) {
          const color = colors[rowIndex][colIndex];
          pdf.setFillColor(color[0], color[1], color[2]);
          pdf.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          
          // Add text on top
          const value = cellData[rowIndex][colIndex];
          if (value) {
            pdf.setTextColor(0);
            pdf.setFontSize(10);
            pdf.text(
              value, 
              data.cell.x + data.cell.width / 2, 
              data.cell.y + data.cell.height / 2 + 1,
              { align: 'center', baseline: 'middle' }
            );
          }
        }
      }
    }
  });
  
  return result;
}