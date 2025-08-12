import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { z } from "zod";
import {
  fileUploadSchema,
  configurationSchema,
  executionSchema,
  securitySchema,
} from "@shared/schema";

// Extend Express Request type
interface AuthenticatedRequest extends Request {
  bitrixDomain?: string;
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv'
    ];
    
    if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .xlsx and .csv files are allowed.'));
    }
  },
});

// Security middleware
function validateSecurity(req: AuthenticatedRequest, res: Response, next: any) {
  try {
    const token = req.query.token || req.headers['x-auth-token'];
    const domain = req.query.domain || req.headers['x-bitrix-domain'];
    
    const secretToken = process.env.APP_SECRET_TOKEN;
    const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || [];
    
    if (!secretToken) {
      return res.status(500).json({ message: 'APP_SECRET_TOKEN not configured' });
    }
    
    if (token !== secretToken) {
      return res.status(401).json({ message: 'Invalid or missing token' });
    }
    
    if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
      return res.status(403).json({ message: 'Domain not authorized' });
    }
    
    req.bitrixDomain = domain;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Security validation failed' });
  }
}

// Rate limiting for Bitrix24 API calls
const rateLimiter = {
  lastCall: 0,
  minInterval: 500, // 2 requests per second = 500ms interval
  
  async wait() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    
    if (timeSinceLastCall < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastCall = Date.now();
  }
};

// Bitrix24 API helper
async function callBitrixAPI(domain: string, method: string, params: any = {}) {
  await rateLimiter.wait();
  
  const webhookUrl = process.env.BITRIX_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('BITRIX_WEBHOOK_URL not configured');
  }
  
  const url = webhookUrl.replace('{domain}', domain);
  const response = await fetch(`${url}${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    throw new Error(`Bitrix API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

// Parse uploaded file
function parseFile(buffer: Buffer, filename: string): any[] {
  const isExcel = filename.endsWith('.xlsx') || filename.endsWith('.xls');
  
  if (isExcel) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  } else {
    // CSV parsing
    const csvText = buffer.toString('utf-8');
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });
    
    if (parsed.errors.length > 0) {
      throw new Error(`CSV parsing error: ${parsed.errors[0].message}`);
    }
    
    return parsed.data;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Security validation endpoint
  app.post("/api/validate-security", (req, res) => {
    try {
      const { token, domain } = securitySchema.parse(req.body);
      
      const secretToken = process.env.APP_SECRET_TOKEN;
      const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || [];
      
      if (!secretToken || token !== secretToken) {
        return res.status(401).json({ 
          valid: false, 
          message: 'Invalid token' 
        });
      }
      
      if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
        return res.status(403).json({ 
          valid: false, 
          message: 'Domain not authorized' 
        });
      }
      
      res.json({ valid: true });
    } catch (error) {
      res.status(400).json({ 
        valid: false, 
        message: 'Invalid request data' 
      });
    }
  });

  // File upload endpoint
  app.post("/api/upload", validateSecurity, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { targetType, keyColumns } = fileUploadSchema.parse(req.body);
      
      // Parse file data
      const fileData = parseFile(req.file.buffer, req.file.originalname);
      
      if (fileData.length === 0) {
        return res.status(400).json({ message: 'File is empty or could not be parsed' });
      }
      
      if (fileData.length > 100000) {
        return res.status(400).json({ message: 'File exceeds maximum of 100,000 rows' });
      }
      
      // Validate key columns exist in data
      const firstRow = fileData[0];
      const availableColumns = Object.keys(firstRow);
      const invalidColumns = keyColumns.filter(col => !availableColumns.includes(col));
      
      if (invalidColumns.length > 0) {
        return res.status(400).json({ 
          message: `Key columns not found: ${invalidColumns.join(', ')}`,
          availableColumns 
        });
      }

      // Create session
      const session = await storage.createSession({
        fileName: req.file.originalname,
        fileSize: req.file.size,
        totalRows: fileData.length,
        targetType,
        keyColumns,
        originalData: fileData,
        status: 'uploaded',
      });

      res.json({
        sessionId: session.id,
        fileName: session.fileName,
        fileSize: session.fileSize,
        totalRows: session.totalRows,
        availableColumns,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Process file and search Bitrix24
  app.post("/api/process", validateSecurity, async (req, res) => {
    try {
      const { sessionId, targetType, keyColumns } = configurationSchema.parse(req.body);
      
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Update session configuration
      await storage.updateSessionStatus(sessionId, 'processing');

      // Start background processing
      processFileInBackground(sessionId, session.originalData, targetType, keyColumns, req.bitrixDomain);

      res.json({ message: 'Processing started', sessionId });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get processing status
  app.get("/api/status/:sessionId", validateSecurity, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const status = await storage.getProcessingStatus(sessionId);
      
      if (!status) {
        return res.status(404).json({ message: 'Session not found' });
      }

      res.json(status);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get preview data
  app.get("/api/preview/:sessionId", validateSecurity, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const filter = req.query.filter as string;
      const search = req.query.search as string;

      let results = await storage.getRecordResults(sessionId);
      
      // Apply filters
      if (filter && filter !== 'all') {
        results = results.filter(r => {
          switch (filter) {
            case 'update': return r.action === 'update';
            case 'ignore': return r.action === 'ignore';
            case 'not_found': return r.status === 'not_found';
            case 'duplicates': return r.status === 'duplicate';
            default: return true;
          }
        });
      }

      // Apply search
      if (search) {
        const searchLower = search.toLowerCase();
        results = results.filter(r => 
          r.searchKey.toLowerCase().includes(searchLower) ||
          r.newValue.toLowerCase().includes(searchLower) ||
          (r.currentValue && r.currentValue.toLowerCase().includes(searchLower))
        );
      }

      // Pagination
      const total = results.length;
      const offset = (page - 1) * limit;
      const paginatedResults = results.slice(offset, offset + limit);

      res.json({
        results: paginatedResults,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update preview data
  app.patch("/api/preview/:sessionId", validateSecurity, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const updates = req.body.updates as Array<{id: string, data: any}>;

      await storage.updateRecordResults(updates);

      res.json({ message: 'Records updated successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Execute updates
  app.post("/api/execute", validateSecurity, async (req, res) => {
    try {
      const { sessionId, recordIds } = executionSchema.parse(req.body);
      
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      await storage.updateSessionStatus(sessionId, 'executing');

      // Start background execution
      executeUpdatesInBackground(sessionId, recordIds, req.bitrixDomain);

      res.json({ message: 'Execution started', sessionId });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get execution progress
  app.get("/api/execution/:sessionId", validateSecurity, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const progress = await storage.getExecutionProgress(sessionId);
      
      if (!progress) {
        return res.status(404).json({ message: 'Session not found' });
      }

      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get execution results
  app.get("/api/results/:sessionId", validateSecurity, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const results = await storage.getExecutionResults(sessionId);
      
      if (!results) {
        return res.status(404).json({ message: 'Session not found' });
      }

      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Download CSV reports
  app.get("/api/download/:sessionId/:type", validateSecurity, async (req, res) => {
    try {
      const { sessionId, type } = req.params;
      const results = await storage.getExecutionResults(sessionId);
      
      if (!results) {
        return res.status(404).json({ message: 'Session not found' });
      }

      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'not-found':
          data = results.notFoundRecords;
          filename = `not-found-${sessionId}.csv`;
          break;
        case 'duplicates':
          data = results.duplicateRecords;
          filename = `duplicates-${sessionId}.csv`;
          break;
        case 'errors':
          data = results.errorRecords;
          filename = `errors-${sessionId}.csv`;
          break;
        default:
          return res.status(400).json({ message: 'Invalid download type' });
      }

      if (data.length === 0) {
        return res.status(404).json({ message: 'No data available for download' });
      }

      // Convert to CSV
      const csv = Papa.unparse(data);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Undo changes
  app.post("/api/undo/:sessionId", validateSecurity, async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      const results = await storage.getRecordResults(sessionId);
      const updatedRecords = results.filter(r => r.status === 'updated' && r.bitrixId);

      // Revert changes in Bitrix24
      await revertChangesInBackground(sessionId, updatedRecords, req.bitrixDomain);

      res.json({ message: 'Undo process started', sessionId });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Background processing functions
  async function processFileInBackground(sessionId: string, data: any[], targetType: string, keyColumns: string[], domain: string) {
    try {
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        // Try each key column in order
        let found = false;
        for (const keyCol of keyColumns) {
          const searchValue = row[keyCol];
          if (!searchValue) continue;

          try {
            // Search in Bitrix24
            const searchResult = await searchInBitrix24(searchValue, keyCol, targetType, domain);
            
            if (searchResult) {
              // Create record for each field to update
              const fieldsToUpdate = Object.keys(row).filter(key => !keyColumns.includes(key));
              
              for (const field of fieldsToUpdate) {
                await storage.createRecordResult({
                  sessionId,
                  rowIndex: i,
                  searchKey: `${keyCol}: ${searchValue}`,
                  bitrixId: searchResult.id,
                  field,
                  currentValue: searchResult.fields[field] || '',
                  newValue: row[field] || '',
                  action: 'update',
                  status: 'found',
                  selected: true,
                });
              }
              
              found = true;
              break;
            }
          } catch (error) {
            console.error(`Error searching for ${searchValue}:`, error);
          }
        }

        if (!found) {
          // Record not found
          const fieldsToUpdate = Object.keys(row).filter(key => !keyColumns.includes(key));
          
          for (const field of fieldsToUpdate) {
            await storage.createRecordResult({
              sessionId,
              rowIndex: i,
              searchKey: keyColumns.map(col => `${col}: ${row[col]}`).join(', '),
              field,
              newValue: row[field] || '',
              action: 'ignore',
              status: 'not_found',
              selected: false,
            });
          }
        }
      }

      await storage.updateSessionStatus(sessionId, 'preview');
    } catch (error) {
      console.error('Processing error:', error);
      await storage.updateSessionStatus(sessionId, 'error');
    }
  }

  async function searchInBitrix24(searchValue: string, keyColumn: string, targetType: string, domain: string) {
    const searchMethods = {
      contacts: 'crm.contact.list',
      companies: 'crm.company.list',
    };

    let results: any[] = [];

    if (targetType === 'both') {
      // Search both contacts and companies
      try {
        const contactResult = await callBitrixAPI(domain, searchMethods.contacts, {
          filter: { [keyColumn]: searchValue },
          select: ['ID', '*'],
        });
        results = results.concat(contactResult.result || []);
      } catch (error) {
        console.error('Contact search error:', error);
      }

      try {
        const companyResult = await callBitrixAPI(domain, searchMethods.companies, {
          filter: { [keyColumn]: searchValue },
          select: ['ID', '*'],
        });
        results = results.concat(companyResult.result || []);
      } catch (error) {
        console.error('Company search error:', error);
      }
    } else {
      const method = searchMethods[targetType as keyof typeof searchMethods];
      const result = await callBitrixAPI(domain, method, {
        filter: { [keyColumn]: searchValue },
        select: ['ID', '*'],
      });
      results = result.result || [];
    }

    if (results.length === 0) return null;
    if (results.length > 1) {
      // Mark as duplicate but return first result
      return { ...results[0], isDuplicate: true };
    }

    return results[0];
  }

  async function executeUpdatesInBackground(sessionId: string, recordIds?: string[], domain?: string) {
    try {
      let results = await storage.getRecordResults(sessionId);
      
      if (recordIds) {
        results = results.filter(r => recordIds.includes(r.id!));
      } else {
        results = results.filter(r => r.selected && r.action === 'update' && r.bitrixId);
      }

      // Create batches of 50
      const batchSize = 50;
      const batches: string[][] = [];
      
      for (let i = 0; i < results.length; i += batchSize) {
        const batchRecords = results.slice(i, i + batchSize);
        const batch = await storage.createExecutionBatch({
          sessionId,
          batchNumber: Math.floor(i / batchSize) + 1,
          recordIds: batchRecords.map(r => r.id!),
          status: 'pending',
        });
        batches.push(batchRecords.map(r => r.id!));
      }

      // Process each batch
      for (const batchRecordIds of batches) {
        const batchResults = results.filter(r => batchRecordIds.includes(r.id!));
        
        try {
          // Group by entity type and ID for batch API
          const contactUpdates: any[] = [];
          const companyUpdates: any[] = [];

          for (const result of batchResults) {
            const updateData = {
              id: result.bitrixId,
              fields: { [result.field]: result.newValue },
            };

            // Determine entity type (simplified)
            if (result.bitrixId!.startsWith('C')) {
              companyUpdates.push(updateData);
            } else {
              contactUpdates.push(updateData);
            }
          }

          // Execute batch updates
          if (contactUpdates.length > 0) {
            await callBitrixAPI(domain!, 'crm.contact.batch', {
              cmd: contactUpdates.reduce((acc: any, update, index) => {
                acc[`contact_${index}`] = `crm.contact.update?id=${update.id}&fields=${JSON.stringify(update.fields)}`;
                return acc;
              }, {}),
            });
          }

          if (companyUpdates.length > 0) {
            await callBitrixAPI(domain!, 'crm.company.batch', {
              cmd: companyUpdates.reduce((acc: any, update, index) => {
                acc[`company_${index}`] = `crm.company.update?id=${update.id}&fields=${JSON.stringify(update.fields)}`;
                return acc;
              }, {}),
            });
          }

          // Update record statuses
          for (const result of batchResults) {
            await storage.updateRecordResult(result.id!, {
              status: 'completed',
            });
          }
        } catch (error) {
          console.error('Batch execution error:', error);
          for (const result of batchResults) {
            await storage.updateRecordResult(result.id!, {
              status: 'error',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }

      await storage.updateSessionStatus(sessionId, 'completed');
    } catch (error) {
      console.error('Execution error:', error);
      await storage.updateSessionStatus(sessionId, 'error');
    }
  }

  async function revertChangesInBackground(sessionId: string, updatedRecords: any[], domain: string) {
    try {
      for (const record of updatedRecords) {
        if (record.currentValue !== null && record.currentValue !== undefined) {
          // Revert to original value
          await callBitrixAPI(domain, 
            record.bitrixId!.startsWith('C') ? 'crm.company.update' : 'crm.contact.update',
            {
              id: record.bitrixId,
              fields: { [record.field]: record.currentValue },
            }
          );

          // Update record status
          await storage.updateRecordResult(record.id!, { 
            status: 'found',
            newValue: record.currentValue,
          });
        }
      }
    } catch (error) {
      console.error('Undo error:', error);
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
