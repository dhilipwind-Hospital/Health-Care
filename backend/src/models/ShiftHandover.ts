import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';
import { Ward } from './inpatient/Ward';
import { Department } from './Department';

export enum HandoverStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  ACKNOWLEDGED = 'acknowledged'
}

@Entity('shift_handovers')
export class ShiftHandover {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'from_staff_id' })
  fromStaffId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'from_staff_id' })
  fromStaff!: User;

  @Column({ name: 'to_staff_id', nullable: true })
  toStaffId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'to_staff_id' })
  toStaff?: User;

  @Column({ name: 'shift_date', type: 'date' })
  shiftDate!: Date;

  @Column({ name: 'shift_type', length: 30 })
  shiftType!: string;

  @Column({ name: 'ward_id', nullable: true })
  wardId?: string;

  @ManyToOne(() => Ward, { nullable: true })
  @JoinColumn({ name: 'ward_id' })
  ward?: Ward;

  @Column({ name: 'department_id', nullable: true })
  departmentId?: string;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @Column({ name: 'patient_updates', type: 'jsonb', nullable: true })
  patientUpdates?: Record<string, any>[];

  @Column({ name: 'pending_tasks', type: 'jsonb', nullable: true })
  pendingTasks?: Record<string, any>[];

  @Column({ name: 'critical_alerts', type: 'jsonb', nullable: true })
  criticalAlerts?: Record<string, any>[];

  @Column({ name: 'medication_alerts', type: 'text', nullable: true })
  medicationAlerts?: string;

  @Column({ name: 'equipment_issues', type: 'text', nullable: true })
  equipmentIssues?: string;

  @Column({ name: 'general_notes', type: 'text', nullable: true })
  generalNotes?: string;

  @Column({ type: 'enum', enum: HandoverStatus, default: HandoverStatus.DRAFT })
  status!: HandoverStatus;

  @Column({ name: 'acknowledged_at', type: 'timestamp', nullable: true })
  acknowledgedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
