import { 
  users, type User, type InsertUser, 
  projects, type Project, type InsertProject,
  risks, type Risk, type InsertRisk,
  riskEvents, type RiskEvent, type InsertRiskEvent,
  insights, type Insight, type InsertInsight,
  RISK_SEVERITY, RISK_STATUS, RISK_CATEGORIES
} from "@shared/schema";
import session from "express-session";
import { DatabaseStorage } from "./storage-db";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Promisify the scrypt function
const scryptAsync = promisify(scrypt);

// Generate hash for passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Verify password against stored hash
async function verifyPassword(supplied: string, stored: string): Promise<boolean> {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) return false;
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

// Helper function to calculate severity based on probability and impact
function calculateSeverity(probability: number, impact: number): typeof RISK_SEVERITY[number] {
  const score = probability * impact;
  if (score >= 20) return "Critical";
  if (score >= 12) return "High";
  if (score >= 6) return "Medium";
  if (score >= 3) return "Low";
  return "Very Low";
}

// Generate a reference ID for risks
function generateReferenceId(currentCount: number): string {
  const paddedNumber = String(currentCount + 1).padStart(3, '0');
  return `R-${paddedNumber}`;
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserFirebaseUid(userId: number, firebaseUid: string): Promise<User>;
  
  // Authentication operations
  verifyPassword(supplied: string, stored: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Risk operations
  getRisk(id: number): Promise<Risk | undefined>;
  getAllRisks(): Promise<Risk[]>;
  getRisksByProject(projectId: number): Promise<Risk[]>;
  getRisksByOwner(ownerId: number): Promise<Risk[]>;
  getFilteredRisks(filters: Partial<Risk>): Promise<Risk[]>;
  createRisk(risk: InsertRisk): Promise<Risk>;
  updateRisk(id: number, risk: Partial<Risk>): Promise<Risk | undefined>;
  deleteRisk(id: number): Promise<boolean>;
  
  // Risk event operations
  getRiskEvents(riskId: number): Promise<RiskEvent[]>;
  createRiskEvent(event: InsertRiskEvent): Promise<RiskEvent>;
  
  // Insight operations
  getAllInsights(): Promise<Insight[]>;
  createInsight(insight: InsertInsight): Promise<Insight>;
  updateInsight(id: number, isDismissed: boolean): Promise<Insight | undefined>;
  
  // Dashboard operations
  getRiskSummary(): Promise<any>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private risks: Map<number, Risk>;
  private riskEvents: Map<number, RiskEvent>;
  private insights: Map<number, Insight>;
  
  private userIdCounter: number;
  private projectIdCounter: number;
  private riskIdCounter: number;
  private riskEventIdCounter: number;
  private insightIdCounter: number;
  
  sessionStore: session.Store;
  
  // Authentication helpers
  async verifyPassword(supplied: string, stored: string): Promise<boolean> {
    return verifyPassword(supplied, stored);
  }
  
  async hashPassword(password: string): Promise<string> {
    return hashPassword(password);
  }
  
  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.risks = new Map();
    this.riskEvents = new Map();
    this.insights = new Map();
    
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.riskIdCounter = 1;
    this.riskEventIdCounter = 1;
    this.insightIdCounter = 1;
    
    // Initialize memory session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with seed data
    this.seedData();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebase_uid === firebaseUid
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Only hash password if provided (firebase auth won't have a password)
    const password = insertUser.password 
      ? await hashPassword(insertUser.password)
      : '';
    
    const user: User = {
      ...insertUser,
      id,
      password,
      created_at: new Date()
    };
    
    this.users.set(id, user);
    return { ...user, password: "[REDACTED]" } as User;
  }
  
  async updateUserFirebaseUid(userId: number, firebaseUid: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedUser = {
      ...user,
      firebase_uid: firebaseUid
    };
    
    this.users.set(userId, updatedUser);
    return { ...updatedUser, password: "[REDACTED]" } as User;
  }
  
  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const project: Project = {
      ...insertProject,
      id,
      created_at: new Date()
    };
    
    this.projects.set(id, project);
    return project;
  }
  
  // Risk operations
  async getRisk(id: number): Promise<Risk | undefined> {
    return this.risks.get(id);
  }
  
  async getAllRisks(): Promise<Risk[]> {
    return Array.from(this.risks.values());
  }
  
  async getRisksByProject(projectId: number): Promise<Risk[]> {
    return Array.from(this.risks.values()).filter(
      (risk) => risk.project_id === projectId
    );
  }
  
  async getRisksByOwner(ownerId: number): Promise<Risk[]> {
    return Array.from(this.risks.values()).filter(
      (risk) => risk.owner_id === ownerId
    );
  }
  
  async getFilteredRisks(filters: Partial<Risk>): Promise<Risk[]> {
    let risks = Array.from(this.risks.values());
    
    if (filters.project_id !== undefined) {
      risks = risks.filter(risk => risk.project_id === filters.project_id);
    }
    
    if (filters.owner_id !== undefined) {
      risks = risks.filter(risk => risk.owner_id === filters.owner_id);
    }
    
    if (filters.category !== undefined) {
      risks = risks.filter(risk => risk.category === filters.category);
    }
    
    if (filters.severity !== undefined) {
      risks = risks.filter(risk => risk.severity === filters.severity);
    }
    
    if (filters.status !== undefined) {
      risks = risks.filter(risk => risk.status === filters.status);
    }
    
    return risks;
  }
  
  async createRisk(insertRisk: InsertRisk): Promise<Risk> {
    const id = this.riskIdCounter++;
    const referenceId = generateReferenceId(this.risks.size);
    const severity = calculateSeverity(insertRisk.probability, insertRisk.impact);
    
    const risk: Risk = {
      ...insertRisk,
      id,
      reference_id: referenceId,
      severity,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.risks.set(id, risk);
    return risk;
  }
  
  async updateRisk(id: number, updates: Partial<Risk>): Promise<Risk | undefined> {
    const existingRisk = this.risks.get(id);
    if (!existingRisk) return undefined;
    
    // If probability or impact changed, recalculate severity
    let severity = existingRisk.severity;
    if (updates.probability !== undefined || updates.impact !== undefined) {
      const probability = updates.probability || existingRisk.probability;
      const impact = updates.impact || existingRisk.impact;
      severity = calculateSeverity(probability, impact);
    }
    
    const updatedRisk: Risk = {
      ...existingRisk,
      ...updates,
      severity,
      updated_at: new Date()
    };
    
    this.risks.set(id, updatedRisk);
    return updatedRisk;
  }
  
  async deleteRisk(id: number): Promise<boolean> {
    return this.risks.delete(id);
  }
  
  // Risk event operations
  async getRiskEvents(riskId: number): Promise<RiskEvent[]> {
    return Array.from(this.riskEvents.values()).filter(
      (event) => event.risk_id === riskId
    ).sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }
  
  async createRiskEvent(insertEvent: InsertRiskEvent): Promise<RiskEvent> {
    const id = this.riskEventIdCounter++;
    const event: RiskEvent = {
      ...insertEvent,
      id,
      created_at: new Date()
    };
    
    this.riskEvents.set(id, event);
    return event;
  }
  
  // Insight operations
  async getAllInsights(): Promise<Insight[]> {
    return Array.from(this.insights.values()).filter(
      (insight) => !insight.is_dismissed
    ).sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }
  
  async createInsight(insertInsight: InsertInsight): Promise<Insight> {
    const id = this.insightIdCounter++;
    const insight: Insight = {
      ...insertInsight,
      id,
      created_at: new Date(),
      is_dismissed: false
    };
    
    this.insights.set(id, insight);
    return insight;
  }
  
  async updateInsight(id: number, isDismissed: boolean): Promise<Insight | undefined> {
    const existingInsight = this.insights.get(id);
    if (!existingInsight) return undefined;
    
    const updatedInsight: Insight = {
      ...existingInsight,
      is_dismissed: isDismissed
    };
    
    this.insights.set(id, updatedInsight);
    return updatedInsight;
  }
  
  // Dashboard summary
  async getRiskSummary(): Promise<any> {
    const allRisks = await this.getAllRisks();
    const allInsights = await this.getAllInsights();
    
    // Count risks by severity
    const criticalRisks = allRisks.filter(risk => risk.severity === "Critical").length;
    const highRisks = allRisks.filter(risk => risk.severity === "High").length;
    
    // Calculate mitigation progress
    const mitigatedCount = allRisks.filter(risk => 
      ["Mitigated", "Closed"].includes(risk.status)
    ).length;
    const mitigationProgress = allRisks.length > 0 
      ? Math.round((mitigatedCount / allRisks.length) * 100) 
      : 0;
    
    // Group risks by category
    const risksByCategory = RISK_CATEGORIES.map(category => {
      const count = allRisks.filter(risk => risk.category === category).length;
      return { category, count };
    });
    
    // Group risks by severity
    const risksBySeverity = RISK_SEVERITY.map(severity => {
      const count = allRisks.filter(risk => risk.severity === severity).length;
      return { severity, count };
    });
    
    // Group risks by status
    const risksByStatus = RISK_STATUS.map(status => {
      const count = allRisks.filter(risk => risk.status === status).length;
      return { status, count };
    });
    
    // Get top risks (Critical and High severity)
    const topRisks = allRisks
      .filter(risk => ["Critical", "High"].includes(risk.severity))
      .sort((a, b) => {
        // Sort by severity first (Critical before High)
        if (a.severity === "Critical" && b.severity !== "Critical") return -1;
        if (a.severity !== "Critical" && b.severity === "Critical") return 1;
        
        // Then sort by date (most recent first)
        return b.created_at.getTime() - a.created_at.getTime();
      })
      .slice(0, 5); // Top 5
    
    // Create mock risk trend data
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const riskTrend = months.map(month => ({
      month,
      critical: Math.floor(Math.random() * 5) + 1, // 1-5
      high: Math.floor(Math.random() * 5) + 4,     // 4-8
      medium: Math.floor(Math.random() * 5) + 6    // 6-10
    }));
    
    // Generate heatmap data
    const heatmapData: { impact: number; probability: number; count: number }[] = [];
    for (let impact = 1; impact <= 5; impact++) {
      for (let probability = 1; probability <= 5; probability++) {
        const count = allRisks.filter(
          risk => risk.impact === impact && risk.probability === probability
        ).length;
        heatmapData.push({ impact, probability, count });
      }
    }
    
    return {
      totalRisks: allRisks.length,
      criticalRisks,
      highRisks,
      mitigationProgress,
      risksByCategory,
      risksBySeverity,
      risksByStatus,
      topRisks,
      riskTrend,
      heatmapData,
      insights: allInsights.slice(0, 4) // Top 4 insights
    };
  }
  
  // Seed data for testing
  private async seedData() {
    // Seed users
    const users = [
      { username: "admin", password: "admin123", name: "Admin User", email: "admin@riskpro.com", role: "Admin" },
      { username: "riskmgr", password: "risk123", name: "Sarah Johnson", email: "sarah@riskpro.com", role: "Risk Manager" },
      { username: "projectmgr", password: "project123", name: "Alex Cheng", email: "alex@riskpro.com", role: "Project Manager" },
      { username: "viewer", password: "viewer123", name: "John Watson", email: "john@riskpro.com", role: "Viewer" },
      { username: "maya", password: "maya123", name: "Maya Rodriguez", email: "maya@riskpro.com", role: "Project Manager" },
      { username: "david", password: "david123", name: "David Kim", email: "david@riskpro.com", role: "Risk Manager" }
    ];
    
    for (const user of users) {
      await this.createUser(user as InsertUser);
    }
    
    // Seed projects
    const projects = [
      { name: "Cloud Migration", description: "Migrate on-premise systems to cloud infrastructure", status: "Active", created_by: 1 },
      { name: "ERP Implementation", description: "Implement new enterprise resource planning system", status: "Active", created_by: 1 },
      { name: "Mobile App Development", description: "Develop new mobile application for customers", status: "Active", created_by: 3 }
    ];
    
    for (const project of projects) {
      await this.createProject(project as InsertProject);
    }
    
    // Seed risks
    const risks = [
      {
        title: "Data migration failure during system cutover",
        description: "Risk of data loss or corruption during the migration process",
        category: "Technical",
        probability: 4,
        impact: 5,
        status: "Needs Mitigation",
        mitigation_plan: "Implement comprehensive data backup strategy and perform multiple test migrations",
        owner_id: 3,
        project_id: 1,
        created_by: 2
      },
      {
        title: "Insufficient testing of security controls before deployment",
        description: "Security vulnerabilities may be introduced due to insufficient testing",
        category: "Security",
        probability: 3,
        impact: 5,
        status: "In Progress",
        mitigation_plan: "Engage third-party security auditor to perform penetration testing",
        owner_id: 6,
        project_id: 1,
        created_by: 2
      },
      {
        title: "Key stakeholder departure during critical project phase",
        description: "Loss of key project sponsor or stakeholder may impact decision making",
        category: "Organizational",
        probability: 3,
        impact: 4,
        status: "Needs Mitigation",
        mitigation_plan: "Document all key decisions and ensure multiple stakeholders are engaged",
        owner_id: 4,
        project_id: 2,
        created_by: 1
      },
      {
        title: "Budget overrun due to unforeseen infrastructure requirements",
        description: "Additional infrastructure requirements may exceed allocated budget",
        category: "Financial",
        probability: 4,
        impact: 4,
        status: "Identified",
        mitigation_plan: "Perform detailed infrastructure assessment and include contingency budget",
        owner_id: 2,
        project_id: 1,
        created_by: 2
      },
      {
        title: "Vendor API integration delays affecting timeline",
        description: "Dependency on third-party APIs may cause integration delays",
        category: "Technical",
        probability: 4,
        impact: 3,
        status: "In Progress",
        mitigation_plan: "Establish early communication with vendor and develop fallback interfaces",
        owner_id: 5,
        project_id: 3,
        created_by: 3
      },
      {
        title: "Regulatory compliance issues with data storage",
        description: "New regulations may impact data storage and processing",
        category: "External",
        probability: 2,
        impact: 5,
        status: "Identified",
        mitigation_plan: "Engage legal team to review compliance requirements",
        owner_id: 2,
        project_id: 2,
        created_by: 1
      },
      {
        title: "User adoption resistance to new system",
        description: "End users may resist adopting the new system due to change management issues",
        category: "Organizational",
        probability: 3,
        impact: 3,
        status: "Identified",
        mitigation_plan: "Develop comprehensive training program and identify champions",
        owner_id: 3,
        project_id: 2,
        created_by: 3
      },
      {
        title: "Performance issues in production environment",
        description: "System may experience performance degradation under production load",
        category: "Technical",
        probability: 3,
        impact: 4,
        status: "Needs Mitigation",
        mitigation_plan: "Perform load testing and optimize database queries",
        owner_id: 5,
        project_id: 3,
        created_by: 3
      }
    ];
    
    for (const risk of risks) {
      await this.createRisk(risk as InsertRisk);
    }
    
    // Seed risk events
    const events = [
      { risk_id: 1, event_type: "Status Change", description: "Risk status changed from Identified to Needs Mitigation", created_by: 2 },
      { risk_id: 2, event_type: "Status Change", description: "Risk status changed from Identified to In Progress", created_by: 6 },
      { risk_id: 2, event_type: "Comment", description: "Security team has begun implementing countermeasures", created_by: 6 },
      { risk_id: 3, event_type: "Status Change", description: "Risk status changed from Identified to Needs Mitigation", created_by: 1 },
      { risk_id: 5, event_type: "Status Change", description: "Risk status changed from Identified to In Progress", created_by: 3 },
      { risk_id: 5, event_type: "Comment", description: "Initial contact made with vendor API team", created_by: 5 }
    ];
    
    for (const event of events) {
      await this.createRiskEvent(event as InsertRiskEvent);
    }
    
    // Seed insights
    const insights = [
      {
        title: "Potential Security Vulnerability Pattern",
        description: "Based on your recent security risks, consider implementing additional penetration testing before deployment. 3 similar risks have been reported in the last 30 days.",
        type: "Pattern",
        related_category: "Security"
      },
      {
        title: "Budget Risk Trend Analysis",
        description: "Financial risks have increased by 15% this quarter. Consider reviewing vendor contracts and infrastructure costs for potential optimizations.",
        type: "Trend",
        related_category: "Financial"
      },
      {
        title: "Stakeholder Engagement Risk",
        description: "Low engagement from key stakeholders in recent meetings may impact project decisions. Consider scheduling dedicated sessions with decision makers.",
        type: "Warning",
        related_category: "Organizational"
      },
      {
        title: "Schedule Optimization",
        description: "Based on current progress, there's a 70% probability of timeline delays in the testing phase. Consider adjusting resources allocation in advance.",
        type: "Suggestion",
        related_category: "Operational"
      }
    ];
    
    for (const insight of insights) {
      await this.createInsight(insight as InsertInsight);
    }
  }
}

// Use Database Storage for production
export const storage = new DatabaseStorage();

// Initialize the database with seed data if needed
(async () => {
  if (storage instanceof DatabaseStorage) {
    try {
      await (storage as DatabaseStorage).initializeDatabase();
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }
})();
