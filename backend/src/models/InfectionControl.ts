import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';

export enum InfectionType {
  SSI = 'ssi',
  CAUTI = 'cauti',
  CLABSI = 'clabsi',
  VAP = 'vap',
  CDI = 'cdi',
  MRSA = 'mrsa',
  OTHER = 'other'
}

export enum InfectionStatus {
  SUSPECTED = 'suspected',
  CONFIRMED = 'confirmed',
  RESOLVED = 'resolved',
  MONITORING = 'monitoring'
}

@Entity('infection_surveillance')
export class InfectionSurveillance {
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

  @Column({ type: 'enum', enum: InfectionType })
  infectionType!: InfectionType;

  @Column({ name: 'detection_date', type: 'date' })
  detectionDate!: Date;

  @Column({ type: 'enum', enum: InfectionStatus, default: InfectionStatus.SUSPECTED })
  status!: InfectionStatus;

  @Column({ length: 100, nullable: true })
  organism?: string;

  @Column({ length: 100, nullable: true })
  location?: string;

  @Column({ name: 'isolation_required', default: false })
  isolationRequired!: boolean;

  @Column({ name: 'isolation_type', length: 50, nullable: true })
  isolationType?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'reported_by_id' })
  reportedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_by_id' })
  reportedBy!: User;

  @Column({ name: 'resolution_date', type: 'date', nullable: true })
  resolutionDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('hand_hygiene_audits')
export class HandHygieneAudit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'audit_date', type: 'date' })
  auditDate!: Date;

  @Column({ length: 100 })
  department!: string;

  @Column({ name: 'opportunities_observed', type: 'int' })
  opportunitiesObserved!: number;

  @Column({ name: 'compliant_actions', type: 'int' })
  compliantActions!: number;

  @Column({ name: 'compliance_rate', type: 'decimal', precision: 5, scale: 2 })
  complianceRate!: number;

  @Column({ name: 'auditor_id' })
  auditorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'auditor_id' })
  auditor!: User;

  @Column({ type: 'text', nullable: true })
  observations?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
