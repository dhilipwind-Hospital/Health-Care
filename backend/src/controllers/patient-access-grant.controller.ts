import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database';
import { PatientAccessGrant, AccessGrantStatus, AccessDuration } from '../models/PatientAccessGrant';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { UserRole } from '../types/roles';
import { MoreThan, LessThan, In } from 'typeorm';
import { EmailService } from '../services/email.service';

// Helper to send emails using EmailService
const sendEmail = async (options: { to: string; subject: string; html: string }) => {
    return EmailService.sendEmail(options);
};


/**
 * PatientAccessGrantController
 * 
 * Manages cross-location patient record access requests.
 * Allows doctors from one organization to request temporary access
 * to patient records from another organization with patient consent.
 */
export class PatientAccessGrantController {

    // ============================================================
    // DOCTOR ENDPOINTS
    // ============================================================

    /**
     * Search for patients across organizations
     * Returns limited information until access is granted
     */
    static searchPatientCrossOrg = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { searchQuery, searchType = 'id' } = req.query;

            // Only doctors can search
            if (user.role !== 'doctor') {
                return res.status(403).json({ message: 'Only doctors can search for cross-location patients' });
            }

            if (!searchQuery || String(searchQuery).trim().length < 3) {
                return res.status(400).json({ message: 'Search query must be at least 3 characters' });
            }

            const userRepo = AppDataSource.getRepository(User);
            const query = String(searchQuery).trim().toLowerCase();

            // Search across all organizations for patients
            const queryBuilder = userRepo.createQueryBuilder('user')
                .leftJoinAndSelect('user.organization', 'organization')
                .where('user.role = :role', { role: 'patient' })
                .andWhere('user.isActive = :isActive', { isActive: true })
                .andWhere('organization.id != :currentOrgId', { currentOrgId: user.organizationId });

            // Auto-detect email format if user forgot to change dropdown
            let effectiveSearchType = searchType;
            if (query.includes('@')) {
                effectiveSearchType = 'email';
            }

            // Search by different criteria
            if (effectiveSearchType === 'id') {
                queryBuilder.andWhere('LOWER(user.id) LIKE :query', { query: `%${query}%` });
            } else if (effectiveSearchType === 'email') {
                queryBuilder.andWhere('LOWER(user.email) LIKE :query', { query: `%${query}%` });
            } else if (effectiveSearchType === 'phone') {
                queryBuilder.andWhere('user.phone LIKE :query', { query: `%${query}%` });
            } else {
                // Name search
                queryBuilder.andWhere(
                    '(LOWER(user.firstName) LIKE :query OR LOWER(user.lastName) LIKE :query)',
                    { query: `%${query}%` }
                );
            }

            const patients = await queryBuilder.limit(10).getMany();

            // Return masked patient info (limited data until access granted)
            const maskedResults = patients.map(p => ({
                id: p.id,
                displayId: `PID-${p.organization?.subdomain?.toUpperCase() || 'UNK'}-${p.id.slice(-6).toUpperCase()}`,
                firstName: p.firstName,
                lastName: p.lastName,
                // Mask sensitive info
                email: maskEmail(p.email),
                phone: p.phone ? maskPhone(p.phone) : null,
                organization: {
                    id: p.organization?.id,
                    name: p.organization?.name,
                    subdomain: p.organization?.subdomain
                },
                // Indicate this is from another organization
                isCrossLocation: true
            }));

            return res.json({
                data: maskedResults,
                total: maskedResults.length,
                message: maskedResults.length === 0
                    ? 'No patients found matching your search criteria'
                    : `Found ${maskedResults.length} patient(s) from other locations`
            });
        } catch (error) {
            console.error('Cross-org patient search error:', error);
            return res.status(500).json({ message: 'Failed to search patients' });
        }
    };

    /**
     * Request access to a patient's records
     * Sends email to patient for approval
     */
    static requestAccess = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { patientId, reason, duration = AccessDuration.HOURS_24, urgencyLevel = 'normal' } = req.body;

            // Validate doctor role
            if (user.role !== 'doctor') {
                return res.status(403).json({ message: 'Only doctors can request patient access' });
            }

            if (!patientId) {
                return res.status(400).json({ message: 'Patient ID is required' });
            }

            if (!reason || reason.trim().length < 10) {
                return res.status(400).json({ message: 'Please provide a detailed reason (minimum 10 characters)' });
            }

            // Validate duration
            const validDurations = Object.values(AccessDuration);
            if (!validDurations.includes(duration)) {
                return res.status(400).json({
                    message: 'Invalid duration',
                    validOptions: validDurations
                });
            }

            const userRepo = AppDataSource.getRepository(User);
            const grantRepo = AppDataSource.getRepository(PatientAccessGrant);

            // Find patient
            const patient = await userRepo.findOne({
                where: { id: patientId, role: UserRole.PATIENT, isActive: true },
                relations: ['organization']
            });

            if (!patient) {
                return res.status(404).json({ message: 'Patient not found' });
            }

            // Ensure patient is from different organization
            if (patient.organizationId === user.organizationId) {
                return res.status(400).json({
                    message: 'This patient is from your organization. Use standard access methods.'
                });
            }

            // Check for existing pending or active request
            const existingRequest = await grantRepo.findOne({
                where: [
                    { patientId, requestingDoctorId: user.id, status: AccessGrantStatus.PENDING },
                    {
                        patientId,
                        requestingDoctorId: user.id,
                        status: AccessGrantStatus.APPROVED,
                        expiresAt: MoreThan(new Date())
                    }
                ]
            });

            if (existingRequest) {
                if (existingRequest.status === AccessGrantStatus.PENDING) {
                    return res.status(400).json({
                        message: 'You already have a pending request for this patient',
                        requestId: existingRequest.id,
                        requestedAt: existingRequest.createdAt
                    });
                }
                if (existingRequest.status === AccessGrantStatus.APPROVED) {
                    return res.status(400).json({
                        message: 'You already have active access to this patient',
                        expiresAt: existingRequest.expiresAt
                    });
                }
            }

            // Get doctor info
            const doctor = await userRepo.findOne({
                where: { id: user.id },
                relations: ['organization']
            });

            // Generate secure tokens
            const accessToken = uuidv4();
            const rejectionToken = uuidv4();

            // Create access request
            const accessRequest = grantRepo.create({
                patientId,
                patientOrganizationId: patient.organizationId,
                requestingDoctorId: user.id,
                doctorOrganizationId: user.organizationId,
                status: AccessGrantStatus.PENDING,
                requestedDuration: duration,
                accessToken,
                rejectionToken,
                reason: reason.trim(),
                urgencyLevel,
                doctorIpAddress: req.ip || req.socket.remoteAddress
            });

            await grantRepo.save(accessRequest);

            // Build approval/rejection URLs
            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const approveUrl = `${baseUrl}/access-grant/approve/${accessRequest.id}/${accessToken}`;
            const rejectUrl = `${baseUrl}/access-grant/reject/${accessRequest.id}/${rejectionToken}`;

            // Send email to patient
            try {
                await sendEmail({
                    to: patient.email,
                    subject: `🔒 Medical Record Access Request - ${urgencyLevel === 'emergency' ? 'URGENT' : 'Action Required'}`,
                    html: generateAccessRequestEmail({
                        patientName: `${patient.firstName} ${patient.lastName}`,
                        doctorName: `Dr. ${doctor?.firstName} ${doctor?.lastName}`,
                        doctorOrganization: doctor?.organization?.name || 'Unknown Hospital',
                        patientOrganization: patient.organization?.name || 'Your Hospital',
                        reason,
                        duration: PatientAccessGrant.getDurationLabel(duration),
                        urgencyLevel,
                        approveUrl,
                        rejectUrl
                    })
                });

                await grantRepo.update(accessRequest.id, { emailSentAt: new Date() });
            } catch (emailError) {
                console.error('Failed to send access request email:', emailError);
                // Continue anyway - request is created
            }

            return res.status(201).json({
                message: 'Access request sent successfully',
                requestId: accessRequest.id,
                status: 'pending',
                patientEmail: maskEmail(patient.email),
                duration: PatientAccessGrant.getDurationLabel(duration),
                note: 'The patient will receive an email to approve or reject your request.'
            });
        } catch (error) {
            console.error('Request access error:', error);
            return res.status(500).json({ message: 'Failed to create access request' });
        }
    };

    /**
     * Get doctor's pending and active access requests
     */
    static getDoctorRequests = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { status } = req.query;

            const grantRepo = AppDataSource.getRepository(PatientAccessGrant);

            const whereConditions: any = { requestingDoctorId: user.id };

            if (status) {
                whereConditions.status = status;
            }

            const requests = await grantRepo.find({
                where: whereConditions,
                relations: ['patient', 'patientOrganization'],
                order: { createdAt: 'DESC' },
                take: 50
            });

            const formattedRequests = requests.map(r => ({
                id: r.id,
                status: r.status,
                patient: {
                    id: r.patient?.id,
                    displayId: `PID-${r.patientOrganization?.subdomain?.toUpperCase() || 'UNK'}-${r.patient?.id?.slice(-6).toUpperCase()}`,
                    name: `${r.patient?.firstName} ${r.patient?.lastName}`,
                    organization: r.patientOrganization?.name
                },
                reason: r.reason,
                requestedDuration: PatientAccessGrant.getDurationLabel(r.requestedDuration),
                urgencyLevel: r.urgencyLevel,
                requestedAt: r.createdAt,
                grantedAt: r.grantedAt,
                expiresAt: r.expiresAt,
                isActive: r.isActive(),
                remainingTime: r.isActive() ? formatDuration(r.getRemainingTimeMs()) : null,
                accessCount: r.accessCount
            }));

            return res.json({
                data: formattedRequests,
                total: formattedRequests.length
            });
        } catch (error) {
            console.error('Get doctor requests error:', error);
            return res.status(500).json({ message: 'Failed to fetch access requests' });
        }
    };

    // ============================================================
    // PATIENT ENDPOINTS
    // ============================================================

    /**
     * Approve access request (via email link or UI)
     */
    static approveAccess = async (req: Request, res: Response) => {
        try {
            const { requestId, token } = req.params;

            const grantRepo = AppDataSource.getRepository(PatientAccessGrant);

            const accessRequest = await grantRepo.findOne({
                where: { id: requestId },
                relations: ['requestingDoctor', 'patient', 'doctorOrganization', 'patientOrganization']
            });

            if (!accessRequest) {
                return res.status(404).json({
                    message: 'Access request not found',
                    code: 'REQUEST_NOT_FOUND'
                });
            }

            // Handle already approved requests gracefully
            if (accessRequest.status === AccessGrantStatus.APPROVED) {
                return res.json({
                    success: true,
                    message: 'Access already granted',
                    details: {
                        doctorName: `Dr. ${accessRequest.requestingDoctor.firstName} ${accessRequest.requestingDoctor.lastName}`,
                        hospital: accessRequest.doctorOrganization?.name,
                        duration: PatientAccessGrant.getDurationLabel(accessRequest.requestedDuration),
                        expiresAt: accessRequest.expiresAt,
                        accessibleFrom: accessRequest.grantedAt || new Date()
                    }
                });
            }

            // Verify token for pending requests
            if (accessRequest.status !== AccessGrantStatus.PENDING || accessRequest.accessToken !== token) {
                return res.status(404).json({
                    message: 'Invalid access token or request already processed',
                    code: 'INVALID_TOKEN'
                });
            }

            // Calculate expiry time
            const durationMs = PatientAccessGrant.getDurationMs(accessRequest.requestedDuration);
            const expiresAt = new Date(Date.now() + durationMs);

            // Approve the request
            await grantRepo.update(requestId, {
                status: AccessGrantStatus.APPROVED,
                grantedAt: new Date(),
                expiresAt,
                patientIpAddress: req.ip || req.socket.remoteAddress,
                // Invalidate tokens after use (optional security measure)
                accessToken: null,
                rejectionToken: null
            });

            // Notify doctor
            try {
                await sendEmail({
                    to: accessRequest.requestingDoctor.email,
                    subject: `✅ Access Granted - ${accessRequest.patient.firstName} ${accessRequest.patient.lastName}`,
                    html: generateAccessGrantedEmail({
                        doctorName: `Dr. ${accessRequest.requestingDoctor.firstName}`,
                        patientName: `${accessRequest.patient.firstName} ${accessRequest.patient.lastName}`,
                        duration: PatientAccessGrant.getDurationLabel(accessRequest.requestedDuration),
                        expiresAt,
                        patientOrganization: accessRequest.patientOrganization?.name
                    })
                });
            } catch (e) {
                console.error('Failed to send approval notification email:', e);
            }

            return res.json({
                success: true,
                message: 'Access granted successfully',
                details: {
                    doctorName: `Dr. ${accessRequest.requestingDoctor.firstName} ${accessRequest.requestingDoctor.lastName}`,
                    hospital: accessRequest.doctorOrganization?.name,
                    duration: PatientAccessGrant.getDurationLabel(accessRequest.requestedDuration),
                    expiresAt,
                    accessibleFrom: new Date()
                }
            });
        } catch (error) {
            console.error('Approve access error:', error);
            return res.status(500).json({ message: 'Failed to approve access request' });
        }
    };

    /**
     * Reject access request
     */
    static rejectAccess = async (req: Request, res: Response) => {
        try {
            const { requestId, token } = req.params;

            const grantRepo = AppDataSource.getRepository(PatientAccessGrant);

            const accessRequest = await grantRepo.findOne({
                where: { id: requestId, rejectionToken: token, status: AccessGrantStatus.PENDING },
                relations: ['requestingDoctor', 'patient']
            });

            if (!accessRequest) {
                return res.status(404).json({
                    message: 'Access request not found or already processed',
                    code: 'REQUEST_NOT_FOUND'
                });
            }

            await grantRepo.update(requestId, {
                status: AccessGrantStatus.REJECTED,
                accessToken: null,
                rejectionToken: null
            });

            // Notify doctor (optional)
            try {
                await sendEmail({
                    to: accessRequest.requestingDoctor.email,
                    subject: `❌ Access Request Declined - ${accessRequest.patient.firstName} ${accessRequest.patient.lastName}`,
                    html: `
            <p>Dear Dr. ${accessRequest.requestingDoctor.firstName},</p>
            <p>Your request to access medical records for <strong>${accessRequest.patient.firstName} ${accessRequest.patient.lastName}</strong> has been declined by the patient.</p>
            <p>If you believe this is urgent or a misunderstanding, please contact the patient through official channels.</p>
          `
                });
            } catch (e) {
                console.error('Failed to send rejection notification:', e);
            }

            return res.json({
                success: true,
                message: 'Access request rejected'
            });
        } catch (error) {
            console.error('Reject access error:', error);
            return res.status(500).json({ message: 'Failed to reject access request' });
        }
    };

    /**
     * Revoke an active access grant
     */
    static revokeAccess = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { requestId } = req.params;

            const grantRepo = AppDataSource.getRepository(PatientAccessGrant);

            const accessRequest = await grantRepo.findOne({
                where: { id: requestId, patientId: user.id, status: AccessGrantStatus.APPROVED },
                relations: ['requestingDoctor']
            });

            if (!accessRequest) {
                return res.status(404).json({ message: 'Active access grant not found' });
            }

            await grantRepo.update(requestId, {
                status: AccessGrantStatus.REVOKED,
                revokedAt: new Date()
            });

            // Notify doctor
            try {
                await sendEmail({
                    to: accessRequest.requestingDoctor.email,
                    subject: `🔒 Access Revoked`,
                    html: `
            <p>Dear Dr. ${accessRequest.requestingDoctor.firstName},</p>
            <p>The patient has revoked your access to their medical records.</p>
            <p>You will no longer be able to view their records from other locations.</p>
          `
                });
            } catch (e) {
                console.error('Failed to send revocation notification:', e);
            }

            return res.json({
                success: true,
                message: 'Access revoked successfully'
            });
        } catch (error) {
            console.error('Revoke access error:', error);
            return res.status(500).json({ message: 'Failed to revoke access' });
        }
    };

    /**
     * Get patient's access grants (who has access to their records)
     */
    static getPatientAccessGrants = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { includeExpired = 'false' } = req.query;

            const grantRepo = AppDataSource.getRepository(PatientAccessGrant);

            const whereConditions: any = { patientId: user.id };

            if (includeExpired !== 'true') {
                whereConditions.status = In([AccessGrantStatus.PENDING, AccessGrantStatus.APPROVED]);
            }

            const grants = await grantRepo.find({
                where: whereConditions,
                relations: ['requestingDoctor', 'doctorOrganization'],
                order: { createdAt: 'DESC' }
            });

            // Filter out expired approved grants unless explicitly requested
            const filteredGrants = grants.filter(g => {
                if (g.status === AccessGrantStatus.APPROVED && g.expiresAt) {
                    return includeExpired === 'true' || new Date() < g.expiresAt;
                }
                return true;
            });

            const formattedGrants = filteredGrants.map(g => ({
                id: g.id,
                status: g.status,
                doctor: {
                    id: g.requestingDoctor?.id,
                    name: `Dr. ${g.requestingDoctor?.firstName} ${g.requestingDoctor?.lastName}`,
                    email: maskEmail(g.requestingDoctor?.email),
                    organization: g.doctorOrganization?.name
                },
                reason: g.reason,
                urgencyLevel: g.urgencyLevel,
                requestedDuration: PatientAccessGrant.getDurationLabel(g.requestedDuration),
                requestedAt: g.createdAt,
                grantedAt: g.grantedAt,
                expiresAt: g.expiresAt,
                isActive: g.isActive(),
                remainingTime: g.isActive() ? formatDuration(g.getRemainingTimeMs()) : null,
                accessCount: g.accessCount,
                lastAccessedAt: g.lastAccessedAt,
                canRevoke: g.status === AccessGrantStatus.APPROVED && g.isActive()
            }));

            return res.json({
                data: formattedGrants,
                summary: {
                    pending: formattedGrants.filter(g => g.status === AccessGrantStatus.PENDING).length,
                    active: formattedGrants.filter(g => g.isActive).length,
                    total: formattedGrants.length
                }
            });
        } catch (error) {
            console.error('Get patient access grants error:', error);
            return res.status(500).json({ message: 'Failed to fetch access grants' });
        }
    };

    // ============================================================
    // INTERNAL HELPER: Check if doctor has active cross-org access
    // ============================================================

    /**
     * Check if a doctor has active cross-org access to a patient
     * Used by access middleware
     */
    static async hasActiveAccess(doctorId: string, patientId: string): Promise<PatientAccessGrant | null> {
        const grantRepo = AppDataSource.getRepository(PatientAccessGrant);

        const activeGrant = await grantRepo.findOne({
            where: {
                requestingDoctorId: doctorId,
                patientId: patientId,
                status: AccessGrantStatus.APPROVED,
                expiresAt: MoreThan(new Date())
            },
            relations: ['patientOrganization']
        });

        if (activeGrant) {
            // Increment access count and update last accessed
            await grantRepo.update(activeGrant.id, {
                accessCount: activeGrant.accessCount + 1,
                lastAccessedAt: new Date()
            });
            return activeGrant;
        }

        return null;
    }

    /**
     * Expire old grants (cron job helper)
     */
    static async expireOldGrants(): Promise<number> {
        const grantRepo = AppDataSource.getRepository(PatientAccessGrant);

        const result = await grantRepo.update(
            {
                status: AccessGrantStatus.APPROVED,
                expiresAt: LessThan(new Date())
            },
            {
                status: AccessGrantStatus.EXPIRED
            }
        );

        return result.affected || 0;
    }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function maskEmail(email: string): string {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const maskedLocal = local.length > 3
        ? local.slice(0, 2) + '***' + local.slice(-1)
        : local[0] + '***';
    return `${maskedLocal}@${domain}`;
}

function maskPhone(phone: string): string {
    if (!phone || phone.length < 6) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(-3);
}

function formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
        return `${days}d ${remainingHours}h remaining`;
    }
    if (hours > 0) {
        return `${hours}h remaining`;
    }
    const minutes = Math.floor(ms / (1000 * 60));
    return `${minutes}m remaining`;
}

function generateAccessRequestEmail(params: {
    patientName: string;
    doctorName: string;
    doctorOrganization: string;
    patientOrganization: string;
    reason: string;
    duration: string;
    urgencyLevel: string;
    approveUrl: string;
    rejectUrl: string;
}): string {
    const urgencyBadge = params.urgencyLevel === 'emergency'
        ? '<span style="background: #dc2626; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold;">🚨 EMERGENCY</span>'
        : params.urgencyLevel === 'urgent'
            ? '<span style="background: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold;">⚡ URGENT</span>'
            : '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 16px 16px 0 0; text-align: center; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px; }
        .card { background: white; border-radius: 12px; padding: 20px; margin: 16px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .button { display: inline-block; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 8px; }
        .btn-approve { background: #10b981; color: white; }
        .btn-reject { background: #ef4444; color: white; }
        .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .info-label { font-weight: 600; color: #6b7280; width: 120px; }
        .info-value { flex: 1; }
        .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🔐 Medical Record Access Request</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${urgencyBadge}</p>
        </div>
        <div class="content">
          <p>Dear <strong>${params.patientName}</strong>,</p>
          <p>A doctor from another hospital is requesting temporary access to your medical records.</p>
          
          <div class="card">
            <div class="info-row">
              <span class="info-label">Doctor</span>
              <span class="info-value"><strong>${params.doctorName}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Hospital</span>
              <span class="info-value">${params.doctorOrganization}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Your Hospital</span>
              <span class="info-value">${params.patientOrganization}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Access Duration</span>
              <span class="info-value"><strong>${params.duration}</strong></span>
            </div>
          </div>

          <div class="card">
            <h3 style="margin-top: 0; color: #374151;">📝 Reason for Access</h3>
            <p style="margin-bottom: 0; color: #6b7280;">${params.reason}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${params.approveUrl}" class="button btn-approve">✅ Approve Access</a>
            <a href="${params.rejectUrl}" class="button btn-reject">❌ Deny Access</a>
          </div>

          <div class="card" style="background: #fefce8; border-left: 4px solid #eab308;">
            <p style="margin: 0; color: #854d0e;">
              <strong>⚠️ Important:</strong> Only approve if you recognize this doctor or hospital. 
              Your medical records contain sensitive information.
            </p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated message from your healthcare system.</p>
          <p>If you did not expect this request, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateAccessGrantedEmail(params: {
    doctorName: string;
    patientName: string;
    duration: string;
    expiresAt: Date;
    patientOrganization?: string;
}): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 16px 16px 0 0; text-align: center; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px; }
        .card { background: white; border-radius: 12px; padding: 20px; margin: 16px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">✅ Access Granted</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${params.doctorName}</strong>,</p>
          <p>Great news! <strong>${params.patientName}</strong> has approved your request to access their medical records.</p>
          
          <div class="card">
            <h3 style="margin-top: 0;">📋 Access Details</h3>
            <p><strong>Patient:</strong> ${params.patientName}</p>
            <p><strong>Hospital:</strong> ${params.patientOrganization || 'Patient\'s Hospital'}</p>
            <p><strong>Duration:</strong> ${params.duration}</p>
            <p><strong>Access Expires:</strong> ${params.expiresAt.toLocaleString()}</p>
          </div>

          <p>You can now view this patient's medical history in your dashboard under "Cross-Location Patients".</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
