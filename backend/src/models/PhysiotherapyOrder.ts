import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';

export enum PhysiotherapyStatus {
  ORDERED = 'ordered',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  MISSED = 'missed',
  CANCELLED = 'cancelled'
}

@Entity('physiotherapy_orders')
export class PhysiotherapyOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'order_number', unique: true, length: 30 })
  orderNumber!: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'doctor_id' })
  doctorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User;

  @Column({ name: 'therapist_id', nullable: true })
  therapistId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'therapist_id' })
  therapist?: User;

  @Column({ length: 200 })
  diagnosis!: string;

  @Column({ name: 'treatment_type', length: 100 })
  treatmentType!: string;

  @Column({ name: 'body_part', length: 100, nullable: true })
  bodyPart?: string;

  @Column({ name: 'total_sessions', type: 'int', default: 1 })
  totalSessions!: number;

  @Column({ name: 'completed_sessions', type: 'int', default: 0 })
  completedSessions!: number;

  @Column({ name: 'session_duration_minutes', type: 'int', default: 30 })
  sessionDurationMinutes!: number;

  @Column({ name: 'frequency', length: 50, nullable: true })
  frequency?: string;

  @Column({ type: 'enum', enum: PhysiotherapyStatus, default: PhysiotherapyStatus.ORDERED })
  status!: PhysiotherapyStatus;

  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @Column({ type: 'text', nullable: true })
  goals?: string;

  @Column({ type: 'text', nullable: true })
  precautions?: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('physiotherapy_sessions')
export class PhysiotherapySession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'order_id' })
  orderId!: string;

  @ManyToOne(() => PhysiotherapyOrder)
  @JoinColumn({ name: 'order_id' })
  order!: PhysiotherapyOrder;

  @Column({ name: 'session_number', type: 'int' })
  sessionNumber!: number;

  @Column({ name: 'scheduled_date', type: 'date' })
  scheduledDate!: Date;

  @Column({ name: 'scheduled_time', type: 'time', nullable: true })
  scheduledTime?: string;

  @Column({ name: 'actual_date', type: 'date', nullable: true })
  actualDate?: Date;

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.SCHEDULED })
  status!: SessionStatus;

  @Column({ name: 'therapist_id', nullable: true })
  therapistId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'therapist_id' })
  therapist?: User;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'exercises_performed', type: 'jsonb', nullable: true })
  exercisesPerformed?: any;

  @Column({ name: 'pain_level_before', type: 'int', nullable: true })
  painLevelBefore?: number;

  @Column({ name: 'pain_level_after', type: 'int', nullable: true })
  painLevelAfter?: number;

  @Column({ type: 'text', nullable: true })
  progress?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
