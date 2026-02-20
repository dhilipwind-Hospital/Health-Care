import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../Organization';
import { Location } from '../Location';
import { User } from '../User';
import { DialysisMachine } from './DialysisMachine';

export enum DialysisSessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  MISSED = 'missed',
}

export enum DialysisSessionType {
  HEMODIALYSIS = 'hemodialysis',
  PERITONEAL = 'peritoneal',
  CRRT = 'crrt',
  HEMODIAFILTRATION = 'hemodiafiltration',
}

export enum AccessType {
  AVF = 'avf',
  AVG = 'avg',
  CATHETER_TUNNELED = 'catheter_tunneled',
  CATHETER_TEMPORARY = 'catheter_temporary',
}

@Entity('dialysis_sessions')
export class DialysisSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'location_id' })
  location?: Location;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId?: string;

  @Column({ unique: true })
  sessionNumber!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'nurse_id' })
  nurse?: User;

  @Column({ name: 'nurse_id', type: 'uuid', nullable: true })
  nurseId?: string;

  @ManyToOne(() => DialysisMachine)
  @JoinColumn({ name: 'machine_id' })
  machine!: DialysisMachine;

  @Column({ name: 'machine_id', type: 'uuid' })
  machineId!: string;

  @Column({ name: 'admission_id', type: 'uuid', nullable: true })
  admissionId?: string;

  // Schedule
  @Column({ type: 'date' })
  scheduledDate!: Date;

  @Column({ type: 'time' })
  scheduledTime!: string;

  @Column({ type: 'enum', enum: DialysisSessionType, default: DialysisSessionType.HEMODIALYSIS })
  sessionType!: DialysisSessionType;

  @Column({ type: 'varchar', nullable: true })
  frequency?: string;

  // Session Details
  @Column({ type: 'timestamp', nullable: true })
  actualStartTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualEndTime?: Date;

  @Column({ type: 'int', nullable: true })
  durationMinutes?: number;

  @Column({ type: 'enum', enum: DialysisSessionStatus, default: DialysisSessionStatus.SCHEDULED })
  status!: DialysisSessionStatus;

  // Dialysis Parameters
  @Column({ type: 'varchar', nullable: true })
  dialyzerType?: string;

  @Column({ type: 'int', default: 1 })
  dialyzerReuse!: number;

  @Column({ type: 'int', nullable: true })
  bloodFlowRate?: number;

  @Column({ type: 'int', nullable: true })
  dialysateFlowRate?: number;

  @Column({ type: 'int', nullable: true })
  targetUF?: number;

  @Column({ type: 'int', nullable: true })
  actualUF?: number;

  @Column({ type: 'enum', enum: AccessType, nullable: true })
  accessType?: AccessType;

  @Column({ type: 'varchar', nullable: true })
  accessSite?: string;

  @Column({ type: 'varchar', nullable: true })
  heparinDose?: string;

  // Pre-Dialysis Vitals
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  preWeight?: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  preBP?: string;

  @Column({ type: 'int', nullable: true })
  preHR?: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  preTemp?: number;

  // Post-Dialysis Vitals
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  postWeight?: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postBP?: string;

  @Column({ type: 'int', nullable: true })
  postHR?: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  postTemp?: number;

  // Intra-Dialysis Monitoring
  @Column({ type: 'jsonb', nullable: true })
  hourlyReadings?: Array<{ time: string; bp: string; hr: number; uf: number; bloodFlow: number; notes: string }>;

  // Complications
  @Column({ type: 'simple-array', nullable: true })
  complications?: string[];

  @Column({ type: 'text', nullable: true })
  complicationNotes?: string;

  @Column({ type: 'text', nullable: true })
  interventions?: string;

  // Consumables
  @Column({ type: 'jsonb', nullable: true })
  consumablesUsed?: Array<{ item: string; quantity: number; batchNumber: string }>;

  // Lab (pre/post)
  @Column({ type: 'jsonb', nullable: true })
  preLabResults?: { bun?: number; creatinine?: number; potassium?: number; hemoglobin?: number };

  @Column({ type: 'jsonb', nullable: true })
  postLabResults?: { bun?: number; creatinine?: number; potassium?: number; hemoglobin?: number };

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  ktv?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  urr?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  cancelReason?: string;

  @Column({ type: 'varchar', length: 20, default: 'not_billed' })
  billingStatus!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
