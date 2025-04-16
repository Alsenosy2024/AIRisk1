import { useState } from "react";
import { AlertCircle, TrendingUp, Calendar, ChevronRight, RefreshCw, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface KeyInsight {
  id: string;
  title: string;
  description: string;
  type: "trend" | "warning" | "deadline" | "info";
  severity: "critical" | "high" | "medium" | "low";
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "important" | "medium" | "low";
  type: "overdue" | "approval" | "mitigation" | "review" | "assignment" | "escalation";
  relatedRiskIds?: number[];
}

interface AIDashboardInsightsProps {
  isLoading?: boolean;
  keyInsights?: KeyInsight[];
  actionItems?: ActionItem[];
  onRefresh?: () => void;
}

export function AIDashboardInsights({
  isLoading = false,
  keyInsights = [],
  actionItems = [],
  onRefresh
}: AIDashboardInsightsProps) {
  const [activeTab, setActiveTab] = useState("insights");
  const { toast } = useToast();
  
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
      toast({
        title: "Refreshing insights",
        description: "Analyzing risk data to generate fresh insights...",
      });
    }
  };

  // Helper function to get icon based on insight type
  const getInsightIcon = (type: KeyInsight["type"]) => {
    switch (type) {
      case "trend":
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "deadline":
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case "info":
      default:
        return <AlertTriangle className="h-5 w-5 text-blue-500" />;
    }
  };

  // Helper function to get icon based on action type
  const getActionIcon = (type: ActionItem["type"]) => {
    switch (type) {
      case "overdue":
        return <Clock className="h-5 w-5 text-red-500" />;
      case "approval":
        return <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>;
      case "mitigation":
        return <svg className="h-5 w-5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>;
      case "review":
        return <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>;
      case "assignment":
        return <svg className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>;
      case "escalation":
        return <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 17l5-5-5-5"/>
          <path d="M6 17l5-5-5-5"/>
        </svg>;
      default:
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    }
  };

  // Helper function to get badge color based on priority/severity
  const getBadgeClass = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "important":
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "low":
        return "bg-green-100 text-green-600 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Loading skeleton UI
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-40" />
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 items-start">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-800">Risk Intelligence Dashboard</h2>
          <p className="text-gray-500 text-sm">AI-powered insights from your risk register</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="gap-1 glass-card">
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Refresh Insights
        </Button>
      </div>

      <Card className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100/50 shadow-sm overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100/50 backdrop-blur-sm">
              <TabsTrigger value="insights" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Key Insights
              </TabsTrigger>
              <TabsTrigger value="actions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Required Actions
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="insights" className="p-6 pt-4">
            {keyInsights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-blue-50 p-3 rounded-full mb-3">
                  <AlertCircle className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">No key insights available</h3>
                <p className="text-gray-500 max-w-md">Analyze more risk data or refresh insights to generate AI-powered observations.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {keyInsights.map((insight) => (
                  <div key={insight.id} className="flex gap-4 items-start p-4 rounded-xl bg-gray-50/70 backdrop-blur-sm border border-gray-100/50 hover:bg-gray-50/90 transition-colors cursor-pointer group">
                    <div className="p-2 rounded-lg bg-white shadow-sm">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-base font-semibold text-gray-800">{insight.title}</h3>
                        <Badge className={`ml-2 ${getBadgeClass(insight.severity)}`}>
                          {insight.severity.charAt(0).toUpperCase() + insight.severity.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{insight.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="actions" className="p-6 pt-4">
            {actionItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-green-50 p-3 rounded-full mb-3">
                  <svg className="h-6 w-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">No actions required</h3>
                <p className="text-gray-500 max-w-md">All risk items are up to date. Check back later for new recommended actions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {actionItems.map((action) => (
                  <div key={action.id} className="flex gap-4 items-start p-4 rounded-xl bg-gray-50/70 backdrop-blur-sm border border-gray-100/50 hover:bg-gray-50/90 transition-colors cursor-pointer group">
                    <div className="p-2 rounded-lg bg-white shadow-sm">
                      {getActionIcon(action.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-base font-semibold text-gray-800">{action.title}</h3>
                        <Badge className={`ml-2 ${getBadgeClass(action.priority)}`}>
                          {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{action.description}</p>
                      {action.relatedRiskIds && action.relatedRiskIds.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Related risks: </span>
                          {action.relatedRiskIds.map((id, index) => (
                            <span key={id} className="text-xs text-blue-600 font-medium">
                              #{id}{index < action.relatedRiskIds!.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}