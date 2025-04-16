import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { downloadAsJson } from "@/lib/utils";
import { generateDashboardPDF } from "@/lib/pdf-export";
import { generateSimplePDF } from "@/lib/simple-pdf-export";
import { generateAndDownloadPDF } from "@/lib/blob-pdf-export";
import { generateAndDownloadCompletePDF } from "@/lib/complete-pdf-export";
import { RiskSummary } from "@shared/schema";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { RiskSummaryCards } from "@/components/dashboard/risk-summary-cards";
import { RiskHeatmap } from "@/components/dashboard/risk-heatmap";
import { RisksByCategory } from "@/components/dashboard/risks-by-category";
import { RiskTrend } from "@/components/dashboard/risk-trend";
import { TopRisksTable } from "@/components/dashboard/top-risks-table";
import { AIInsights } from "@/components/dashboard/ai-insights";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const { toast } = useToast();
  
  // Refs for chart canvas elements to capture for PDF export
  const heatmapRef = useRef<HTMLCanvasElement>(null);
  const categoryChartRef = useRef<HTMLCanvasElement>(null);
  const trendChartRef = useRef<HTMLCanvasElement>(null);

  // Fetch dashboard data
  const { data: dashboardData, refetch } = useQuery<RiskSummary>({
    queryKey: ["/api/dashboard"],
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleExportDashboard = () => {
    if (dashboardData) {
      // Show format selection dialog or options
      const exportToPDF = window.confirm("Export to PDF? (Click Cancel for JSON export)");
      
      if (exportToPDF) {
        exportDashboardToPDF();
      } else {
        // Fall back to JSON export
        downloadAsJson(dashboardData, "risk-dashboard-export.json");
        toast({
          title: "Dashboard Exported",
          description: "Dashboard data has been exported as JSON",
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "No dashboard data available to export",
      });
    }
  };
  
  // Function to export dashboard to PDF
  const exportDashboardToPDF = () => {
    if (!dashboardData) return;
    
    try {
      // Try complete comprehensive PDF export first
      try {
        console.log("Using comprehensive PDF export method...");
        generateAndDownloadCompletePDF(dashboardData);
        console.log("Comprehensive PDF export completed");
        
        toast({
          title: "PDF Export Successful",
          description: "Dashboard has been exported as a comprehensive PDF report with all elements. Check your downloads folder.",
          duration: 5000,
        });
        return;
      } catch (completeError) {
        console.error("Comprehensive PDF export failed, trying simpler method:", completeError);
      }
      
      // If simple export fails, try the comprehensive one
      // Gather chart canvas images if available
      const chartImages: {
        heatmap?: string;
        categories?: string;
        trend?: string;
      } = {};
      
      // Capture chart images if possible
      const canvasElements = document.querySelectorAll('canvas');
      canvasElements.forEach(canvas => {
        // Try to identify which chart this is by parent container's content/classes
        const parentElement = canvas.parentElement?.parentElement;
        if (!parentElement) return;
        
        const parentHTML = parentElement.innerHTML || '';
        
        if (parentHTML.includes('Heatmap') || parentHTML.includes('impact') || parentHTML.includes('probability')) {
          chartImages.heatmap = canvas.toDataURL('image/png');
        } else if (parentHTML.includes('Category') || parentHTML.includes('categories')) {
          chartImages.categories = canvas.toDataURL('image/png');
        } else if (parentHTML.includes('Trend') || parentHTML.includes('month')) {
          chartImages.trend = canvas.toDataURL('image/png');
        }
      });
      
      // Generate and download the PDF
      const pdf = generateDashboardPDF(dashboardData as RiskSummary, chartImages);
      pdf.save('RiskManagement-Dashboard-Report.pdf');
      
      toast({
        title: "PDF Export Successful",
        description: "Dashboard has been exported as a comprehensive PDF report",
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        variant: "destructive",
        title: "PDF Export Failed",
        description: error instanceof Error ? error.message : "Unknown error during export",
      });
    }
  };

  const handleCreateRisk = () => {
    refetch();
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      {sidebarVisible && <Sidebar />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white/80 p-4 sm:p-6 lg:p-8">
          {/* Dashboard Header */}
          <DashboardHeader 
            onCreateRisk={handleCreateRisk} 
            onExport={handleExportDashboard} 
          />

          {/* Risk Summary Cards */}
          {dashboardData ? (
            <div className="mt-6">
              <RiskSummaryCards
                totalRisks={dashboardData.totalRisks}
                criticalRisks={dashboardData.criticalRisks}
                highRisks={dashboardData.highRisks}
                mitigationProgress={dashboardData.mitigationProgress}
              />
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="inline-block p-4 rounded-full bg-blue-50/50 backdrop-blur-sm mb-4 shadow-sm">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
              <p className="text-gray-500 font-medium">Loading dashboard data...</p>
            </div>
          )}

          {/* Main Dashboard Widgets */}
          {dashboardData ? (
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {/* Risk Heatmap Widget */}
              <div className="lg:col-span-1 xl:col-span-1">
                <div className="dashboard-card h-full glass-card">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">Risk Heatmap</h3>
                  <RiskHeatmap heatmapData={dashboardData.heatmapData} />
                </div>
              </div>

              {/* Risks by Category Widget */}
              <div className="lg:col-span-1 xl:col-span-1">
                <div className="dashboard-card h-full glass-card">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">Risk Categories</h3>
                  <RisksByCategory categories={dashboardData.risksByCategory} />
                </div>
              </div>

              {/* Risk Trend Widget */}
              <div className="lg:col-span-2 xl:col-span-1">
                <div className="dashboard-card h-full glass-card">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">Risk Trends</h3>
                  <RiskTrend trendData={dashboardData.riskTrend} />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="dashboard-card h-64 glass-card">
                <h3 className="text-lg font-medium mb-4 text-gray-800">Risk Heatmap</h3>
                <div className="h-full w-full flex items-center justify-center">
                  <div className="w-full h-48 bg-gray-100/50 animate-pulse rounded-xl"></div>
                </div>
              </div>
              <div className="dashboard-card h-64 glass-card">
                <h3 className="text-lg font-medium mb-4 text-gray-800">Risk Categories</h3>
                <div className="h-full w-full flex items-center justify-center">
                  <div className="w-full h-48 bg-gray-100/50 animate-pulse rounded-xl"></div>
                </div>
              </div>
              <div className="dashboard-card h-64 glass-card">
                <h3 className="text-lg font-medium mb-4 text-gray-800">Risk Trends</h3>
                <div className="h-full w-full flex items-center justify-center">
                  <div className="w-full h-48 bg-gray-100/50 animate-pulse rounded-xl"></div>
                </div>
              </div>
            </div>
          )}

          {/* Top Risks Table */}
          {dashboardData?.topRisks && (
            <div className="mt-8">
              <div className="dashboard-card glass-card">
                <h3 className="text-lg font-medium mb-4 text-gray-800">Top Risks</h3>
                <TopRisksTable 
                  risks={dashboardData.topRisks} 
                  onRefresh={() => refetch()} 
                />
              </div>
            </div>
          )}

          {/* AI Insights Section */}
          {dashboardData?.insights && (
            <div className="mt-8">
              <div className="dashboard-card ai-gradient-bg overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/5 backdrop-blur-xl"></div>
                <div className="relative">
                  <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
                      <path d="M12 2a10 10 0 0 1 10 10h-10V2z"></path>
                      <circle cx="12" cy="12" r="4"></circle>
                    </svg>
                    AI-Powered Insights
                  </h3>
                  <AIInsights 
                    insights={dashboardData.insights} 
                    onRefresh={() => refetch()} 
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
