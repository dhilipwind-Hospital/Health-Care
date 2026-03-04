import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';
import { Ward } from './inpatient/Ward';
import { Bed } from './inpatient/Bed';

export enum HousekeepingTaskType {
  CLEANING = 'cleaning',
  SANITIZATION = 'sanitization',
  LINEN_CHANGE = 'linen_change',
  WASTE_DISPOSAL = 'waste_disposal',
  DEEP_CLEAN = 'deep_clean',
  MAINTENANCE = 'maintenance'
}

export enum HousekeepingPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  EMERGENCY = 'emergency'
}

export enum HousekeepingStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  VERIFIED = 'verified'
}

@Entity('housekeeping_tasks')
export class HousekeepingTask {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'task_number', length: 30 })
  taskNumber!: string;

  @Column({ name: 'ward_id', nullable: true })
  wardId?: string;

  @ManyToOne(() => Ward, { nullable: true })
  @JoinColumn({ name: 'ward_id' })
  ward?: Ward;

  @Column({ name: 'room_id', nullable: true })
  roomId?: string;

  @Column({ name: 'bed_id', nullable: true })
  bedId?: string;

  @ManyToOne(() => Bed, { nullable: true })
  @JoinColumn({ name: 'bed_id' })
  bed?: Bed;

  @Column({ name: 'location_name', length: 100, nullable: true })
  locationName?: string;

  @Column({ name: 'task_type', type: 'enum', enum: HousekeepingTaskType })
  taskType!: HousekeepingTaskType;

  @Column({ type: 'enum', enum: HousekeepingPriority, default: HousekeepingPriority.ROUTINE })
  priority!: HousekeepingPriority;

  @Column({ type: 'enum', enum: HousekeepingStatus, default: HousekeepingStatus.PENDING })
  status!: HousekeepingStatus;

  @Column({ name: 'assigned_to_id', nullable: true })
  assignedToId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo?: User;

  @Column({ name: 'assigned_by_id', nullable: true })
  assignedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_by_id' })
  assignedBy?: User;

  @Column({ name: 'scheduled_time', type: 'timestamp', nullable: true })
  scheduledTime?: Date;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @Column({ name: 'verified_by_id', nullable: true })
  verifiedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by_id' })
  verifiedBy?: User;

  @Column({ name: 'turnaround_minutes', type: 'int', nullable: true })
  turnaroundMinutes?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
