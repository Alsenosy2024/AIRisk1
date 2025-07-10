import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateRiskSuggestions, generateMitigationPlan, generateRiskInsights } from "./openai";
import { analyzeRiskData } from "./services/ai-insights-service";
import { 
  sendPasswordResetEmail, 
  verifyResetToken, 
  clearResetToken,
  sendConfirmationEmail 
} from "./services/email-service";
import { z } from "zod";
import { RISK_CATEGORIES, insertRiskSchema, insertRiskEventSchema, insertInsightSchema, insertProjectSchema } from "@shared/schema";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication removed - direct access granted
  // const { requireAuth, requireRole } = setupAuth(app);
  
  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await Promise.all(
        Array.from({ length: 6 }, (_, i) => storage.getUser(i + 1))
      );
      
      const sanitizedUsers = users
        .filter(Boolean)
        .map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
      
      res.status(200).json(sanitizedUsers);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });
  
  // Projects routes
  app.get("/api/projects", async (_, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.status(200).json(projects);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.status(200).json(project);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      // Validate request body against schema
      const result = insertProjectSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid project data", 
          errors: result.error.flatten().fieldErrors 
        });
      }
      
      // Create new project - default user ID since auth removed
      const project = await storage.createProject({
        ...result.data,
        created_by: 1 // Default user ID
      });
      
      res.status(201).json(project);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Validate request body against schema
      const result = insertProjectSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid project data", 
          errors: result.error.flatten().fieldErrors 
        });
      }
      
      // Update project
      const updatedProject = await storage.updateProject(projectId, result.data);
      
      res.status(200).json(updatedProject);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if project has associated risks
      const risks = await storage.getRisksByProject(projectId);
      
      if (risks.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete project with associated risks. Please remove or reassign all risks first." 
        });
      }
      
      // Delete project
      const success = await storage.deleteProject(projectId);
      
      if (success) {
        res.status(200).json({ message: "Project deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete project" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });
  
  // Risk routes
  app.get("/api/risks", async (req, res) => {
    try {
      let risks;
      
      // Handle filtering
      if (Object.keys(req.query).length > 0) {
        const filters: any = {};
        
        if (req.query.project_id) {
          filters.project_id = parseInt(req.query.project_id as string);
        }
        
        if (req.query.owner_id) {
          filters.owner_id = parseInt(req.query.owner_id as string);
        }
        
        if (req.query.category && RISK_CATEGORIES.includes(req.query.category as any)) {
          filters.category = req.query.category;
        }
        
        if (req.query.severity) {
          filters.severity = req.query.severity;
        }
        
        if (req.query.status) {
          filters.status = req.query.status;
        }
        
        risks = await storage.getFilteredRisks(filters);
      } else {
        risks = await storage.getAllRisks();
      }
      
      // Enhance risks with owner and project information
      const enhancedRisks = await Promise.all(
        risks.map(async risk => {
          const owner = risk.owner_id ? await storage.getUser(risk.owner_id) : null;
          const project = risk.project_id ? await storage.getProject(risk.project_id) : null;
          
          return {
            ...risk,
            owner: owner ? { id: owner.id, name: owner.name, role: owner.role } : null,
            project: project ? { id: project.id, name: project.name } : null
          };
        })
      );
      
      res.status(200).json(enhancedRisks);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });
  
  app.get("/api/risks/:id", async (req, res) => {
    try {
      const riskId = parseInt(req.params.id);
      const risk = await storage.getRisk(riskId);
      
      if (!risk) {
        return res.status(404).json({ message: "Risk not found" });
      }
      
      // Get owner information
      const owner = risk.owner_id ? await storage.getUser(risk.owner_id) : null;
      
      // Get project information
      const project = risk.project_id ? await storage.getProject(risk.project_id) : null;
      
      // Get risk events
      const events = await storage.getRiskEvents(riskId);
      
      // Enhance events with user information
      const enhancedEvents = await Promise.all(
        events.map(async event => {
          const user = event.created_by ? await storage.getUser(event.created_by) : null;
          
          return {
            ...event,
            user: user ? { id: user.id, name: user.name } : null
          };
        })
      );
      
      const enhancedRisk = {
        ...risk,
        owner: owner ? { id: owner.id, name: owner.name, role: owner.role } : null,
        project: project ? { id: project.id, name: project.name } : null,
        events: enhancedEvents
      };
      
      res.status(200).json(enhancedRisk);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });
  
  app.post("/api/risks", async (req, res) => {
    try {
      // Validate input
      const result = insertRiskSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid risk data", errors: result.error.format() });
      }
      
      // Use default user ID (1) since auth is removed
      const userId = 1;
      
      // Set created_by to default user
      const riskData = { ...result.data, created_by: userId };
      
      const risk = await storage.createRisk(riskData);
      
      // Create initial event
      await storage.createRiskEvent({
        risk_id: risk.id,
        event_type: "Status Change",
        description: `Risk created with status '${risk.status}'`,
        created_by: userId
      });
      
      res.status(201).json(risk);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });
  
  app.put("/api/risks/:id", async (req, res) => {
    try {
      const riskId = parseInt(req.params.id);
      const existingRisk = await storage.getRisk(riskId);
      
      if (!existingRisk) {
        return res.status(404).json({ message: "Risk not found" });
      }
      
      // Use default user ID (1) since auth is removed
      const userId = 1;
      
      // Update risk
      const updatedRisk = await storage.updateRisk(riskId, req.body);
      
      // Create update event if status changed
      if (req.body.status && req.body.status !== existingRisk.status) {
        await storage.createRiskEvent({
          risk_id: riskId,
          event_type: "Status Change",
          description: `Risk status changed from '${existingRisk.status}' to '${req.body.status}'`,
          created_by: userId
        });
      }
      
      res.status(200).json(updatedRisk);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });
  
  app.delete("/api/risks/:id", async (req, res) => {
    try {
      const riskId = parseInt(req.params.id);
      const existingRisk = await storage.getRisk(riskId);
      
      if (!existingRisk) {
        return res.status(404).json({ message: "Risk not found" });
      }
      
      // Delete risk
      const success = await storage.deleteRisk(riskId);
      
      if (success) {
        res.status(200).json({ message: "Risk successfully deleted" });
      } else {
        res.status(500).json({ message: "Failed to delete risk" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });
  
  // Risk event routes
  app.post("/api/risks/:id/events", async (req, res) => {
    try {
      const riskId = parseInt(req.params.id);
      const existingRisk = await storage.getRisk(riskId);
      
      if (!existingRisk) {
        return res.status(404).json({ message: "Risk not found" });
      }
      
      // Validate input
      const result = insertRiskEventSchema.safeParse({
        ...req.body,
        risk_id: riskId
      });
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid event data", errors: result.error.format() });
      }
      
      // Use default user ID (1) since auth is removed
      const userId = 1;
      
      // Create event
      const event = await storage.createRiskEvent({
        ...result.data,
        created_by: userId
      });
      
      // Get user information
      const user = await storage.getUser(userId);
      
      const enhancedEvent = {
        ...event,
        user: user ? { id: user.id, name: user.name } : null
      };
      
      res.status(201).json(enhancedEvent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });
  
  // Dashboard routes
  app.get("/api/dashboard", async (_, res) => {
    try {
      const dashboardData = await storage.getRiskSummary();
      
      res.status(200).json(dashboardData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });
  
  // Risk insights routes
  app.get("/api/insights", async (_, res) => {
    try {
      const insights = await storage.getAllInsights();
      
      res.status(200).json(insights);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });
  
  app.post("/api/insights/:id/dismiss", async (req, res) => {
    try {
      const insightId = parseInt(req.params.id);
      const updatedInsight = await storage.updateInsight(insightId, true);
      
      if (!updatedInsight) {
        return res.status(404).json({ message: "Insight not found" });
      }
      
      res.status(200).json(updatedInsight);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });
  
  // AI routes
  app.post("/api/ai/generate-risks", async (req, res) => {
    try {
      const { description, industry } = req.body;
      
      if (!description) {
        return res.status(400).json({ message: "Project description is required" });
      }
      
      const risks = await generateRiskSuggestions(description, industry);
      
      res.status(200).json(risks);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });
  
  // Alias for risk-suggestions to match frontend calls
  app.post("/api/ai/risk-suggestions", async (req, res) => {
    try {
      const { projectDescription, industry } = req.body;
      
      if (!projectDescription) {
        return res.status(400).json({ message: "Project description is required" });
      }
      
      const risks = await generateRiskSuggestions(projectDescription, industry);
      
      res.status(200).json(risks);
    } catch (error) {
      console.error("Error generating risk suggestions:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Failed to generate risks", error: errorMessage });
    }
  });
  
  app.post("/api/ai/generate-mitigation", async (req, res) => {
    try {
      const { risk } = req.body;
      
      if (!risk || !risk.title || !risk.description) {
        return res.status(400).json({ message: "Risk title and description are required" });
      }
      
      const mitigation = await generateMitigationPlan(risk);
      
      res.status(200).json({ mitigation });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });
  
  app.post("/api/ai/risk-insights", async (req, res) => {
    try {
      const risks = await storage.getAllRisks();
      
      if (risks.length === 0) {
        return res.status(200).json([]);
      }
      
      const insights = await generateRiskInsights(risks, RISK_CATEGORIES);
      
      res.status(200).json(insights);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });
  
  // GET endpoint for dashboard AI insights
  app.get("/api/ai/dashboard-insights", async (req, res) => {
    try {
      // Get all risks for analysis
      const risks = await storage.getAllRisks();
      const riskEvents: any[] = []; // You can get risk events if needed
      const projects = await storage.getAllProjects();
      
      // Then analyze using AI or get fallback insights if API fails
      try {
        const analysisResults = await analyzeRiskData(risks, riskEvents, projects);
        return res.status(200).json(analysisResults);
      } catch (error) {
        console.error("Error analyzing risk data:", error);
        // Return empty insights structure so the frontend won't break
        return res.status(200).json({
          keyInsights: [],
          actionItems: [] 
        });
      }
    } catch (error) {
      console.error("Error generating dashboard insights:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      
      // Return empty insights rather than an error to prevent UI disruption
      return res.status(200).json({
        keyInsights: [],
        actionItems: [] 
      });
    }
  });

  app.post("/api/ai/analyze", async (req, res) => {
    try {
      // First get the risks data
      const riskSummary = await storage.getRiskSummary();
      let analysisResults;
      
      try {
        // Try to analyze using AI
        analysisResults = await analyzeRiskData(riskSummary);
        
        // Store insights in database
        for (const insight of analysisResults.keyInsights) {
          await storage.createInsight({
            title: insight.title,
            description: insight.description,
            type: insight.type === "trend" ? "Trend" : 
                  insight.type === "warning" ? "Warning" : 
                  "Suggestion",
            related_category: null
          });
        }
      } catch (aiError) {
        console.error("Error analyzing with AI:", aiError);
        
        // Return empty insights structure so the frontend won't break
        analysisResults = {
          keyInsights: [],
          actionItems: []
        };
      }
      
      return res.status(200).json(analysisResults);
    } catch (error) {
      console.error("Error processing AI request:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      
      // Return empty insights rather than an error to prevent UI disruption
      return res.status(200).json({
        keyInsights: [],
        actionItems: []
      });
    }
  });
  
  // Email confirmation route - when a user registers, send a confirmation email
  app.post("/api/register-confirm", async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email || !name) {
        return res.status(400).json({ message: "Email and name are required" });
      }
      
      const success = await sendConfirmationEmail(email, name);
      
      if (success) {
        res.status(200).json({ message: "Confirmation email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send confirmation email" });
      }
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });
  
  // Forgot password route - initiate password reset
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user with the provided email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal that the email doesn't exist for security reasons
        return res.status(200).json({ 
          message: "If your email is registered, you will receive a reset link shortly"
        });
      }
      
      // Generate and send reset token
      const result = await sendPasswordResetEmail(user.id, user.email, user.name);
      
      if (!result.token) {
        return res.status(500).json({ message: "Failed to send password reset email" });
      }
      
      // In development mode, include the Ethereal preview URL
      if (process.env.NODE_ENV !== 'production' && result.previewUrl) {
        return res.status(200).json({
          message: "If your email is registered, you will receive a reset link shortly",
          devMode: true,
          previewUrl: result.previewUrl
        });
      }
      
      res.status(200).json({ 
        message: "If your email is registered, you will receive a reset link shortly"
      });
    } catch (error) {
      console.error("Error processing forgot password request:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });
  
  // Reset password route - validate token and update password
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      // Verify token
      const { valid, userId } = verifyResetToken(token);
      
      if (!valid || !userId) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      // Find user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Hash new password
      const hashedPassword = await storage.hashPassword(newPassword);
      
      // Update user's password
      const updatedUser = await storage.updateUserPassword(userId, hashedPassword);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      // Clear the used token
      clearResetToken(token);
      
      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}