import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { AIDashboardInsights } from "@/components/dashboard/ai-dashboard-insights";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

type KeyInsight = {
  id: string;
  title: string;
  description: string;
  type: "trend" | "warning" | "deadline" | "info";
  severity: "critical" | "high" | "medium" | "low";
};

type ActionItem = {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "important" | "medium" | "low";
  type: "overdue" | "approval" | "mitigation" | "review" | "assignment" | "escalation";
  relatedRiskIds?: number[];
};

type AIRiskAnalysis = {
  keyInsights: KeyInsight[];
  actionItems: ActionItem[];
};

export default function RiskIntelligencePage() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  
  // Fetch AI insights
  const { 
    data: insightsData, 
    isLoading, 
    refetch 
  } = useQuery<AIRiskAnalysis>({
    queryKey: ["/api/ai/dashboard-insights"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
  
  // Sample insights for when API fails (will be replaced with real data)
  const exampleInsights: KeyInsight[] = [
    {
      id: "ins-1",
      title: "Five High Severity Risks Need Mitigation",
      description: "Multiple high-severity risks require immediate mitigation plans. Consider prioritizing resources towards these critical items.",
      type: "warning",
      severity: "high"
    },
    {
      id: "ins-2",
      title: "Technical Risks Increasing in Q2",
      description: "Technical risks have increased by 35% compared to Q1, indicating potential growing technical debt or implementation challenges.",
      type: "trend",
      severity: "medium"
    },
    {
      id: "ins-3",
      title: "Upcoming Risk Assessment Deadlines",
      description: "3 risk assessments are due within the next 7 days. Schedule reviews promptly to avoid delays.",
      type: "deadline",
      severity: "medium"
    }
  ];
  
  const exampleActions: ActionItem[] = [
    {
      id: "act-1",
      title: "Update Security Risk Assessments",
      description: "Three security risk assessments are outdated. Schedule security team review this week.",
      priority: "critical",
      type: "overdue",
      relatedRiskIds: [5, 12, 18]
    },
    {
      id: "act-2",
      title: "Approve Risk Mitigation Budget",
      description: "Budget approval required for mitigation of high severity infrastructure risks before month-end deadline.",
      priority: "high",
      type: "approval",
      relatedRiskIds: [4, 9]
    },
    {
      id: "act-3",
      title: "Conduct Risk Training Session",
      description: "Schedule quarterly risk management training for project teams to improve risk identification.",
      priority: "medium",
      type: "review"
    }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      {sidebarVisible && <Sidebar />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white/80 p-4 sm:p-6 lg:p-8">
          {/* AI Dashboard Insights */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-500 animate-pulse">Analyzing risk data...</p>
            </div>
          ) : (
            <AIDashboardInsights
              keyInsights={insightsData?.keyInsights || exampleInsights}
              actionItems={insightsData?.actionItems || exampleActions}
              onRefresh={() => refetch()}
            />
          )}
        </main>
      </div>
    </div>
  );
}