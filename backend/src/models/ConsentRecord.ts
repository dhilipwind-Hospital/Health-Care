import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';

export enum ConsentType {
  DATA_PROCESSING = 'data_processing',
  TREATMENT = 'treatment',
  TELEMEDICINE = 'telemedicine',
  DATA_SHARING = 'data_sharing',
  RESEARCH = 'research',
  MARKETING = 'marketing',
  EMERGENCY_CONTACT = 'emergency_contact',
  PHOTO_VIDEO = 'photo_video',
  ABDM_HEALTH_RECORDS = 'abdm_health_records'
}

export enum ConsentStatus {
  GRANTED = 'granted',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired',
  PENDING = 'pending'
}

@Entity('consent_records')
export class ConsentRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({
    name: 'consent_type',
    type: 'enum',
    enum: ConsentType
  })
  consentType!: ConsentType;

  @Column({ type: 'text' })
  purpose!: string;

  @Column({ name: 'consent_text', type: 'text' })
  consentText!: string;

  @Column({
    type: 'enum',
    enum: ConsentStatus,
    default: ConsentStatus.GRANTED
  })
  status: ConsentStatus = ConsentStatus.GRANTED;

  @Column({ name: 'is_granted', default: true })
  isGranted: boolean = true;

  @Column({ name: 'granted_at', type: 'timestamp', nullable: true })
  grantedAt?: Date;

  @Column({ name: 'granted_by_id', nullable: true })
  grantedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'granted_by_id' })
  grantedBy?: User;

  @Column({ name: 'withdrawn_at', type: 'timestamp', nullable: true })
  withdrawnAt?: Date;

  @Column({ name: 'withdrawn_by_id', nullable: true })
  withdrawnById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'withdrawn_by_id' })
  withdrawnBy?: User;

  @Column({ name: 'withdrawal_reason', type: 'text', nullable: true })
  withdrawalReason?: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'signature_data', type: 'text', nullable: true })
  signatureData?: string;

  @Column({ name: 'ip_address', nullable: true, length: 45 })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'witness_name', nullable: true, length: 100 })
  witnessName?: string;

  @Column({ name: 'witness_signature', type: 'text', nullable: true })
  witnessSignature?: string;

  @Column({ name: 'related_entity_type', nullable: true, length: 50 })
  relatedEntityType?: string;

  @Column({ name: 'related_entity_id', nullable: true })
  relatedEntityId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true, length: 10 })
  version?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
