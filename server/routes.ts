import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateRiskSuggestions, generateMitigationPlan, generateRiskInsights } from "./openai";
import { analyzeRiskData } from "./services/ai-insights-service";
import { z } from "zod";
import { RISK_CATEGORIES, insertRiskSchema, insertRiskEventSchema, insertInsightSchema } from "@shared/schema";
import { randomBytes } from "crypto";

// Simple auth middleware - in a real app use proper auth
function userMiddleware(req: Request, res: Response, next: Function) {
  // Check if user is in the session
  if (req.headers["x-user-id"]) {
    const userId = parseInt(req.headers["x-user-id"] as string);
    storage.getUser(userId).then(user => {
      if (user) {
        // @ts-ignore - add user to request
        req.user = { ...user, password: undefined };
        next();
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    });
  } else {
    // For demo, allow access with default user if no user ID provided
    storage.getUser(2).then(user => {
      if (user) {
        // @ts-ignore - add user to request
        req.user = { ...user, password: undefined };
        next();
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    });
  }
}

// Role-based access control
function roleMiddleware(allowedRoles: string[]) {
  return (req: Request, res: Response, next: Function) => {
    // @ts-ignore - user is added by userMiddleware
    const userRole = req.user?.role;
    
    if (userRole && allowedRoles.includes(userRole)) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, verify password hash here
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
      
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
  
  // User routes
  app.get("/api/users", userMiddleware, async (_, res) => {
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
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
  
  // Projects routes
  app.get("/api/projects", userMiddleware, async (_, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.status(200).json(projects);
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
  
  // Risk routes
  app.get("/api/risks", userMiddleware, async (req, res) => {
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
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
  
  app.get("/api/risks/:id", userMiddleware, async (req, res) => {
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
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
  
  app.post("/api/risks", userMiddleware, async (req, res) => {
    try {
      // Validate input
      const result = insertRiskSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid risk data", errors: result.error.format() });
      }
      
      // @ts-ignore - user is added by userMiddleware
      const userId = req.user.id;
      
      // Set created_by to current user
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
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
  
  app.put("/api/risks/:id", userMiddleware, roleMiddleware(["Admin", "Risk Manager", "Project Manager"]), async (req, res) => {
    try {
      const riskId = parseInt(req.params.id);
      const existingRisk = await storage.getRisk(riskId);
      
      if (!existingRisk) {
        return res.status(404).json({ message: "Risk not found" });
      }
      
      // @ts-ignore - user is added by userMiddleware
      const userId = req.user.id;
      
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
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
  
  app.delete("/api/risks/:id", userMiddleware, roleMiddleware(["Admin", "Risk Manager"]), async (req, res) => {
    try {
      const riskId = parseInt(req.params.id);
      const existingRisk = await storage.getRisk(riskId);
      
      if (!existingRisk) {
        return res.status(404).json({ message: "Risk not found" });
      }
      
      const result = await storage.deleteRisk(riskId);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete risk" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
  
  // Risk events routes
  app.post("/api/risks/:id/events", userMiddleware, async (req, res) => {
    try {
      const riskId = parseInt(req.params.id);
      const existingRisk = await storage.getRisk(riskId);
      
      if (!existingRisk) {
        return res.status(404).json({ message: "Risk not found" });
      }
      
      // Validate input
      const result = insertRiskEventSchema.safeParse({
        ...req.body,
        risk_id: riskId,
        // @ts-ignore - user is added by userMiddleware
        created_by: req.user.id
      });
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid event data", errors: result.error.format() });
      }
      
      const event = await storage.createRiskEvent(result.data);
      
      // Get user information
      const user = event.created_by ? await storage.getUser(event.created_by) : null;
      
      const enhancedEvent = {
        ...event,
        user: user ? { id: user.id, name: user.name } : null
      };
      
      res.status(201).json(enhancedEvent);
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
  
  // Dashboard routes
  app.get("/api/dashboard", userMiddleware, async (_, res) => {
    try {
      const summary = await storage.getRiskSummary();
      res.status(200).json(summary);
    } catch (error) {
      console.error("Error getting risk summary:", error);
      // Return fallback data instead of error
      const fallbackSummary = {
        totalRisks: 0,
        criticalRisks: 0,
        highRisks: 0,
        mitigationProgress: 0,
        risksByCategory: [],
        risksBySeverity: [],
        risksByStatus: [],
        topRisks: [],
        riskTrend: [],
        heatmapData: [],
        insights: []
      };
      res.status(200).json(fallbackSummary);
    }
  });
  
  // Insights routes
  app.get("/api/insights", userMiddleware, async (_, res) => {
    try {
      const insights = await storage.getAllInsights();
      res.status(200).json(insights);
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
  
  app.post("/api/insights/:id/dismiss", userMiddleware, roleMiddleware(["Admin", "Risk Manager"]), async (req, res) => {
    try {
      const insightId = parseInt(req.params.id);
      const updatedInsight = await storage.updateInsight(insightId, true);
      
      if (!updatedInsight) {
        return res.status(404).json({ message: "Insight not found" });
      }
      
      res.status(200).json(updatedInsight);
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
  
  // AI routes
  app.post("/api/ai/risk-suggestions", userMiddleware, async (req, res) => {
    try {
      const { projectDescription, industry } = req.body;
      
      if (!projectDescription) {
        return res.status(400).json({ message: "Project description is required" });
      }
      
      const suggestions = await generateRiskSuggestions(projectDescription, industry);
      res.status(200).json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
  
  app.post("/api/ai/mitigation-plan", userMiddleware, async (req, res) => {
    try {
      const { risk } = req.body;
      
      if (!risk || !risk.title || !risk.description) {
        return res.status(400).json({ message: "Risk details are required" });
      }
      
      const mitigationPlan = await generateMitigationPlan(risk);
      res.status(200).json({ mitigationPlan });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
  
  app.post("/api/ai/generate-insights", userMiddleware, roleMiddleware(["Admin", "Risk Manager"]), async (_, res) => {
    try {
      const risks = await storage.getAllRisks();
      const insightData = await generateRiskInsights(risks, RISK_CATEGORIES);
      
      // Save generated insights
      const savedInsights = await Promise.all(
        insightData.map(insight => storage.createInsight(insight))
      );
      
      res.status(200).json(savedInsights);
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
  
  // AI Dashboard Insights route
  app.get("/api/ai/dashboard-insights", userMiddleware, async (_, res) => {
    try {
      const risks = await storage.getAllRisks();
      
      // Use a safer approach to get risk events
      let riskEvents = [];
      try {
        riskEvents = await Promise.all(
          risks.map(risk => storage.getRiskEvents(risk.id))
        ).then(events => events.flat());
      } catch (eventsError) {
        console.error("Error fetching risk events:", eventsError);
        // Continue with empty events array
      }
      
      // Get projects with error handling
      let projects = [];
      try {
        projects = await storage.getAllProjects();
      } catch (projectsError) {
        console.error("Error fetching projects:", projectsError);
        // Continue with empty projects array
      }
      
      try {
        const insights = await analyzeRiskData(risks, riskEvents, projects);
        return res.status(200).json(insights);
      } catch (aiError) {
        console.error("Error generating AI insights:", aiError);
        // Send fallback insights
        const fallbackInsights = {
          keyInsights: [
            {
              id: "fallback-1",
              title: "Dashboard Data Available",
              description: `Your risk register contains ${risks.length} risk items.`,
              type: "info",
              severity: "medium"
            }
          ],
          actionItems: [
            {
              id: "fallback-action-1",
              title: "Review Risk Register",
              description: "Schedule regular review of your risk items.",
              priority: "medium",
              type: "review"
            }
          ]
        };
        return res.status(200).json(fallbackInsights);
      }
    } catch (error) {
      console.error("Critical error in dashboard insights route:", error);
      // Return a minimal viable response instead of error
      res.status(200).json({ 
        keyInsights: [], 
        actionItems: [] 
      });
    }
  });
  
  const httpServer = createServer(app);
  
  return httpServer;
}
