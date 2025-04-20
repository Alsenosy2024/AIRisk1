import { Risk, RiskEvent, Project } from "@shared/schema";
import { generateRiskInsights } from "../openai";
import OpenAI from "openai";

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

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Analyzes risk data using OpenAI to generate insights and recommended actions
 */
export async function analyzeRiskData(
  risks: Risk[],
  riskEvents: RiskEvent[] = [],
  projects: Project[] = []
): Promise<AIRiskAnalysis> {
  try {
    const riskData = {
      risks,
      riskEvents,
      projects,
      currentDate: new Date().toISOString(),
    };

    // If OpenAI API isn't available, return fallback insights
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY not found. Using fallback insights. Please provide a valid OPENAI_API_KEY.");
      return generateFallbackInsights(riskData);
    }
    
    try {
      // Initialize OpenAI client
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Test the API connection with a simple request
      await openai.models.list();
      
      // Continue with real implementation
      return await generateAIInsights(riskData, openai);
    } catch (error) {
      console.error("Error connecting to OpenAI API:", error);
      console.log("Using fallback insights due to OpenAI API error");
      return generateFallbackInsights(riskData);
    }
  } catch (error) {
    console.error("Error analyzing risk data with AI:", error);
    return generateFallbackInsights({risks, riskEvents, projects});
  }
}

/**
 * Generates basic insights if OpenAI API is unavailable
 */
function generateFallbackInsights(riskData: any): AIRiskAnalysis {
  const risks = riskData.risks || [];
  const currentDate = new Date();
  
  // Generate basic insights based on available risk data
  const keyInsights: KeyInsight[] = [];
  const actionItems: ActionItem[] = [];

  // Check for risks past their target date
  const overdueRisks = risks.filter((risk: any) => {
    if (!risk.target_date) return false;
    return new Date(risk.target_date) < currentDate && risk.status !== "Mitigated" && risk.status !== "Closed";
  });

  if (overdueRisks.length > 0) {
    keyInsights.push({
      id: generateId(),
      title: "Overdue Risk Items Detected",
      description: `${overdueRisks.length} risk(s) have passed their due date and require attention.`,
      type: "deadline",
      severity: overdueRisks.length > 3 ? "critical" : "high"
    });

    actionItems.push({
      id: generateId(),
      title: "Review Overdue Risk Items",
      description: "Multiple risk items have passed their due dates and need immediate review or extension.",
      priority: "critical",
      type: "overdue",
      relatedRiskIds: overdueRisks.map((r: any) => r.id)
    });
  }

  // Check high severity risks
  const highSeverityRisks = risks.filter((risk: any) => 
    (risk.severity === "Critical" || risk.severity === "High") && 
    risk.status !== "Mitigated" && 
    risk.status !== "Closed"
  );

  if (highSeverityRisks.length > 0) {
    keyInsights.push({
      id: generateId(),
      title: "High Severity Risks Require Attention",
      description: `${highSeverityRisks.length} high/critical severity risk(s) require mitigation planning.`,
      type: "warning",
      severity: "high"
    });

    actionItems.push({
      id: generateId(),
      title: "Develop Mitigation Plans for High Severity Risks",
      description: "Create or review mitigation strategies for high severity risks to reduce potential impact.",
      priority: "high",
      type: "mitigation",
      relatedRiskIds: highSeverityRisks.map((r: any) => r.id)
    });
  }

  // Add general insights
  keyInsights.push({
    id: generateId(),
    title: "Risk Distribution Analysis",
    description: `Your risk register contains ${risks.length} risk items across multiple categories and severity levels.`,
    type: "info",
    severity: "medium"
  });

  actionItems.push({
    id: generateId(),
    title: "Regular Risk Register Review",
    description: "Schedule a regular review session to ensure risk items are up-to-date and properly assessed.",
    priority: "medium",
    type: "review"
  });

  return { keyInsights, actionItems };
}