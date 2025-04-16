import { jsPDF } from "jspdf";
import { RiskSummary } from "@shared/schema";

/**
 * Generate a comprehensive PDF and force download using Blob and URL.createObjectURL
 */
export function generateAndDownloadCompletePDF(dashboardData: RiskSummary) {
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
  const boxMargin = 5;
  
  // Risks box
  pdf.setFillColor(41, 128, 185);
  pdf.roundedRect(centerX - boxWidth - boxMargin, statsY, boxWidth, boxHeight, 3, 3, "F");
  pdf.setTextColor(255);
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text(dashboardData.totalRisks.toString(), centerX - boxWidth/2 - boxMargin, statsY + 18, { align: "center" });
  pdf.setFontSize(10);
  pdf.text("Total Risks", centerX - boxWidth/2 - boxMargin, statsY + 28, { align: "center" });
  
  // Critical risks box
  pdf.setFillColor(231, 76, 60);
  pdf.roundedRect(centerX + boxMargin, statsY, boxWidth, boxHeight, 3, 3, "F");
  pdf.setTextColor(255);
  pdf.setFontSize(20);
  pdf.text(dashboardData.criticalRisks.toString(), centerX + boxWidth/2 + boxMargin, statsY + 18, { align: "center" });
  pdf.setFontSize(10);
  pdf.text("Critical Risks", centerX + boxWidth/2 + boxMargin, statsY + 28, { align: "center" });
  
  // High risks box
  pdf.setFillColor(243, 156, 18);
  pdf.roundedRect(centerX - boxWidth - boxMargin, statsY + boxHeight + boxMargin, boxWidth, boxHeight, 3, 3, "F");
  pdf.setTextColor(255);
  pdf.setFontSize(20);
  pdf.text(dashboardData.highRisks.toString(), centerX - boxWidth/2 - boxMargin, statsY + boxHeight + boxMargin + 18, { align: "center" });
  pdf.setFontSize(10);
  pdf.text("High Risks", centerX - boxWidth/2 - boxMargin, statsY + boxHeight + boxMargin + 28, { align: "center" });
  
  // Progress box
  pdf.setFillColor(46, 204, 113);
  pdf.roundedRect(centerX + boxMargin, statsY + boxHeight + boxMargin, boxWidth, boxHeight, 3, 3, "F");
  pdf.setTextColor(255);
  pdf.setFontSize(20);
  pdf.text(dashboardData.mitigationProgress + "%", centerX + boxWidth/2 + boxMargin, statsY + boxHeight + boxMargin + 18, { align: "center" });
  pdf.setFontSize(10);
  pdf.text("Mitigation", centerX + boxWidth/2 + boxMargin, statsY + boxHeight + boxMargin + 28, { align: "center" });
  
  // Add date
  pdf.setTextColor(100);
  pdf.setFontSize(12);
  const date = new Date().toLocaleDateString();
  pdf.text(`Generated: ${date}`, pageWidth / 2, pageHeight - 30, { align: "center" });
  
  // Add Table of Contents Page
  pdf.addPage();
  currentY = margin;
  
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
  
  // ----- 1. Executive Summary -----
  pdf.addPage();
  currentY = margin;
  
  pdf.setFontSize(18);
  pdf.setTextColor(44, 62, 80);
  pdf.setFont("helvetica", "bold");
  pdf.text("1. Executive Summary", margin, currentY);
  currentY += 10;
  
  // Summary text
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(60, 64, 67);
  pdf.text("This report provides an overview of the current risk landscape across projects.", margin, currentY);
  currentY += 10;
  
  // Key metrics 
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Key Metrics:", margin, currentY);
  currentY += 8;
  
  pdf.setFont("helvetica", "normal");
  pdf.text(`• Total Risks: ${dashboardData.totalRisks}`, margin, currentY);
  currentY += 7;
  pdf.text(`• Critical Risks: ${dashboardData.criticalRisks}`, margin, currentY);
  currentY += 7;
  pdf.text(`• High Risks: ${dashboardData.highRisks}`, margin, currentY);
  currentY += 7;
  pdf.text(`• Mitigation Progress: ${dashboardData.mitigationProgress}%`, margin, currentY);
  currentY += 15;
  
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
  currentY += 10;
  
  // Create a simple heatmap representation
  const heatmapHeight = 60;
  
  // Draw heatmap grid (5x5)
  const cellSize = contentWidth / 5;
  
  // Header
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("Impact →", margin, currentY - 2);
  pdf.text("Probability ↓", margin - 10, currentY + 15, { angle: 90 });
  
  // Draw the heatmap cells
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const x = margin + j * cellSize;
      const y = currentY + i * (cellSize * 0.6);
      
      // Determine cell color
      let color;
      const impact = 5 - i;
      const probability = j + 1;
      const severity = getSeverity(probability, impact);
      
      switch (severity) {
        case "Critical":
          color = [220, 53, 69]; // Red
          break;
        case "High":
          color = [253, 126, 20]; // Orange
          break;
        case "Medium":
          color = [255, 193, 7]; // Yellow
          break;
        case "Low":
          color = [25, 135, 84]; // Green
          break;
        case "Very Low":
          color = [13, 202, 240]; // Light blue
          break;
        default:
          color = [255, 255, 255]; // White
      }
      
      // Find count for this cell
      const cellData = dashboardData.heatmapData.find(
        cell => cell.impact === impact && cell.probability === probability
      );
      const count = cellData ? cellData.count : 0;
      
      // Draw the cell
      pdf.setFillColor(color[0], color[1], color[2]);
      pdf.rect(x, y, cellSize, cellSize * 0.6, 'F');
      
      // Add count if > 0
      if (count > 0) {
        pdf.setTextColor(0);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text(count.toString(), x + cellSize/2, y + (cellSize * 0.6)/2, { 
          align: 'center',
          baseline: 'middle'
        });
      }
    }
  }
  
  currentY += heatmapHeight;
  
  // 2.2 Risks by Category
  if (currentY > pageHeight - 100) {
    pdf.addPage();
    currentY = margin;
  } else {
    currentY += 20;
  }
  
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("2.2 Risks by Category", margin, currentY);
  currentY += 10;
  
  // Draw category bars
  const categories = dashboardData.risksByCategory;
  const maxCount = Math.max(...categories.map(c => c.count));
  const barHeight = 12;
  const barGap = 8;
  const barMaxWidth = contentWidth - 70; // Leave space for labels
  
  categories.forEach((cat, index) => {
    const y = currentY + index * (barHeight + barGap);
    
    // Category name
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(44, 62, 80);
    pdf.text(cat.category, margin, y + barHeight/2);
    
    // Bar
    const barWidth = (cat.count / maxCount) * barMaxWidth;
    let color;
    
    // Different color per category
    switch (index % 5) {
      case 0: color = [41, 128, 185]; break; // Blue
      case 1: color = [46, 204, 113]; break; // Green
      case 2: color = [243, 156, 18]; break; // Orange
      case 3: color = [142, 68, 173]; break; // Purple
      case 4: color = [22, 160, 133]; break; // Teal
      default: color = [41, 128, 185]; // Default blue
    }
    
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(margin + 50, y, barWidth, barHeight, 'F');
    
    // Count
    pdf.setFontSize(9);
    pdf.setTextColor(44, 62, 80);
    pdf.text(cat.count.toString(), margin + 55 + barWidth, y + barHeight/2);
  });
  
  currentY += (categories.length * (barHeight + barGap)) + 10;
  
  // 2.3 Risk Trend Analysis
  if (currentY > pageHeight - 100) {
    pdf.addPage();
    currentY = margin;
  } else {
    currentY += 10;
  }
  
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("2.3 Risk Trend Analysis", margin, currentY);
  currentY += 10;
  
  // Risk trend table
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  
  // Table headers
  pdf.setFillColor(41, 128, 185);
  pdf.setTextColor(255);
  pdf.rect(margin, currentY, contentWidth, 10, 'F');
  
  const colWidth = contentWidth / 4;
  pdf.text("Month", margin + colWidth/2, currentY + 6, { align: 'center' });
  pdf.text("Critical", margin + colWidth + colWidth/2, currentY + 6, { align: 'center' });
  pdf.text("High", margin + colWidth*2 + colWidth/2, currentY + 6, { align: 'center' });
  pdf.text("Medium", margin + colWidth*3 + colWidth/2, currentY + 6, { align: 'center' });
  
  currentY += 10;
  
  // Table rows
  pdf.setTextColor(44, 62, 80);
  pdf.setFont("helvetica", "normal");
  
  dashboardData.riskTrend.forEach((trend, index) => {
    const rowY = currentY + (index * 8);
    
    // Alternating row backgrounds
    if (index % 2 === 0) {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, rowY, contentWidth, 8, 'F');
    }
    
    pdf.text(trend.month, margin + colWidth/2, rowY + 5, { align: 'center' });
    pdf.text(trend.critical.toString(), margin + colWidth + colWidth/2, rowY + 5, { align: 'center' });
    pdf.text(trend.high.toString(), margin + colWidth*2 + colWidth/2, rowY + 5, { align: 'center' });
    pdf.text(trend.medium.toString(), margin + colWidth*3 + colWidth/2, rowY + 5, { align: 'center' });
  });
  
  currentY += (dashboardData.riskTrend.length * 8) + 15;
  
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
  currentY += 15;
  
  // Top risks table
  const topRisks = dashboardData.topRisks;
  
  // Table headers
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setFillColor(41, 128, 185);
  pdf.setTextColor(255);
  pdf.rect(margin, currentY, contentWidth, 10, 'F');
  
  const riskColWidths = [25, contentWidth - 115, 30, 30, 30];
  pdf.text("ID", margin + riskColWidths[0]/2, currentY + 6, { align: 'center' });
  pdf.text("Title", margin + riskColWidths[0] + riskColWidths[1]/2, currentY + 6, { align: 'center' });
  pdf.text("Category", margin + riskColWidths[0] + riskColWidths[1] + riskColWidths[2]/2, currentY + 6, { align: 'center' });
  pdf.text("Severity", margin + riskColWidths[0] + riskColWidths[1] + riskColWidths[2] + riskColWidths[3]/2, currentY + 6, { align: 'center' });
  pdf.text("Status", margin + riskColWidths[0] + riskColWidths[1] + riskColWidths[2] + riskColWidths[3] + riskColWidths[4]/2, currentY + 6, { align: 'center' });
  
  currentY += 10;
  
  // Table rows
  pdf.setTextColor(44, 62, 80);
  pdf.setFont("helvetica", "normal");
  
  topRisks.forEach((risk, index) => {
    const rowY = currentY + (index * 15);
    const rowHeight = 15;
    
    // Alternating row backgrounds
    if (index % 2 === 0) {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, rowY, contentWidth, rowHeight, 'F');
    }
    
    pdf.text(risk.reference_id, margin + riskColWidths[0]/2, rowY + rowHeight/2, { align: 'center', baseline: 'middle' });
    
    // Title (may need wrapping)
    const titleX = margin + riskColWidths[0];
    const titleMaxWidth = riskColWidths[1] - 4;
    pdf.text(risk.title, titleX + 2, rowY + rowHeight/2, { baseline: 'middle', maxWidth: titleMaxWidth });
    
    // Category
    pdf.text(
      risk.category, 
      margin + riskColWidths[0] + riskColWidths[1] + riskColWidths[2]/2, 
      rowY + rowHeight/2, 
      { align: 'center', baseline: 'middle' }
    );
    
    // Severity
    pdf.text(
      risk.severity, 
      margin + riskColWidths[0] + riskColWidths[1] + riskColWidths[2] + riskColWidths[3]/2, 
      rowY + rowHeight/2, 
      { align: 'center', baseline: 'middle' }
    );
    
    // Status
    pdf.text(
      risk.status, 
      margin + riskColWidths[0] + riskColWidths[1] + riskColWidths[2] + riskColWidths[3] + riskColWidths[4]/2, 
      rowY + rowHeight/2, 
      { align: 'center', baseline: 'middle' }
    );
  });
  
  currentY += (topRisks.length * 15) + 15;
  
  // ----- 4. AI Insights -----
  if (currentY > pageHeight - 100) {
    pdf.addPage();
    currentY = margin;
  } else {
    currentY += 10;
  }
  
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(44, 62, 80);
  pdf.text("4. AI Risk Insights", margin, currentY);
  currentY += 10;
  
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.text("AI-generated insights and recommendations based on risk data analysis.", margin, currentY);
  currentY += 15;
  
  // AI Insights
  dashboardData.insights.forEach((insight, index) => {
    if (currentY > pageHeight - 50) {
      pdf.addPage();
      currentY = margin;
    }
    
    // Insight box
    pdf.setFillColor(235, 245, 255);
    pdf.roundedRect(margin, currentY, contentWidth, 40, 3, 3, 'F');
    
    // Title
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(41, 128, 185);
    pdf.text(insight.title, margin + 5, currentY + 10);
    
    // Type badge
    pdf.setFillColor(41, 128, 185);
    pdf.setTextColor(255);
    pdf.setFontSize(8);
    const typeWidth = pdf.getTextWidth(insight.type) + 6;
    pdf.roundedRect(margin + contentWidth - typeWidth - 5, currentY + 5, typeWidth, 8, 2, 2, 'F');
    pdf.text(insight.type, margin + contentWidth - typeWidth/2 - 5, currentY + 9, { align: 'center' });
    
    // Description
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(44, 62, 80);
    
    // Limit description text to fit
    let description = insight.description;
    if (description.length > 200) {
      description = description.substring(0, 200) + "...";
    }
    
    pdf.text(description, margin + 5, currentY + 20, { maxWidth: contentWidth - 10 });
    
    currentY += 50;
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
      pdf.text(`Generated: ${date}`, margin, pageHeight - 10);
    }
  }
  
  // Get the PDF as a blob
  const pdfBlob = pdf.output('blob');
  
  // Create a URL for the blob
  const url = URL.createObjectURL(pdfBlob);
  
  // Create a link element
  const link = document.createElement('a');
  link.href = url;
  link.download = 'RiskManagement-Dashboard-Report.pdf';
  
  // Append to the document
  document.body.appendChild(link);
  
  // Trigger click
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return pdf;
}

// Helper function to determine severity based on impact and probability
function getSeverity(probability: number, impact: number): string {
  const score = probability * impact;
  
  if (score >= 20) return "Critical";
  if (score >= 15) return "High";
  if (score >= 10) return "Medium";
  if (score >= 5) return "Low";
  return "Very Low";
}