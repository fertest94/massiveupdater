import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, json, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// File upload session data
export const uploadSessions = pgTable("upload_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  totalRows: integer("total_rows").notNull(),
  targetType: text("target_type").notNull(), // 'contacts', 'companies', 'both'
  keyColumns: json("key_columns").$type<string[]>().notNull(),
  originalData: json("original_data").$type<any[]>().notNull(),
  processedData: json("processed_data").$type<any[]>(),
  status: text("status").notNull().default("uploaded"), // 'uploaded', 'processing', 'preview', 'executing', 'completed', 'error'
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Individual record processing results
export const recordResults = pgTable("record_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  rowIndex: integer("row_index").notNull(),
  searchKey: text("search_key").notNull(),
  bitrixId: text("bitrix_id"),
  field: text("field").notNull(),
  currentValue: text("current_value"),
  newValue: text("new_value").notNull(),
  action: text("action").notNull().default("update"), // 'update', 'ignore'
  status: text("status").notNull().default("pending"), // 'pending', 'found', 'not_found', 'duplicate', 'updated', 'error'
  errorMessage: text("error_message"),
  selected: boolean("selected").notNull().default(true),
});

// Execution batches for tracking progress
export const executionBatches = pgTable("execution_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  batchNumber: integer("batch_number").notNull(),
  recordIds: json("record_ids").$type<string[]>().notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
  processedAt: timestamp("processed_at"),
  errors: json("errors").$type<any[]>(),
});

// Schemas for validation
export const insertUploadSessionSchema = createInsertSchema(uploadSessions).omit({
  id: true,
  createdAt: true,
});

export const insertRecordResultSchema = createInsertSchema(recordResults).omit({
  id: true,
});

export const insertExecutionBatchSchema = createInsertSchema(executionBatches).omit({
  id: true,
  processedAt: true,
});

// File upload request schema
export const fileUploadSchema = z.object({
  targetType: z.enum(["contacts", "companies", "both"]),
  keyColumns: z.array(z.string()).min(1),
});

// Configuration schema
export const configurationSchema = z.object({
  sessionId: z.string(),
  targetType: z.enum(["contacts", "companies", "both"]),
  keyColumns: z.array(z.string()).min(1),
});

// Execution schema
export const executionSchema = z.object({
  sessionId: z.string(),
  recordIds: z.array(z.string()).optional(),
});

// Security validation schema
export const securitySchema = z.object({
  token: z.string(),
  domain: z.string(),
});

// Types
export type UploadSession = typeof uploadSessions.$inferSelect;
export type InsertUploadSession = z.infer<typeof insertUploadSessionSchema>;
export type RecordResult = typeof recordResults.$inferSelect;
export type InsertRecordResult = z.infer<typeof insertRecordResultSchema>;
export type ExecutionBatch = typeof executionBatches.$inferSelect;
export type InsertExecutionBatch = z.infer<typeof insertExecutionBatchSchema>;

// API Response types
export interface ProcessingStatus {
  sessionId: string;
  status: string;
  progress: number;
  currentRow: number;
  totalRows: number;
  found: number;
  notFound: number;
  duplicates: number;
  errors: number;
}

export interface ExecutionProgress {
  sessionId: string;
  status: string;
  progress: number;
  processed: number;
  remaining: number;
  errors: number;
  currentBatch: number;
  totalBatches: number;
}

export interface ExecutionResults {
  sessionId: string;
  totalUpdated: number;
  totalNotFound: number;
  totalDuplicates: number;
  totalErrors: number;
  notFoundRecords: any[];
  duplicateRecords: any[];
  errorRecords: any[];
}
