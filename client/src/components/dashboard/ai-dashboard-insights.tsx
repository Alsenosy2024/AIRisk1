import { useState } from "react";
import { 
  Lightbulb, 
  RefreshCw, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Info,
  ArrowUpRight,
  Check,
  X,
  ChevronRight,
  ListChecks,
  ShieldAlert,
  FileCheck,
  UserCog,
  ArrowUpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Handle the refresh button click
  const handleRefresh = async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      if (onRefresh) {
        await onRefresh();
      }
      
      toast({
        title: "Insights refreshed",
        description: "The latest AI analysis has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error refreshing insights",
        description: "An error occurred while generating insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Render icon based on insight type
  function getInsightIcon(type: KeyInsight["type"]) {
    switch (type) {
      case "trend":
        return <TrendingUp className="h-6 w-6" />;
      case "warning":
        return <AlertTriangle className="h-6 w-6" />;
      case "deadline":
        return <Clock className="h-6 w-6" />;
      case "info":
        return <Info className="h-6 w-6" />;
      default:
        return <Info className="h-6 w-6" />;
    }
  }
  
  // Get severity color
  function getSeverityColor(severity: KeyInsight["severity"]) {
    switch (severity) {
      case "critical":
        return "text-red-500 bg-red-50 border-red-200";
      case "high":
        return "text-orange-500 bg-orange-50 border-orange-200";
      case "medium":
        return "text-amber-500 bg-amber-50 border-amber-200";
      case "low":
        return "text-blue-500 bg-blue-50 border-blue-200";
      default:
        return "text-gray-500 bg-gray-50 border-gray-200";
    }
  }
  
  // Get priority color for action items
  function getPriorityColor(priority: ActionItem["priority"]) {
    switch (priority) {
      case "critical":
        return "text-red-700 bg-red-50 border-red-200";
      case "high":
        return "text-orange-700 bg-orange-50 border-orange-200";
      case "important":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "medium":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "low":
        return "text-gray-700 bg-gray-50 border-gray-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  }
  
  // Get action item icon based on type
  function getActionIcon(type: ActionItem["type"]) {
    switch (type) {
      case "overdue":
        return <Clock className="h-5 w-5" />;
      case "approval":
        return <Check className="h-5 w-5" />;
      case "mitigation":
        return <ShieldAlert className="h-5 w-5" />;
      case "review":
        return <FileCheck className="h-5 w-5" />;
      case "assignment":
        return <UserCog className="h-5 w-5" />;
      case "escalation":
        return <ArrowUpCircle className="h-5 w-5" />;
      default:
        return <ListChecks className="h-5 w-5" />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">AI Risk Intelligence</h1>
            <p className="text-gray-500 text-sm">AI-powered insights and recommended actions</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          <span>Refresh Insights</span>
        </Button>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Key Insights Section */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-blue-500" />
                Key Insights
              </CardTitle>
              <CardDescription>
                Important patterns and findings detected in your risk data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {keyInsights.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Info className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No insights available. Click refresh to generate new insights.</p>
                  </div>
                ) : (
                  keyInsights.map((insight) => (
                    <div 
                      key={insight.id} 
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn("p-2 rounded-full", getSeverityColor(insight.severity))}>
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                            <h3 className="font-medium">{insight.title}</h3>
                            <Badge className={cn("w-fit", getSeverityColor(insight.severity))}>
                              {insight.severity.charAt(0).toUpperCase() + insight.severity.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Action Items Section */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-purple-500" />
                Required Actions
              </CardTitle>
              <CardDescription>
                Recommended tasks to address risks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {actionItems.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <ListChecks className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No action items available</p>
                  </div>
                ) : (
                  actionItems.map((action) => (
                    <div 
                      key={action.id}
                      className={cn(
                        "border rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer group",
                        {
                          "border-l-4": action.priority === "critical" || action.priority === "high"
                        },
                        action.priority === "critical" && "border-l-red-500",
                        action.priority === "high" && "border-l-orange-500"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={cn("w-fit", getPriorityColor(action.priority))}>
                          {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center">
                          {action.type.charAt(0).toUpperCase() + action.type.slice(1)}
                          <ChevronRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <div className={cn("mt-1", getPriorityColor(action.priority))}>
                          {getActionIcon(action.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{action.title}</h4>
                          <p className="text-gray-600 text-xs mt-1">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {actionItems.length > 0 && (
                <div className="mt-4 text-center">
                  <Button 
                    variant="link" 
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    View All Actions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}