import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';
import { Department } from './Department';

export enum ShiftType {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  NIGHT = 'night',
  GENERAL = 'general',
  ON_CALL = 'on_call'
}

export enum DutyStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  ABSENT = 'absent',
  LEAVE = 'leave',
  SWAPPED = 'swapped'
}

@Entity('duty_rosters')
export class DutyRoster {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'staff_id' })
  staffId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'staff_id' })
  staff!: User;

  @Column({ name: 'department_id', nullable: true })
  departmentId?: string;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @Column({ name: 'duty_date', type: 'date' })
  dutyDate!: Date;

  @Column({ type: 'enum', enum: ShiftType })
  shiftType!: ShiftType;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @Column({ type: 'enum', enum: DutyStatus, default: DutyStatus.SCHEDULED })
  status!: DutyStatus;

  @Column({ length: 100, nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'created_by_id', nullable: true })
  createdById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('leave_requests')
export class LeaveRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'staff_id' })
  staffId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'staff_id' })
  staff!: User;

  @Column({ name: 'leave_type', length: 50 })
  leaveType!: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: Date;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ length: 20, default: 'pending' })
  status!: string;

  @Column({ name: 'approved_by_id', nullable: true })
  approvedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy?: User;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
