import { pgTable, text, serial, integer, boolean, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role", { enum: ["Admin", "Risk Manager", "Project Manager", "Viewer"] }).notNull().default("Viewer"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Projects table schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status", { enum: ["Active", "Completed", "On Hold"] }).notNull().default("Active"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  created_by: integer("created_by").references(() => users.id),
});

// Risk categories enum
export const RISK_CATEGORIES = [
  "Technical",
  "Financial",
  "Operational",
  "Security",
  "Organizational",
  "External",
] as const;

// Risk severity levels enum
export const RISK_SEVERITY = [
  "Critical", 
  "High", 
  "Medium", 
  "Low", 
  "Very Low"
] as const;

// Risk status enum
export const RISK_STATUS = [
  "Identified",
  "Needs Mitigation",
  "In Progress",
  "Mitigated",
  "Closed",
  "Accepted"
] as const;

// Risks table schema
export const risks = pgTable("risks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  reference_id: text("reference_id").notNull(), // e.g., R-001
  category: text("category", { enum: RISK_CATEGORIES }).notNull(),
  probability: integer("probability").notNull(), // 1-5 scale
  impact: integer("impact").notNull(), // 1-5 scale 
  severity: text("severity", { enum: RISK_SEVERITY }).notNull(),
  status: text("status", { enum: RISK_STATUS }).notNull().default("Identified"),
  mitigation_plan: text("mitigation_plan"),
  owner_id: integer("owner_id").references(() => users.id),
  project_id: integer("project_id").references(() => projects.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  created_by: integer("created_by").references(() => users.id),
});

// Risk events table schema
export const riskEvents = pgTable("risk_events", {
  id: serial("id").primaryKey(),
  risk_id: integer("risk_id").references(() => risks.id).notNull(),
  event_type: text("event_type", { enum: ["Status Change", "Comment", "Update"] }).notNull(),
  description: text("description").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  created_by: integer("created_by").references(() => users.id),
});

// AI generated insights table schema
export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ["Pattern", "Trend", "Suggestion", "Warning"] }).notNull(),
  related_category: text("related_category", { enum: RISK_CATEGORIES }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  is_dismissed: boolean("is_dismissed").default(false),
});

// Define Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true, 
  email: true,
  role: true
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  status: true,
  created_by: true
});

export const insertRiskSchema = createInsertSchema(risks).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertRiskEventSchema = createInsertSchema(riskEvents).omit({
  id: true, 
  created_at: true
});

export const insertInsightSchema = createInsertSchema(insights).omit({
  id: true,
  created_at: true,
  is_dismissed: true
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Risk = typeof risks.$inferSelect;
export type InsertRisk = z.infer<typeof insertRiskSchema>;

export type RiskEvent = typeof riskEvents.$inferSelect;
export type InsertRiskEvent = z.infer<typeof insertRiskEventSchema>;

export type Insight = typeof insights.$inferSelect;
export type InsertInsight = z.infer<typeof insertInsightSchema>;

// Dashboard summary type
export type RiskSummary = {
  totalRisks: number;
  criticalRisks: number;
  highRisks: number;
  mitigationProgress: number;
  risksByCategory: { category: string; count: number }[];
  risksBySeverity: { severity: string; count: number }[];
  risksByStatus: { status: string; count: number }[];
  topRisks: Risk[];
  riskTrend: { month: string; critical: number; high: number; medium: number }[];
  heatmapData: { impact: number; probability: number; count: number }[];
  insights: Insight[];
};
