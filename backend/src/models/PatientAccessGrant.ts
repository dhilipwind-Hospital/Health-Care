import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';

/**
 * Access duration options for cross-location patient record access
 */
export enum AccessDuration {
    HOURS_24 = '24_hours',      // Emergency consultation
    DAYS_3 = '3_days',          // Short-term follow-up
    WEEK_1 = '1_week',          // Extended care
    CUSTOM = 'custom'           // Custom duration (for admin override)
}

/**
 * Status of the access grant request
 */
export enum AccessGrantStatus {
    PENDING = 'pending',       // Waiting for patient approval
    APPROVED = 'approved',     // Patient approved, access active
    REJECTED = 'rejected',     // Patient rejected
    EXPIRED = 'expired',       // Time limit reached
    REVOKED = 'revoked'        // Patient manually revoked
}

/**
 * PatientAccessGrant - Cross-Location Patient Record Access
 * 
 * This entity manages temporary access grants for doctors to view
 * patient records from different locations/organizations.
 * 
 * Security Features:
 * - Time-limited access (24h, 3d, 1w)
 * - Patient must explicitly approve via secure link
 * - Access can be revoked at any time
 * - Full audit trail maintained
 * - Auto-expires based on duration
 */
@Entity('patient_access_grants')
@Index(['patientId', 'requestingDoctorId', 'status'])
@Index(['status', 'expiresAt'])
export class PatientAccessGrant {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // ===== PATIENT (Data Owner) =====
    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'patient_id' })
    patient!: User;

    @Column({ name: 'patient_id', type: 'uuid' })
    patientId!: string;

    @ManyToOne(() => Organization, { nullable: false })
    @JoinColumn({ name: 'patient_organization_id' })
    patientOrganization!: Organization;

    @Column({ name: 'patient_organization_id', type: 'uuid' })
    patientOrganizationId!: string;

    // ===== REQUESTING DOCTOR =====
    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'requesting_doctor_id' })
    requestingDoctor!: User;

    @Column({ name: 'requesting_doctor_id', type: 'uuid' })
    requestingDoctorId!: string;

    @ManyToOne(() => Organization, { nullable: false })
    @JoinColumn({ name: 'doctor_organization_id' })
    doctorOrganization!: Organization;

    @Column({ name: 'doctor_organization_id', type: 'uuid' })
    doctorOrganizationId!: string;

    // ===== ACCESS CONTROL =====
    @Column({
        type: 'enum',
        enum: AccessGrantStatus,
        default: AccessGrantStatus.PENDING
    })
    status!: AccessGrantStatus;

    @Column({
        type: 'enum',
        enum: AccessDuration,
        default: AccessDuration.HOURS_24
    })
    requestedDuration!: AccessDuration;

    @Column({ name: 'access_token', type: 'varchar', length: 255, nullable: true, unique: true })
    accessToken!: string | null;

    @Column({ name: 'rejection_token', type: 'varchar', length: 255, nullable: true })
    rejectionToken!: string | null;

    // ===== TIMING =====
    @Column({ name: 'granted_at', type: 'timestamp', nullable: true })
    grantedAt!: Date | null;

    @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
    expiresAt!: Date | null;

    @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
    revokedAt!: Date | null;

    // ===== REQUEST DETAILS =====
    @Column({ type: 'text', nullable: true })
    reason!: string | null;

    @Column({ name: 'urgency_level', type: 'varchar', length: 20, default: 'normal' })
    urgencyLevel!: 'emergency' | 'urgent' | 'normal';

    @Column({ name: 'requested_access_type', type: 'varchar', length: 50, default: 'full_history' })
    requestedAccessType!: 'full_history' | 'recent_only' | 'specific_records';

    // ===== AUDIT =====
    @Column({ name: 'access_count', type: 'int', default: 0 })
    accessCount!: number;

    @Column({ name: 'last_accessed_at', type: 'timestamp', nullable: true })
    lastAccessedAt!: Date | null;

    @Column({ name: 'patient_ip_address', type: 'varchar', length: 50, nullable: true })
    patientIpAddress!: string | null;

    @Column({ name: 'doctor_ip_address', type: 'varchar', length: 50, nullable: true })
    doctorIpAddress!: string | null;

    // ===== NOTIFICATIONS =====
    @Column({ name: 'email_sent_at', type: 'timestamp', nullable: true })
    emailSentAt!: Date | null;

    @Column({ name: 'reminder_sent_at', type: 'timestamp', nullable: true })
    reminderSentAt!: Date | null;

    @Column({ name: 'expiry_notification_sent', type: 'boolean', default: false })
    expiryNotificationSent!: boolean;

    // ===== TIMESTAMPS =====
    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // ===== HELPER METHODS =====

    /**
     * Check if the access grant is currently active
     */
    isActive(): boolean {
        return (
            this.status === AccessGrantStatus.APPROVED &&
            this.expiresAt !== null &&
            new Date() < this.expiresAt
        );
    }

    /**
     * Get remaining access time in milliseconds
     */
    getRemainingTimeMs(): number {
        if (!this.expiresAt || !this.isActive()) return 0;
        return Math.max(0, this.expiresAt.getTime() - Date.now());
    }

    /**
     * Get duration in milliseconds based on AccessDuration enum
     */
    static getDurationMs(duration: AccessDuration): number {
        switch (duration) {
            case AccessDuration.HOURS_24:
                return 24 * 60 * 60 * 1000; // 24 hours
            case AccessDuration.DAYS_3:
                return 3 * 24 * 60 * 60 * 1000; // 3 days
            case AccessDuration.WEEK_1:
                return 7 * 24 * 60 * 60 * 1000; // 1 week
            default:
                return 24 * 60 * 60 * 1000; // Default: 24 hours
        }
    }

    /**
     * Get human-readable duration string
     */
    static getDurationLabel(duration: AccessDuration): string {
        switch (duration) {
            case AccessDuration.HOURS_24:
                return '24 Hours';
            case AccessDuration.DAYS_3:
                return '3 Days';
            case AccessDuration.WEEK_1:
                return '1 Week';
            default:
                return 'Custom';
        }
    }
}
