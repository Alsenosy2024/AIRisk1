import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Lightbulb, TrendingUp, Clock, Users } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AIInsightsProps {
  insights: any[];
  onRefresh?: () => void;
}

export function AIInsights({ insights = [], onRefresh }: AIInsightsProps) {
  const queryClient = useQueryClient();
  
  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/generate-insights");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      if (onRefresh) onRefresh();
    }
  });

  const handleGenerateInsights = () => {
    generateInsightsMutation.mutate();
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "Pattern":
        return <Lightbulb className="text-yellow-500 h-5 w-5" />;
      case "Trend":
        return <TrendingUp className="text-blue-500 h-5 w-5" />;
      case "Warning":
        return <Users className="text-purple-500 h-5 w-5" />;
      case "Suggestion":
        return <Clock className="text-orange-500 h-5 w-5" />;
      default:
        return <Lightbulb className="text-yellow-500 h-5 w-5" />;
    }
  };

  const addAsRiskMutation = useMutation({
    mutationFn: async (insight: any) => {
      // Create a new risk based on the insight
      const riskData = {
        title: insight.title,
        description: insight.description,
        category: insight.related_category || "Operational",
        probability: 3, // Default value
        impact: 3, // Default value
        status: "Identified",
        mitigation_plan: "",
        owner_id: null,
        project_id: null
      };
      
      const response = await apiRequest("POST", "/api/risks", riskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    }
  });

  const dismissInsightMutation = useMutation({
    mutationFn: async (insightId: number) => {
      const response = await apiRequest("POST", `/api/insights/${insightId}/dismiss`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      if (onRefresh) onRefresh();
    }
  });

  return (
    <Card className="mt-6">
      <CardHeader className="px-5 py-4 border-b border-gray-200 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium text-gray-900">
          AI-Generated Risk Insights
        </CardTitle>
        <div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 inline-flex items-center"
            onClick={handleGenerateInsights}
            disabled={generateInsightsMutation.isPending}
          >
            <Bot className="mr-2 h-4 w-4" />
            {generateInsightsMutation.isPending ? "Generating..." : "Generate More"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights && insights.length > 0 ? (
            insights.map((insight) => (
              <div key={insight.id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">{insight.title}</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {insight.description}
                    </p>
                    <div className="mt-3 flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => addAsRiskMutation.mutate(insight)}
                        disabled={addAsRiskMutation.isPending}
                      >
                        Add as Risk
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => dismissInsightMutation.mutate(insight.id)}
                        disabled={dismissInsightMutation.isPending}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-6">
              <p className="text-gray-500">No AI insights available. Click "Generate More" to create new insights.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
