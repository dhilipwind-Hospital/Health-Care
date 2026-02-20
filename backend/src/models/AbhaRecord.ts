import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';

export enum AbhaStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  LINKED = 'linked',
  FAILED = 'failed'
}

@Entity('abha_records')
export class AbhaRecord {
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

  @Column({ name: 'abha_number', length: 20, nullable: true })
  abhaNumber?: string;

  @Column({ name: 'abha_address', length: 100, nullable: true })
  abhaAddress?: string;

  @Column({ name: 'health_id', length: 100, nullable: true })
  healthId?: string;

  @Column({ name: 'aadhaar_last_four', length: 4, nullable: true })
  aadhaarLastFour?: string;

  @Column({ name: 'mobile_number', length: 15, nullable: true })
  mobileNumber?: string;

  @Column({ type: 'enum', enum: AbhaStatus, default: AbhaStatus.PENDING })
  status!: AbhaStatus;

  @Column({ name: 'verification_method', length: 20, nullable: true })
  verificationMethod?: string;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @Column({ name: 'linked_at', type: 'timestamp', nullable: true })
  linkedAt?: Date;

  @Column({ name: 'consent_given', default: false })
  consentGiven!: boolean;

  @Column({ name: 'consent_timestamp', type: 'timestamp', nullable: true })
  consentTimestamp?: Date;

  @Column({ type: 'text', nullable: true })
  consentText?: string;

  @Column({ name: 'phr_address', length: 100, nullable: true })
  phrAddress?: string;

  @Column({ type: 'jsonb', nullable: true })
  profileData?: any;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
