import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { downloadAsJson } from "@/lib/utils";
import { generateDashboardPDF } from "@/lib/pdf-export";
import { generateSimplePDF } from "@/lib/simple-pdf-export";
import { generateAndDownloadPDF } from "@/lib/blob-pdf-export";
import { generateAndDownloadCompletePDF } from "@/lib/complete-pdf-export";
import { RiskSummary } from "@shared/schema";

// Type definitions for AI dashboard insights
type InsightType = "trend" | "warning" | "deadline" | "info";
type InsightSeverity = "critical" | "high" | "medium" | "low";
type ActionPriority = "critical" | "high" | "important" | "medium" | "low";
type ActionType = "overdue" | "approval" | "mitigation" | "review" | "assignment" | "escalation";

type KeyInsight = {
  id: string;
  title: string;
  description: string;
  type: InsightType;
  severity: InsightSeverity;
};

type ActionItem = {
  id: string;
  title: string;
  description: string;
  priority: ActionPriority;
  type: ActionType;
  relatedRiskIds?: number[];
};

type AIRiskAnalysis = {
  keyInsights: KeyInsight[];
  actionItems: ActionItem[];
};

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { RiskSummaryCards } from "@/components/dashboard/risk-summary-cards";
import { RiskHeatmap } from "@/components/dashboard/risk-heatmap";
import { RisksByCategory } from "@/components/dashboard/risks-by-category";
import { RiskTrend } from "@/components/dashboard/risk-trend";
import { TopRisksTable } from "@/components/dashboard/top-risks-table";
import { AIInsights } from "@/components/dashboard/ai-insights";
import { AIDashboardInsights } from "@/components/dashboard/ai-dashboard-insights";
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
  
  // Fetch AI dashboard insights
  const { 
    data: aiInsightsData, 
    refetch: refetchAiInsights,
    error: aiInsightsError,
    isError: isAiInsightsError 
  } = useQuery<AIRiskAnalysis>({
    queryKey: ["/api/ai/dashboard-insights"],
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: 1, // Only retry once if there's an error
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
        <main className="flex-1 overflow-y-auto bg-dashboard-gradient p-4 sm:p-6 lg:p-8">
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
                <div className="dashboard-card h-full relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-indigo-50/30"></div>
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-blue opacity-5 rounded-full blur-2xl -mr-5 -mt-5"></div>
                  <div className="relative">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                      <span className="h-5 w-1 bg-gradient-blue rounded-full mr-2"></span>
                      Risk Heatmap
                    </h3>
                    <RiskHeatmap heatmapData={dashboardData.heatmapData} />
                  </div>
                </div>
              </div>

              {/* Risks by Category Widget */}
              <div className="lg:col-span-1 xl:col-span-1">
                <div className="dashboard-card h-full relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 to-orange-50/30"></div>
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-amber opacity-5 rounded-full blur-2xl -mr-5 -mt-5"></div>
                  <div className="relative">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                      <span className="h-5 w-1 bg-gradient-amber rounded-full mr-2"></span>
                      Risk Categories
                    </h3>
                    <RisksByCategory categories={dashboardData.risksByCategory} />
                  </div>
                </div>
              </div>

              {/* Risk Trend Widget */}
              <div className="lg:col-span-2 xl:col-span-1">
                <div className="dashboard-card h-full relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50/60 to-teal-50/30"></div>
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-green opacity-5 rounded-full blur-2xl -mr-5 -mt-5"></div>
                  <div className="relative">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                      <span className="h-5 w-1 bg-gradient-green rounded-full mr-2"></span>
                      Risk Trends
                    </h3>
                    <RiskTrend trendData={dashboardData.riskTrend} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Risk Heatmap Loading State */}
              <div className="dashboard-card h-64 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-indigo-50/30"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-blue opacity-5 rounded-full blur-2xl -mr-5 -mt-5"></div>
                <div className="relative">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                    <span className="h-5 w-1 bg-gradient-blue rounded-full mr-2"></span>
                    Risk Heatmap
                  </h3>
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="w-full h-48 bg-blue-100/20 backdrop-blur-sm shadow-sm border border-blue-100/30 animate-pulse rounded-xl flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-blue-300 border-t-transparent animate-spin"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Risk Categories Loading State */}
              <div className="dashboard-card h-64 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 to-orange-50/30"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-amber opacity-5 rounded-full blur-2xl -mr-5 -mt-5"></div>
                <div className="relative">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                    <span className="h-5 w-1 bg-gradient-amber rounded-full mr-2"></span>
                    Risk Categories
                  </h3>
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="w-full h-48 bg-amber-100/20 backdrop-blur-sm shadow-sm border border-amber-100/30 animate-pulse rounded-xl flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-amber-300 border-t-transparent animate-spin"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Risk Trends Loading State */}
              <div className="dashboard-card h-64 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/60 to-teal-50/30"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-green opacity-5 rounded-full blur-2xl -mr-5 -mt-5"></div>
                <div className="relative">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                    <span className="h-5 w-1 bg-gradient-green rounded-full mr-2"></span>
                    Risk Trends
                  </h3>
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="w-full h-48 bg-green-100/20 backdrop-blur-sm shadow-sm border border-green-100/30 animate-pulse rounded-xl flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-green-300 border-t-transparent animate-spin"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Risks Table */}
          {dashboardData?.topRisks && (
            <div className="mt-8">
              <div className="dashboard-card relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100/60 opacity-80"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-blue opacity-5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="relative">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                    <span className="h-5 w-1 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-2"></span>
                    Top Risks
                  </h3>
                  <TopRisksTable 
                    risks={dashboardData.topRisks} 
                    onRefresh={() => refetch()} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* AI Dashboard Intelligence Section */}
          <div className="mt-8">
            <div className="dashboard-card relative overflow-hidden border border-violet-100/60">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-indigo-50/50 opacity-70"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-purple opacity-5 blur-3xl rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-blue opacity-5 blur-3xl rounded-full -ml-20 -mb-20"></div>
              <div className="relative">
              {/* AI Dashboard Insights - New Component */}
              {isAiInsightsError ? (
                <div className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500 mb-4">
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">AI Insights Unavailable</h3>
                  <p className="text-gray-600 mb-4">We couldn't load the AI-powered insights at this time.</p>
                  <button
                    onClick={() => refetchAiInsights()}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Try Again
                  </button>
                </div>
              ) : (
                <AIDashboardInsights
                  isLoading={!aiInsightsData}
                  keyInsights={aiInsightsData?.keyInsights || []}
                  actionItems={aiInsightsData?.actionItems || []}
                  onRefresh={() => refetchAiInsights()}
                />
              )}
              </div>
            </div>
          </div>
          
          {/* Legacy AI Insights Section */}
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
