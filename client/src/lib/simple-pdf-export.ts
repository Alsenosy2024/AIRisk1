import { jsPDF } from "jspdf";
import { RiskSummary } from "@shared/schema";

/**
 * A simple PDF export function that doesn't depend on autoTable
 */
export function generateSimplePDF(dashboardData: RiskSummary) {
  // Initialize PDF document
  const pdf = new jsPDF();
  
  // Add title
  pdf.setFontSize(22);
  pdf.text("Risk Management Dashboard Report", 20, 20);
  
  // Add date
  const date = new Date().toLocaleDateString();
  pdf.setFontSize(12);
  pdf.text(`Generated: ${date}`, 20, 30);
  
  // Add summary
  pdf.setFontSize(16);
  pdf.text("Summary", 20, 45);
  pdf.setFontSize(12);
  pdf.text(`Total Risks: ${dashboardData.totalRisks}`, 20, 55);
  pdf.text(`Critical Risks: ${dashboardData.criticalRisks}`, 20, 65);
  pdf.text(`High Risks: ${dashboardData.highRisks}`, 20, 75);
  pdf.text(`Mitigation Progress: ${dashboardData.mitigationProgress}%`, 20, 85);
  
  // Add categories
  pdf.setFontSize(16);
  pdf.text("Risk Categories", 20, 105);
  
  let yPos = 115;
  dashboardData.risksByCategory.forEach(cat => {
    pdf.setFontSize(12);
    pdf.text(`${cat.category}: ${cat.count}`, 20, yPos);
    yPos += 10;
  });
  
  // Add top risks
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.text("Top Risks", 20, 20);
  
  yPos = 30;
  dashboardData.topRisks.slice(0, 5).forEach(risk => {
    pdf.setFontSize(12);
    pdf.text(`${risk.reference_id} - ${risk.title} (${risk.severity})`, 20, yPos);
    yPos += 10;
  });
  
  return pdf;
}