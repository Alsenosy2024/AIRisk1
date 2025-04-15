import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { downloadAsJson } from "@/lib/utils";

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
      downloadAsJson(dashboardData, "risk-dashboard-export.json");
      toast({
        title: "Dashboard Exported",
        description: "Dashboard data has been exported as JSON",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "No dashboard data available to export",
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
            <RiskSummaryCards
              totalRisks={dashboardData.totalRisks}
              criticalRisks={dashboardData.criticalRisks}
              highRisks={dashboardData.highRisks}
              mitigationProgress={dashboardData.mitigationProgress}
            />
          ) : (
            <div className="py-4 text-center text-gray-500">
              Loading dashboard data...
            </div>
          )}

          {/* Main Dashboard Widgets */}
          {dashboardData ? (
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {/* Risk Heatmap Widget */}
              <div className="lg:col-span-1 xl:col-span-1">
                <RiskHeatmap heatmapData={dashboardData.heatmapData} />
              </div>

              {/* Risks by Category Widget */}
              <div className="lg:col-span-1 xl:col-span-1">
                <RisksByCategory categories={dashboardData.risksByCategory} />
              </div>

              {/* Risk Trend Widget */}
              <div className="lg:col-span-2 xl:col-span-1">
                <RiskTrend trendData={dashboardData.riskTrend} />
              </div>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="bg-white p-6 rounded-lg shadow h-64 animate-pulse" />
              <div className="bg-white p-6 rounded-lg shadow h-64 animate-pulse" />
              <div className="bg-white p-6 rounded-lg shadow h-64 animate-pulse" />
            </div>
          )}

          {/* Top Risks Table */}
          {dashboardData?.topRisks && (
            <TopRisksTable 
              risks={dashboardData.topRisks} 
              onRefresh={() => refetch()} 
            />
          )}

          {/* AI Insights Section */}
          {dashboardData?.insights && (
            <AIInsights 
              insights={dashboardData.insights} 
              onRefresh={() => refetch()} 
            />
          )}
        </main>
      </div>
    </div>
  );
}
