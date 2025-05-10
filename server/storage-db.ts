import { 
  users, type User, type InsertUser, 
  projects, type Project, type InsertProject,
  risks, type Risk, type InsertRisk,
  riskEvents, type RiskEvent, type InsertRiskEvent,
  insights, type Insight, type InsertInsight,
  RISK_SEVERITY, RISK_STATUS, RISK_CATEGORIES
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, or, like, desc, asc, sql, count } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { IStorage } from "./storage";
import connectPg from "connect-pg-simple";
import session from "express-session";

// Promisify the scrypt function
const scryptAsync = promisify(scrypt);

// Generate hash for passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare password with stored hash
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
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
async function generateReferenceId(db: any): Promise<string> {
  const result = await db.select({ count: count() }).from(risks);
  const currentCount = result[0]?.count || 0;
  const paddedNumber = String(currentCount + 1).padStart(3, '0');
  return `R-${paddedNumber}`;
}

// Set up session store for PostgreSQL
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  // Project operations required by IStorage interface
  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined> {
    try {
      const [project] = await db
        .update(projects)
        .set({ ...updates, updated_at: new Date() })
        .where(eq(projects.id, id))
        .returning();
      return project;
    } catch (error) {
      console.error("Error updating project:", error);
      return undefined;
    }
  }
  
  async deleteProject(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(projects)
        .where(eq(projects.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting project:", error);
      return false;
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebase_uid, firebaseUid));
    return user;
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.google_id, googleId));
    return user;
  }

  async updateUserFirebaseUid(userId: number, firebaseUid: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ firebase_uid: firebaseUid })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  
  async updateUserGoogleId(userId: number, googleId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ google_id: googleId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  
  async updateUserPassword(userId: number, hashedPassword: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId))
        .returning();
      return user;
    } catch (error) {
      console.error("Error updating user password:", error);
      return undefined;
    }
  }

  async verifyPassword(supplied: string, stored: string): Promise<boolean> {
    return comparePasswords(supplied, stored);
  }

  async hashPassword(password: string): Promise<string> {
    return hashPassword(password);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // We won't hash the password here as auth.ts is already calling hashPassword before this
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  // Risk operations
  async getRisk(id: number): Promise<Risk | undefined> {
    const [risk] = await db.select().from(risks).where(eq(risks.id, id));
    return risk;
  }

  async getAllRisks(): Promise<Risk[]> {
    return await db.select().from(risks).orderBy(desc(risks.created_at));
  }

  async getRisksByProject(projectId: number): Promise<Risk[]> {
    return await db.select().from(risks).where(eq(risks.project_id, projectId));
  }

  async getRisksByOwner(ownerId: number): Promise<Risk[]> {
    return await db.select().from(risks).where(eq(risks.owner_id, ownerId));
  }

  async getFilteredRisks(filters: Partial<Risk>): Promise<Risk[]> {
    let query = db.select().from(risks);
    
    if (filters.category) {
      query = query.where(eq(risks.category, filters.category));
    }
    
    if (filters.severity) {
      query = query.where(eq(risks.severity, filters.severity));
    }
    
    if (filters.status) {
      query = query.where(eq(risks.status, filters.status));
    }
    
    if (filters.project_id) {
      query = query.where(eq(risks.project_id, filters.project_id));
    }
    
    if (filters.owner_id) {
      query = query.where(eq(risks.owner_id, filters.owner_id));
    }
    
    return await query;
  }

  async createRisk(insertRisk: InsertRisk): Promise<Risk> {
    // Generate reference ID if not provided
    if (!insertRisk.reference_id) {
      insertRisk.reference_id = await generateReferenceId(db);
    }
    
    // Calculate severity if not provided
    if (!insertRisk.severity) {
      insertRisk.severity = calculateSeverity(insertRisk.probability, insertRisk.impact);
    }
    
    const [risk] = await db.insert(risks).values(insertRisk).returning();
    return risk;
  }

  async updateRisk(id: number, updates: Partial<Risk>): Promise<Risk | undefined> {
    // Recalculate severity if probability or impact changed
    if ((updates.probability || updates.impact) && !updates.severity) {
      const risk = await this.getRisk(id);
      if (risk) {
        const probability = updates.probability || risk.probability;
        const impact = updates.impact || risk.impact;
        updates.severity = calculateSeverity(probability, impact);
      }
    }
    
    const [updatedRisk] = await db
      .update(risks)
      .set({
        ...updates,
        updated_at: new Date(),
      })
      .where(eq(risks.id, id))
      .returning();
      
    return updatedRisk;
  }

  async deleteRisk(id: number): Promise<boolean> {
    // First delete all related risk events
    await db.delete(riskEvents).where(eq(riskEvents.risk_id, id));
    
    // Then delete the risk
    const result = await db.delete(risks).where(eq(risks.id, id)).returning();
    return result.length > 0;
  }

  // Risk event operations
  async getRiskEvents(riskId: number): Promise<RiskEvent[]> {
    return await db
      .select()
      .from(riskEvents)
      .where(eq(riskEvents.risk_id, riskId))
      .orderBy(desc(riskEvents.created_at));
  }

  async createRiskEvent(insertEvent: InsertRiskEvent): Promise<RiskEvent> {
    const [event] = await db.insert(riskEvents).values(insertEvent).returning();
    return event;
  }

  // Insight operations
  async getAllInsights(): Promise<Insight[]> {
    return await db
      .select()
      .from(insights)
      .where(eq(insights.is_dismissed, false))
      .orderBy(desc(insights.created_at));
  }

  async createInsight(insertInsight: InsertInsight): Promise<Insight> {
    const [insight] = await db.insert(insights).values(insertInsight).returning();
    return insight;
  }

  async updateInsight(id: number, isDismissed: boolean): Promise<Insight | undefined> {
    const [updatedInsight] = await db
      .update(insights)
      .set({ is_dismissed: isDismissed })
      .where(eq(insights.id, id))
      .returning();
      
    return updatedInsight;
  }

  // Dashboard operations
  async getRiskSummary(): Promise<any> {
    // Get all risks
    const allRisks = await this.getAllRisks();
    
    // Calculate summary data
    const totalRisks = allRisks.length;
    const criticalRisks = allRisks.filter(r => r.severity === "Critical").length;
    const highRisks = allRisks.filter(r => r.severity === "High").length;
    
    // Calculate mitigation progress
    const mitigatedRisks = allRisks.filter(r => ["Mitigated", "Closed"].includes(r.status)).length;
    const mitigationProgress = totalRisks > 0 ? Math.round((mitigatedRisks / totalRisks) * 100) : 0;
    
    // Group risks by category
    const risksByCategory = RISK_CATEGORIES.map(category => {
      const count = allRisks.filter(r => r.category === category).length;
      return { category, count };
    }).filter(c => c.count > 0);
    
    // Group risks by severity
    const risksBySeverity = RISK_SEVERITY.map(severity => {
      const count = allRisks.filter(r => r.severity === severity).length;
      return { severity, count };
    }).filter(s => s.count > 0);
    
    // Group risks by status
    const risksByStatus = RISK_STATUS.map(status => {
      const count = allRisks.filter(r => r.status === status).length;
      return { status, count };
    }).filter(s => s.count > 0);
    
    // Get top risks (critical and high)
    const topRisks = allRisks
      .filter(r => ["Critical", "High"].includes(r.severity))
      .slice(0, 5);
    
    // Generate trend data (mock for now, in a real app would come from historical data)
    const riskTrend = [
      { month: "Jan", critical: 1, high: 3, medium: 4 },
      { month: "Feb", critical: 2, high: 4, medium: 3 },
      { month: "Mar", critical: 1, high: 5, medium: 3 },
      { month: "Apr", critical: 1, high: 2, medium: 5 },
      { month: "May", critical: 0, high: 3, medium: 6 },
      { month: "Jun", critical: 1, high: 3, medium: 4 },
    ];
    
    // Generate heatmap data
    const heatmapData = [];
    for (let impact = 1; impact <= 5; impact++) {
      for (let probability = 1; probability <= 5; probability++) {
        const count = allRisks.filter(r => r.impact === impact && r.probability === probability).length;
        if (count > 0) {
          heatmapData.push({ impact, probability, count });
        }
      }
    }
    
    // Get all active insights
    const activeInsights = await this.getAllInsights();
    
    return {
      totalRisks,
      criticalRisks,
      highRisks,
      mitigationProgress,
      risksByCategory,
      risksBySeverity,
      risksByStatus,
      topRisks,
      riskTrend,
      heatmapData,
      insights: activeInsights,
    };
  }

  // Initialize database with seed data
  async initializeDatabase(): Promise<void> {
    // Check if we need to seed data
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      return; // Database already has data, no need to seed
    }
    
    // Create users - hash passwords directly for seed data
    const adminUser = await this.createUser({
      username: "admin",
      password: await this.hashPassword("admin123"),
      name: "Admin User",
      email: "admin@riskaipro.com",
      role: "Admin"
    });
    
    const riskManager = await this.createUser({
      username: "riskmgr",
      password: await this.hashPassword("risk123"),
      name: "Sarah Johnson",
      email: "sarah@riskaipro.com",
      role: "Risk Manager"
    });
    
    const projectManager = await this.createUser({
      username: "projmgr",
      password: await this.hashPassword("proj123"),
      name: "Michael Chen",
      email: "michael@riskaipro.com",
      role: "Project Manager"
    });
    
    const viewer = await this.createUser({
      username: "viewer",
      password: await this.hashPassword("view123"),
      name: "Alex Thompson",
      email: "alex@riskaipro.com",
      role: "Viewer"
    });
    
    // Create projects
    const cloudProject = await this.createProject({
      name: "Cloud Migration",
      description: "Migration of on-premises infrastructure to cloud platforms",
      status: "Active",
      created_by: riskManager.id
    });
    
    const softwareProject = await this.createProject({
      name: "ERP Implementation",
      description: "Implementation of new enterprise resource planning system",
      status: "Active",
      created_by: projectManager.id
    });
    
    // Create risks for cloud project
    await this.createRisk({
      title: "Data migration failure during system cutover",
      description: "Risk of data loss or corruption during the migration process",
      reference_id: "R-001",
      category: "Technical",
      probability: 3,
      impact: 5,
      severity: "High",
      status: "In Progress",
      mitigation_plan: "Implement multiple backup strategies and conduct thorough testing before cutover",
      owner_id: riskManager.id,
      project_id: cloudProject.id,
      created_by: riskManager.id
    });
    
    await this.createRisk({
      title: "Cloud vendor lock-in",
      description: "Dependency on specific cloud provider technologies making future migrations difficult",
      reference_id: "R-002",
      category: "External",
      probability: 4,
      impact: 3,
      severity: "Medium",
      status: "Identified",
      mitigation_plan: "Design architecture using cloud-agnostic patterns and standard interfaces",
      owner_id: projectManager.id,
      project_id: cloudProject.id,
      created_by: riskManager.id
    });
    
    await this.createRisk({
      title: "Exceeding cloud budget",
      description: "Cloud costs exceeding planned budget due to misconfiguration or unexpected usage",
      reference_id: "R-003",
      category: "Financial",
      probability: 4,
      impact: 4,
      severity: "High",
      status: "Needs Mitigation",
      mitigation_plan: "Implement cost monitoring tools and set up budget alerts",
      owner_id: riskManager.id,
      project_id: cloudProject.id,
      created_by: riskManager.id
    });
    
    await this.createRisk({
      title: "Security breach after migration",
      description: "Increased security risks due to misconfigured cloud resources",
      reference_id: "R-004",
      category: "Security",
      probability: 3,
      impact: 5,
      severity: "High",
      status: "In Progress",
      mitigation_plan: "Conduct thorough security assessment and implement monitoring tools",
      owner_id: riskManager.id,
      project_id: cloudProject.id,
      created_by: riskManager.id
    });
    
    // Create risks for software project
    await this.createRisk({
      title: "Integration failures with legacy systems",
      description: "New ERP system fails to integrate with existing systems",
      reference_id: "R-005",
      category: "Technical",
      probability: 4,
      impact: 4,
      severity: "High",
      status: "In Progress",
      mitigation_plan: "Develop integration adapters and conduct thorough testing",
      owner_id: projectManager.id,
      project_id: softwareProject.id,
      created_by: projectManager.id
    });
    
    await this.createRisk({
      title: "Business process disruption",
      description: "Implementation causes significant disruption to business operations",
      reference_id: "R-006",
      category: "Operational",
      probability: 3,
      impact: 5,
      severity: "High",
      status: "Needs Mitigation",
      mitigation_plan: "Develop detailed change management plan and phased rollout",
      owner_id: projectManager.id,
      project_id: softwareProject.id,
      created_by: projectManager.id
    });
    
    await this.createRisk({
      title: "User resistance to new system",
      description: "Staff resistance to adopting new processes and interfaces",
      reference_id: "R-007",
      category: "Organizational",
      probability: 5,
      impact: 3,
      severity: "Medium",
      status: "In Progress",
      mitigation_plan: "Comprehensive training program and change champions",
      owner_id: projectManager.id,
      project_id: softwareProject.id,
      created_by: projectManager.id
    });
    
    await this.createRisk({
      title: "Vendor fails to deliver key features",
      description: "ERP vendor fails to deliver promised features by deadline",
      reference_id: "R-008",
      category: "External",
      probability: 2,
      impact: 5,
      severity: "Medium",
      status: "Identified",
      mitigation_plan: "Include penalties in contract and identify alternative solutions",
      owner_id: riskManager.id,
      project_id: softwareProject.id,
      created_by: riskManager.id
    });
    
    // Create some risk events
    await this.createRiskEvent({
      risk_id: 1,
      event_type: "Status Change",
      description: "Risk status changed from 'Identified' to 'In Progress'",
      created_by: riskManager.id
    });
    
    await this.createRiskEvent({
      risk_id: 1,
      event_type: "Comment",
      description: "Additional backup strategy implemented as preventive measure",
      created_by: riskManager.id
    });
    
    // Create some insights
    await this.createInsight({
      title: "High concentration of technical risks",
      description: "Technical risks account for 40% of all high and critical risks. Consider additional technical reviews.",
      type: "Pattern",
      related_category: "Technical"
    });
    
    await this.createInsight({
      title: "Cloud project risks increasing",
      description: "The Cloud Migration project shows an increasing trend in security-related risks. Additional security measures recommended.",
      type: "Trend",
      related_category: "Security"
    });
  }
}