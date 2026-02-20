import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';

export enum IncidentType {
  PATIENT_FALL = 'patient_fall',
  MEDICATION_ERROR = 'medication_error',
  NEEDLE_STICK = 'needle_stick',
  EQUIPMENT_FAILURE = 'equipment_failure',
  ADVERSE_DRUG_REACTION = 'adverse_drug_reaction',
  SURGICAL_COMPLICATION = 'surgical_complication',
  HOSPITAL_ACQUIRED_INFECTION = 'hospital_acquired_infection',
  PATIENT_COMPLAINT = 'patient_complaint',
  SECURITY_INCIDENT = 'security_incident',
  FIRE_SAFETY = 'fire_safety',
  OTHER = 'other'
}

export enum IncidentSeverity {
  NEAR_MISS = 'near_miss',
  NO_HARM = 'no_harm',
  MINOR = 'minor',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  DEATH = 'death'
}

export enum IncidentStatus {
  REPORTED = 'reported',
  UNDER_INVESTIGATION = 'under_investigation',
  CAPA_INITIATED = 'capa_initiated',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

@Entity('incident_reports')
export class IncidentReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'incident_number', unique: true, length: 30 })
  incidentNumber!: string;

  @Column({ name: 'incident_date', type: 'timestamp' })
  incidentDate!: Date;

  @Column({
    type: 'enum',
    enum: IncidentType
  })
  type!: IncidentType;

  @Column({
    type: 'enum',
    enum: IncidentSeverity
  })
  severity!: IncidentSeverity;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.REPORTED
  })
  status!: IncidentStatus;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'location_area', length: 200, nullable: true })
  locationArea?: string;

  @Column({ name: 'patient_id', nullable: true })
  patientId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'patient_id' })
  patient?: User;

  @Column({ name: 'staff_involved', type: 'simple-array', nullable: true })
  staffInvolved?: string[];

  @Column({ name: 'witnesses', type: 'text', nullable: true })
  witnesses?: string;

  @Column({ name: 'immediate_action', type: 'text', nullable: true })
  immediateAction?: string;

  @Column({ name: 'root_cause', type: 'text', nullable: true })
  rootCause?: string;

  @Column({ name: 'corrective_action', type: 'text', nullable: true })
  correctiveAction?: string;

  @Column({ name: 'preventive_action', type: 'text', nullable: true })
  preventiveAction?: string;

  @Column({ name: 'capa_due_date', type: 'date', nullable: true })
  capaDueDate?: Date;

  @Column({ name: 'capa_completed_date', type: 'date', nullable: true })
  capaCompletedDate?: Date;

  @Column({ name: 'reported_by_id' })
  reportedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_by_id' })
  reportedBy!: User;

  @Column({ name: 'investigated_by_id', nullable: true })
  investigatedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'investigated_by_id' })
  investigatedBy?: User;

  @Column({ name: 'investigation_notes', type: 'text', nullable: true })
  investigationNotes?: string;

  @Column({ name: 'is_reportable_to_authority', default: false })
  isReportableToAuthority!: boolean;

  @Column({ name: 'authority_reported_date', type: 'date', nullable: true })
  authorityReportedDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
