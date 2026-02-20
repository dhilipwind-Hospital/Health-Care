import { Request, Response, NextFunction } from 'express';
import { PatientAccessGrantController } from '../controllers/patient-access-grant.controller';

/**
 * Cross-Organization Access Middleware
 * 
 * This middleware checks if a doctor from one organization has been granted
 * temporary access to view a patient's records from another organization.
 * 
 * IMPORTANT: This middleware should be applied AFTER authentication and
 * tenant context middlewares, and only on patient data endpoints.
 * 
 * When a valid cross-org grant is found:
 * - Sets req.crossOrgAccess with the grant details
 * - The controller can use patientOrganizationId to query the correct org's data
 */

export interface CrossOrgAccessContext {
    grantId: string;
    patientOrganizationId: string;
    patientOrganizationName?: string;
    expiresAt: Date;
    accessCount: number;
}

declare global {
    namespace Express {
        interface Request {
            crossOrgAccess?: CrossOrgAccessContext;
        }
    }
}

/**
 * Middleware to check for cross-organization patient access
 * @param getPatientId - Function to extract patientId from request
 */
export function checkCrossOrgAccess(getPatientId: (req: Request) => string | undefined) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = (req as any).user;

            // Only applies to authenticated doctors
            if (!user || String(user.role).toLowerCase() !== 'doctor') {
                return next();
            }

            const patientId = getPatientId(req);
            if (!patientId) {
                return next();
            }

            // Check if doctor has active cross-org access
            const activeGrant = await PatientAccessGrantController.hasActiveAccess(user.id, patientId);

            if (activeGrant) {
                // Attach cross-org access context to request
                req.crossOrgAccess = {
                    grantId: activeGrant.id,
                    patientOrganizationId: activeGrant.patientOrganizationId,
                    patientOrganizationName: activeGrant.patientOrganization?.name,
                    expiresAt: activeGrant.expiresAt!,
                    accessCount: activeGrant.accessCount
                };

                console.log(`[CrossOrgAccess] Doctor ${user.id} accessing patient ${patientId} via grant ${activeGrant.id}`);
            }

            return next();
        } catch (error) {
            console.error('Cross-org access check error:', error);
            // Don't block the request, just continue without cross-org context
            return next();
        }
    };
}

/**
 * Middleware to enforce cross-org access requirement
 * Use this on endpoints where cross-org access is the ONLY way to access
 * (i.e., when same-org access is already denied)
 */
export function requireCrossOrgAccess(getPatientId: (req: Request) => string | undefined) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = (req as any).user;

            if (!user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const patientId = getPatientId(req);
            if (!patientId) {
                return res.status(400).json({ message: 'Patient ID required' });
            }

            // Check for cross-org access
            const activeGrant = await PatientAccessGrantController.hasActiveAccess(user.id, patientId);

            if (!activeGrant) {
                return res.status(403).json({
                    message: 'You do not have access to this patient\'s records',
                    code: 'CROSS_ORG_ACCESS_REQUIRED',
                    hint: 'Request access through the Cross-Location Patient Access feature'
                });
            }

            // Attach context
            req.crossOrgAccess = {
                grantId: activeGrant.id,
                patientOrganizationId: activeGrant.patientOrganizationId,
                patientOrganizationName: activeGrant.patientOrganization?.name,
                expiresAt: activeGrant.expiresAt!,
                accessCount: activeGrant.accessCount
            };

            return next();
        } catch (error) {
            console.error('Require cross-org access error:', error);
            return res.status(500).json({ message: 'Access verification failed' });
        }
    };
}

/**
 * Helper function to get the effective organization ID for queries
 * Returns cross-org patient's org ID if applicable, otherwise current tenant
 */
export function getEffectiveOrgId(req: Request): string {
    if (req.crossOrgAccess) {
        return req.crossOrgAccess.patientOrganizationId;
    }
    return (req as any).tenant?.id;
}
