import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { AuditLog } from '../models/AuditLog';

interface AuditableRequest extends Request {
  auditContext?: {
    action: string;
    entityType: string;
    entityId?: string;
    oldValues?: any;
    newValues?: any;
  };
}

export const createAuditLog = async (
  userId: string | undefined,
  organizationId: string | undefined,
  action: string,
  entityType: string,
  entityId: string | undefined,
  details: any,
  ipAddress: string | undefined,
  userAgent: string | undefined
) => {
  try {
    if (!AppDataSource.isInitialized) return;
    
    const repo = AppDataSource.getRepository(AuditLog);
    const log = repo.create({
      userId,
      organizationId,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
    });
    await repo.save(log);
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

export const auditAction = (action: string, entityType: string) => {
  return async (req: AuditableRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    res.json = (body: any) => {
      const userId = (req as any).user?.id;
      const organizationId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const ipAddress = req.ip || req.connection?.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = req.params?.id || body?.data?.id;
        const details: any = {
          method: req.method,
          path: req.path,
          query: req.query,
        };
        
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
          details.requestBody = sanitizeBody(req.body);
        }
        
        if (req.auditContext?.oldValues) {
          details.oldValues = req.auditContext.oldValues;
        }
        if (req.auditContext?.newValues || body?.data) {
          details.newValues = sanitizeBody(req.auditContext?.newValues || body?.data);
        }
        
        createAuditLog(
          userId,
          organizationId,
          action,
          entityType,
          entityId,
          details,
          ipAddress,
          userAgent
        );
      }
      
      return originalJson(body);
    };
    
    next();
  };
};

const sensitiveFields = ['password', 'token', 'secret', 'aadhaarNumber', 'signatureData'];

const sanitizeBody = (body: any): any => {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = Array.isArray(body) ? [...body] : { ...body };
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveFields.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeBody(sanitized[key]);
    }
  }
  
  return sanitized;
};

export const logLogin = async (
  userId: string,
  organizationId: string | undefined,
  ipAddress: string | undefined,
  userAgent: string | undefined,
  success: boolean,
  email?: string
) => {
  await createAuditLog(
    userId,
    organizationId,
    success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
    'User',
    userId,
    { email, success },
    ipAddress,
    userAgent
  );
};

export const logLogout = async (
  userId: string,
  organizationId: string | undefined,
  ipAddress: string | undefined,
  userAgent: string | undefined
) => {
  await createAuditLog(
    userId,
    organizationId,
    'LOGOUT',
    'User',
    userId,
    {},
    ipAddress,
    userAgent
  );
};
