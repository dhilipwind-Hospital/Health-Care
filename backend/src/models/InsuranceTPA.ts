import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';

export enum ClaimStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  QUERY_RAISED = 'query_raised',
  APPROVED = 'approved',
  PARTIALLY_APPROVED = 'partially_approved',
  REJECTED = 'rejected',
  SETTLED = 'settled'
}

export enum ClaimType {
  CASHLESS = 'cashless',
  REIMBURSEMENT = 'reimbursement'
}

@Entity('insurance_companies')
export class InsuranceCompany {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ length: 200 })
  name!: string;

  @Column({ name: 'short_code', length: 20, nullable: true })
  shortCode?: string;

  @Column({ name: 'contact_person', length: 100, nullable: true })
  contactPerson?: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 100, nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ name: 'tpa_name', length: 200, nullable: true })
  tpaName?: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('insurance_claims')
export class InsuranceClaim {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'claim_number', unique: true, length: 50 })
  claimNumber!: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'admission_id', nullable: true })
  admissionId?: string;

  @Column({ name: 'insurance_company_id' })
  insuranceCompanyId!: string;

  @ManyToOne(() => InsuranceCompany)
  @JoinColumn({ name: 'insurance_company_id' })
  insuranceCompany!: InsuranceCompany;

  @Column({ name: 'policy_number', length: 50 })
  policyNumber!: string;

  @Column({ name: 'member_id', length: 50, nullable: true })
  memberId?: string;

  @Column({ type: 'enum', enum: ClaimType })
  claimType!: ClaimType;

  @Column({ type: 'enum', enum: ClaimStatus, default: ClaimStatus.DRAFT })
  status!: ClaimStatus;

  @Column({ name: 'claimed_amount', type: 'decimal', precision: 12, scale: 2 })
  claimedAmount!: number;

  @Column({ name: 'approved_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  approvedAmount?: number;

  @Column({ name: 'settled_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  settledAmount?: number;

  @Column({ name: 'patient_responsibility', type: 'decimal', precision: 12, scale: 2, nullable: true })
  patientResponsibility?: number;

  @Column({ name: 'pre_auth_number', length: 50, nullable: true })
  preAuthNumber?: string;

  @Column({ name: 'pre_auth_date', type: 'date', nullable: true })
  preAuthDate?: Date;

  @Column({ name: 'pre_auth_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  preAuthAmount?: number;

  @Column({ name: 'submission_date', type: 'date', nullable: true })
  submissionDate?: Date;

  @Column({ name: 'approval_date', type: 'date', nullable: true })
  approvalDate?: Date;

  @Column({ name: 'settlement_date', type: 'date', nullable: true })
  settlementDate?: Date;

  @Column({ type: 'text', nullable: true })
  diagnosis?: string;

  @Column({ type: 'text', nullable: true })
  treatment?: string;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Column({ name: 'query_details', type: 'text', nullable: true })
  queryDetails?: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ name: 'created_by_id' })
  createdById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
