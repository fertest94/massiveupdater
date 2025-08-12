import { 
  UploadSession, 
  InsertUploadSession, 
  RecordResult, 
  InsertRecordResult,
  ExecutionBatch,
  InsertExecutionBatch,
  ProcessingStatus,
  ExecutionProgress,
  ExecutionResults
} from "@shared/schema";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export interface IStorage {
  // Session management
  createSession(session: InsertUploadSession): Promise<UploadSession>;
  getSession(id: string): Promise<UploadSession | undefined>;
  updateSessionStatus(id: string, status: string, processedData?: any[]): Promise<void>;
  
  // Record results
  createRecordResult(result: InsertRecordResult): Promise<RecordResult>;
  getRecordResults(sessionId: string): Promise<RecordResult[]>;
  updateRecordResult(id: string, updates: Partial<RecordResult>): Promise<void>;
  updateRecordResults(updates: Array<{id: string, data: Partial<RecordResult>}>): Promise<void>;
  
  // Execution batches
  createExecutionBatch(batch: InsertExecutionBatch): Promise<ExecutionBatch>;
  getExecutionBatches(sessionId: string): Promise<ExecutionBatch[]>;
  updateExecutionBatch(id: string, updates: Partial<ExecutionBatch>): Promise<void>;
  
  // Progress tracking
  getProcessingStatus(sessionId: string): Promise<ProcessingStatus | undefined>;
  getExecutionProgress(sessionId: string): Promise<ExecutionProgress | undefined>;
  getExecutionResults(sessionId: string): Promise<ExecutionResults | undefined>;
  
  // Cleanup
  deleteSession(id: string): Promise<void>;
}

// Simple file-based storage using JSON files
export class FileStorage implements IStorage {
  private dataDir: string;
  private sessionsFile: string;
  private resultsFile: string;
  private batchesFile: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.sessionsFile = path.join(this.dataDir, 'sessions.json');
    this.resultsFile = path.join(this.dataDir, 'results.json');
    this.batchesFile = path.join(this.dataDir, 'batches.json');
    this.ensureDataDir();
  }

  private async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.warn('Could not create data directory:', error);
    }
  }

  private async readFile<T>(filePath: string, defaultValue: T): Promise<T> {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return defaultValue;
    }
  }

  private async writeFile<T>(filePath: string, data: T): Promise<void> {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing to file:', error);
    }
  }

  async createSession(insertSession: InsertUploadSession): Promise<UploadSession> {
    const sessions = await this.readFile<Record<string, UploadSession>>(this.sessionsFile, {});
    const id = randomUUID();
    const session: UploadSession = {
      ...insertSession,
      id,
      createdAt: new Date(),
      status: insertSession.status || 'uploaded',
      processedData: null,
    };
    sessions[id] = session;
    await this.writeFile(this.sessionsFile, sessions);
    return session;
  }

  async getSession(id: string): Promise<UploadSession | undefined> {
    const sessions = await this.readFile<Record<string, UploadSession>>(this.sessionsFile, {});
    return sessions[id];
  }

  async updateSessionStatus(id: string, status: string, processedData?: any[]): Promise<void> {
    const sessions = await this.readFile<Record<string, UploadSession>>(this.sessionsFile, {});
    if (sessions[id]) {
      sessions[id] = { ...sessions[id], status, processedData: processedData || null };
      await this.writeFile(this.sessionsFile, sessions);
    }
  }

  async createRecordResult(insertResult: InsertRecordResult): Promise<RecordResult> {
    const results = await this.readFile<Record<string, RecordResult>>(this.resultsFile, {});
    const id = randomUUID();
    const result: RecordResult = {
      ...insertResult,
      id,
      action: insertResult.action || 'update',
      selected: insertResult.selected !== undefined ? insertResult.selected : true,
      status: insertResult.status || 'pending',
      bitrixId: insertResult.bitrixId || null,
      currentValue: insertResult.currentValue || null,
      errorMessage: insertResult.errorMessage || null,
    };
    results[id] = result;
    await this.writeFile(this.resultsFile, results);
    return result;
  }

  async getRecordResults(sessionId: string): Promise<RecordResult[]> {
    const results = await this.readFile<Record<string, RecordResult>>(this.resultsFile, {});
    return Object.values(results).filter(result => result.sessionId === sessionId);
  }

  async updateRecordResult(id: string, updates: Partial<RecordResult>): Promise<void> {
    const results = await this.readFile<Record<string, RecordResult>>(this.resultsFile, {});
    if (results[id]) {
      results[id] = { ...results[id], ...updates };
      await this.writeFile(this.resultsFile, results);
    }
  }

  async updateRecordResults(updates: Array<{id: string, data: Partial<RecordResult>}>): Promise<void> {
    const results = await this.readFile<Record<string, RecordResult>>(this.resultsFile, {});
    for (const update of updates) {
      if (results[update.id]) {
        results[update.id] = { ...results[update.id], ...update.data };
      }
    }
    await this.writeFile(this.resultsFile, results);
  }

  async createExecutionBatch(insertBatch: InsertExecutionBatch): Promise<ExecutionBatch> {
    const batches = await this.readFile<Record<string, ExecutionBatch>>(this.batchesFile, {});
    const id = randomUUID();
    const batch: ExecutionBatch = {
      ...insertBatch,
      id,
      status: insertBatch.status || 'pending',
      processedAt: null,
      errors: null,
    };
    batches[id] = batch;
    await this.writeFile(this.batchesFile, batches);
    return batch;
  }

  async getExecutionBatches(sessionId: string): Promise<ExecutionBatch[]> {
    const batches = await this.readFile<Record<string, ExecutionBatch>>(this.batchesFile, {});
    return Object.values(batches).filter(batch => batch.sessionId === sessionId);
  }

  async updateExecutionBatch(id: string, updates: Partial<ExecutionBatch>): Promise<void> {
    const batches = await this.readFile<Record<string, ExecutionBatch>>(this.batchesFile, {});
    if (batches[id]) {
      batches[id] = { ...batches[id], ...updates };
      await this.writeFile(this.batchesFile, batches);
    }
  }

  async getProcessingStatus(sessionId: string): Promise<ProcessingStatus | undefined> {
    const session = await this.getSession(sessionId);
    if (!session) return undefined;

    const results = await this.getRecordResults(sessionId);
    
    return {
      sessionId,
      status: session.status,
      progress: (results.length / session.totalRows) * 100,
      processedRows: results.length,
      totalRows: session.totalRows,
      errors: results.filter(r => r.status === 'error').length,
    };
  }

  async getExecutionProgress(sessionId: string): Promise<ExecutionProgress | undefined> {
    const session = await this.getSession(sessionId);
    if (!session) return undefined;

    const batches = await this.getExecutionBatches(sessionId);
    const results = await this.getRecordResults(sessionId);
    
    const completedBatches = batches.filter(b => b.status === 'completed').length;
    const totalBatches = batches.length;
    
    return {
      sessionId,
      status: session.status,
      progress: totalBatches > 0 ? (completedBatches / totalBatches) * 100 : 0,
      completedBatches,
      totalBatches,
      processedRows: results.length,
      totalRows: session.totalRows,
    };
  }

  async getExecutionResults(sessionId: string): Promise<ExecutionResults | undefined> {
    const session = await this.getSession(sessionId);
    if (!session) return undefined;

    const results = await this.getRecordResults(sessionId);
    const batches = await this.getExecutionBatches(sessionId);
    
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    const pending = results.filter(r => r.status === 'pending').length;
    
    return {
      sessionId,
      status: session.status,
      totalRows: results.length,
      processedRows: results.length,
      successful,
      failed,
      pending,
      batches: batches.length,
      completedBatches: batches.filter(b => b.status === 'completed').length,
    };
  }

  async deleteSession(id: string): Promise<void> {
    // Delete session
    const sessions = await this.readFile<Record<string, UploadSession>>(this.sessionsFile, {});
    delete sessions[id];
    await this.writeFile(this.sessionsFile, sessions);

    // Delete related results
    const results = await this.readFile<Record<string, RecordResult>>(this.resultsFile, {});
    const filteredResults = Object.fromEntries(
      Object.entries(results).filter(([_, result]) => result.sessionId !== id)
    );
    await this.writeFile(this.resultsFile, filteredResults);

    // Delete related batches
    const batches = await this.readFile<Record<string, ExecutionBatch>>(this.batchesFile, {});
    const filteredBatches = Object.fromEntries(
      Object.entries(batches).filter(([_, batch]) => batch.sessionId !== id)
    );
    await this.writeFile(this.batchesFile, filteredBatches);
  }
}

// Memory storage (original implementation)
export class MemStorage implements IStorage {
  private sessions: Map<string, UploadSession>;
  private recordResults: Map<string, RecordResult>;
  private executionBatches: Map<string, ExecutionBatch>;

  constructor() {
    this.sessions = new Map();
    this.recordResults = new Map();
    this.executionBatches = new Map();
  }

  async createSession(insertSession: InsertUploadSession): Promise<UploadSession> {
    const id = randomUUID();
    const session: UploadSession = {
      ...insertSession,
      id,
      createdAt: new Date(),
      status: insertSession.status || 'uploaded',
      processedData: null,
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSession(id: string): Promise<UploadSession | undefined> {
    return this.sessions.get(id);
  }

  async updateSessionStatus(id: string, status: string, processedData?: any[]): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      const updated = { ...session, status, processedData: processedData || null };
      this.sessions.set(id, updated);
    }
  }

  async createRecordResult(insertResult: InsertRecordResult): Promise<RecordResult> {
    const id = randomUUID();
    const result: RecordResult = {
      ...insertResult,
      id,
      action: insertResult.action || 'update',
      selected: insertResult.selected !== undefined ? insertResult.selected : true,
      status: insertResult.status || 'pending',
      bitrixId: insertResult.bitrixId || null,
      currentValue: insertResult.currentValue || null,
      errorMessage: insertResult.errorMessage || null,
    };
    this.recordResults.set(id, result);
    return result;
  }

  async getRecordResults(sessionId: string): Promise<RecordResult[]> {
    return Array.from(this.recordResults.values()).filter(
      result => result.sessionId === sessionId
    );
  }

  async updateRecordResult(id: string, updates: Partial<RecordResult>): Promise<void> {
    const result = this.recordResults.get(id);
    if (result) {
      const updated = { ...result, ...updates };
      this.recordResults.set(id, updated);
    }
  }

  async updateRecordResults(updates: Array<{id: string, data: Partial<RecordResult>}>): Promise<void> {
    for (const update of updates) {
      await this.updateRecordResult(update.id, update.data);
    }
  }

  async createExecutionBatch(insertBatch: InsertExecutionBatch): Promise<ExecutionBatch> {
    const id = randomUUID();
    const batch: ExecutionBatch = {
      ...insertBatch,
      id,
      status: insertBatch.status || 'pending',
      processedAt: null,
      errors: null,
    };
    this.executionBatches.set(id, batch);
    return batch;
  }

  async getExecutionBatches(sessionId: string): Promise<ExecutionBatch[]> {
    return Array.from(this.executionBatches.values()).filter(
      batch => batch.sessionId === sessionId
    );
  }

  async updateExecutionBatch(id: string, updates: Partial<ExecutionBatch>): Promise<void> {
    const batch = this.executionBatches.get(id);
    if (batch) {
      const updated = { ...batch, ...updates };
      this.executionBatches.set(id, updated);
    }
  }

  async getProcessingStatus(sessionId: string): Promise<ProcessingStatus | undefined> {
    const session = await this.getSession(sessionId);
    if (!session) return undefined;

    const results = await this.getRecordResults(sessionId);
    
    return {
      sessionId,
      status: session.status,
      progress: (results.length / session.totalRows) * 100,
      processedRows: results.length,
      totalRows: session.totalRows,
      errors: results.filter(r => r.status === 'error').length,
    };
  }

  async getExecutionProgress(sessionId: string): Promise<ExecutionProgress | undefined> {
    const session = await this.getSession(sessionId);
    if (!session) return undefined;

    const batches = await this.getExecutionBatches(sessionId);
    const results = await this.getRecordResults(sessionId);
    
    const completedBatches = batches.filter(b => b.status === 'completed').length;
    const totalBatches = batches.length;
    
    return {
      sessionId,
      status: session.status,
      progress: totalBatches > 0 ? (completedBatches / totalBatches) * 100 : 0,
      completedBatches,
      totalBatches,
      processedRows: results.length,
      totalRows: session.totalRows,
    };
  }

  async getExecutionResults(sessionId: string): Promise<ExecutionResults | undefined> {
    const session = await this.getSession(sessionId);
    if (!session) return undefined;

    const results = await this.getRecordResults(sessionId);
    const batches = await this.getExecutionBatches(sessionId);
    
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    const pending = results.filter(r => r.status === 'pending').length;
    
    return {
      sessionId,
      status: session.status,
      totalRows: results.length,
      processedRows: results.length,
      successful,
      failed,
      pending,
      batches: batches.length,
      completedBatches: batches.filter(b => b.status === 'completed').length,
    };
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
    // Delete related results
    Array.from(this.recordResults.entries())
      .filter(([_, result]) => result.sessionId === id)
      .forEach(([key, _]) => this.recordResults.delete(key));
    
    // Delete related batches
    Array.from(this.executionBatches.entries())
      .filter(([_, batch]) => batch.sessionId === id)
      .forEach(([key, _]) => this.executionBatches.delete(key));
  }
}

// Choose storage type based on environment
const useFileStorage = process.env.NODE_ENV === 'production' || process.env.USE_FILE_STORAGE === 'true';

export const storage = useFileStorage ? new FileStorage() : new MemStorage();
