import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { downloadAsJson } from "@/lib/utils";
import { generateDashboardPDF } from "@/lib/pdf-export";

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
  const { data: dashboardData, refetch } = useQuery({
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
      const pdf = generateDashboardPDF(dashboardData, chartImages);
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
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
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
            <div className="py-6 text-center">
              <div className="inline-block p-3 rounded-full bg-blue-50 mb-4">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
              <p className="text-gray-500">Loading dashboard data...</p>
            </div>
          )}

          {/* Main Dashboard Widgets */}
          {dashboardData ? (
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {/* Risk Heatmap Widget */}
              <div className="lg:col-span-1 xl:col-span-1">
                <div className="dashboard-card h-full transition-all hover:shadow-md">
                  <RiskHeatmap heatmapData={dashboardData.heatmapData} />
                </div>
              </div>

              {/* Risks by Category Widget */}
              <div className="lg:col-span-1 xl:col-span-1">
                <div className="dashboard-card h-full transition-all hover:shadow-md">
                  <RisksByCategory categories={dashboardData.risksByCategory} />
                </div>
              </div>

              {/* Risk Trend Widget */}
              <div className="lg:col-span-2 xl:col-span-1">
                <div className="dashboard-card h-full transition-all hover:shadow-md">
                  <RiskTrend trendData={dashboardData.riskTrend} />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="dashboard-card h-64">
                <div className="h-full w-full flex items-center justify-center">
                  <div className="w-full h-48 bg-gray-100 animate-pulse rounded-lg"></div>
                </div>
              </div>
              <div className="dashboard-card h-64">
                <div className="h-full w-full flex items-center justify-center">
                  <div className="w-full h-48 bg-gray-100 animate-pulse rounded-lg"></div>
                </div>
              </div>
              <div className="dashboard-card h-64">
                <div className="h-full w-full flex items-center justify-center">
                  <div className="w-full h-48 bg-gray-100 animate-pulse rounded-lg"></div>
                </div>
              </div>
            </div>
          )}

          {/* Top Risks Table */}
          {dashboardData?.topRisks && (
            <div className="mt-8">
              <div className="dashboard-card">
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
              <div className="dashboard-card ai-gradient-bg">
                <AIInsights 
                  insights={dashboardData.insights} 
                  onRefresh={() => refetch()} 
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
