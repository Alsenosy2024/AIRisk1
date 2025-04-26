import OpenAI from "openai";
import type { InsertRisk, Risk, RISK_CATEGORIES } from "@shared/schema";

// Initialize OpenAI client
// If OPENAI_API_KEY is not set, the client will throw an error when attempting API calls
// Using a factory function to create a fresh client each time to avoid persistent headers
function createOpenAIClient() {
  // Create a configuration object without organization header
  const configuration = {
    apiKey: process.env.OPENAI_API_KEY
  };
  
  // Create a client with explicit configuration to avoid headers inheritance
  const client = new OpenAI(configuration);
  
  // Force empty organization to override any default
  client.organization = "";
  
  return client;
}

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
const AI_MODEL = "gpt-4o";

// Calculate severity based on probability and impact
function calculateSeverity(probability: number, impact: number): "Critical" | "High" | "Medium" | "Low" | "Very Low" {
  const score = probability * impact;
  if (score >= 20) return "Critical";
  if (score >= 12) return "High";
  if (score >= 6) return "Medium";
  if (score >= 3) return "Low";
  return "Very Low";
}

// Generate risk suggestions based on project description
export async function generateRiskSuggestions(projectDescription: string, industry?: string): Promise<InsertRisk[]> {
  try {
    const prompt = `
      You are an expert risk manager. Based on the following project description, identify 3-5 potential risks.
      
      Project Description: ${projectDescription}
      ${industry ? `Industry: ${industry}` : ''}
      
      For each risk, provide:
      1. A concise title
      2. A detailed description
      3. The most appropriate category (Technical, Financial, Operational, Security, Organizational, External)
      4. Probability rating (1-5 scale where 1 is very low, 5 is very high)
      5. Impact rating (1-5 scale where 1 is very low, 5 is very high)
      6. A suggested mitigation plan
      
      INSTRUCTIONS FOR FORMATTING RESPONSE:
      1. Your response MUST be formatted as a JSON array of risk objects.
      2. The response should look like this: [{"title": "Risk Title", "description": "Risk description", ...}, {...}]
      3. Each risk object must have the following fields:
         - title (string)
         - description (string)
         - category (string, one of the categories mentioned above)
         - probability (number 1-5)
         - impact (number 1-5)
         - mitigation_plan (string)
      
      IMPORTANT: 
      - Ensure all risks are specific to the project description.
      - Provide realistic, actionable mitigation plans.
      - Format must be a valid JSON array, not a single object or any other format.
    `;

    try {
      const openai = createOpenAIClient();
      const response = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      // Check if content starts with HTML, which would indicate an error
      if (content.trim().startsWith("<") || content.includes("<!DOCTYPE")) {
        console.error("Received HTML instead of JSON from OpenAI:", content.substring(0, 100));
        throw new Error("Received invalid response format from OpenAI");
      }

      try {
        const parsedResponse = JSON.parse(content);
        let risks;
        
        // Handle different response formats intelligently
        if (Array.isArray(parsedResponse)) {
          // Direct array format
          risks = parsedResponse;
        } else if (parsedResponse.risks && Array.isArray(parsedResponse.risks)) {
          // Array inside 'risks' property
          risks = parsedResponse.risks;
        } else if (parsedResponse.title && parsedResponse.description) {
          // Single risk object - wrap in array
          risks = [parsedResponse];
          console.log("Converted single risk to array format");
        } else {
          console.error("Response is not a valid risk format:", JSON.stringify(parsedResponse));
          throw new Error("Invalid response format: expected risks data");
        }

        return risks.map((risk: any) => ({
          title: risk.title,
          description: risk.description,
          category: risk.category as "Technical" | "Financial" | "Operational" | "Security" | "Organizational" | "External",
          probability: Number(risk.probability),
          impact: Number(risk.impact),
          severity: calculateSeverity(Number(risk.probability), Number(risk.impact)),
          mitigation_plan: risk.mitigation_plan,
          status: "Identified",
          // These fields will be filled by the server
          reference_id: "",
          owner_id: null,
          project_id: null,
          created_by: null
        }));
      } catch (parseError: any) {
        console.error("Error parsing OpenAI response:", parseError);
        throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
      }
    } catch (apiError: any) {
      console.error("OpenAI API error:", apiError);
      throw new Error(`OpenAI API error: ${apiError.message}`);
    }
  } catch (error: any) {
    console.error("Error generating risk suggestions:", error);
    throw new Error(`Failed to generate risk suggestions: ${error.message}`);
  }
}

// Generate mitigation plan suggestions for an existing risk
export async function generateMitigationPlan(risk: Partial<Risk>): Promise<string> {
  try {
    const prompt = `
      You are an expert risk manager. Based on the following risk, suggest a comprehensive mitigation plan:
      
      Risk Title: ${risk.title}
      Risk Description: ${risk.description}
      Risk Category: ${risk.category}
      Risk Severity: ${risk.severity || "Unknown"}
      
      Provide a detailed, actionable mitigation plan that includes:
      1. Preventive measures
      2. Detective measures
      3. Corrective measures
      4. Specific responsibilities
      5. Timeline considerations
      
      Format your response as plain text, focusing only on the mitigation plan itself.
    `;

    const openai = createOpenAIClient();
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    return response.choices[0].message.content || "No mitigation plan generated.";

  } catch (error: any) {
    console.error("Error generating mitigation plan:", error);
    throw new Error(`Failed to generate mitigation plan: ${error.message}`);
  }
}

// Generate general risk insights based on existing risks
export async function generateRiskInsights(risks: Risk[], categories: typeof RISK_CATEGORIES): Promise<any[]> {
  try {
    // Prepare risk data for the AI
    const riskSummary = categories.map(category => {
      const categoryRisks = risks.filter(r => r.category === category);
      return {
        category,
        count: categoryRisks.length,
        averageProbability: categoryRisks.length > 0 
          ? categoryRisks.reduce((sum, r) => sum + r.probability, 0) / categoryRisks.length 
          : 0,
        averageImpact: categoryRisks.length > 0 
          ? categoryRisks.reduce((sum, r) => sum + r.impact, 0) / categoryRisks.length 
          : 0,
        highSeverityCount: categoryRisks.filter(r => ["Critical", "High"].includes(r.severity)).length
      };
    }).filter(summary => summary.count > 0);

    const prompt = `
      You are an expert risk analyst. Based on the following risk data, generate 3-4 key insights that would be valuable for project managers:
      
      Risk Summary by Category:
      ${JSON.stringify(riskSummary, null, 2)}
      
      For each insight, provide:
      1. A concise title
      2. A detailed description with specific observations and recommendations
      3. The insight type (Pattern, Trend, Suggestion, or Warning)
      4. The most relevant risk category it relates to
      
      Format your response as a JSON array with objects containing:
      - title (string)
      - description (string)
      - type (string, one of: Pattern, Trend, Suggestion, Warning)
      - related_category (string, one of the categories in the data)
      
      IMPORTANT: Ensure insights are data-driven, specific, and provide actionable recommendations.
    `;

    const openai = createOpenAIClient();
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const parsedResponse = JSON.parse(content);
    return parsedResponse.insights || parsedResponse;

  } catch (error: any) {
    console.error("Error generating risk insights:", error);
    throw new Error(`Failed to generate risk insights: ${error.message}`);
  }
}
