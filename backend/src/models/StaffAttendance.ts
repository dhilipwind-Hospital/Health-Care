import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  HALF_DAY = 'half_day',
  LEAVE = 'leave'
}

@Entity('staff_attendance')
export class StaffAttendance {
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

  @Column({ type: 'date' })
  date!: Date;

  @Column({ name: 'clock_in_time', type: 'timestamp', nullable: true })
  clockInTime?: Date;

  @Column({ name: 'clock_out_time', type: 'timestamp', nullable: true })
  clockOutTime?: Date;

  @Column({ name: 'hours_worked', type: 'decimal', precision: 5, scale: 2, nullable: true })
  hoursWorked?: number;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  status!: AttendanceStatus;

  @Column({ type: 'int', default: 0 })
  overtime!: number;

  @Column({ name: 'shift_id', nullable: true })
  shiftId?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'marked_by_id', nullable: true })
  markedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'marked_by_id' })
  markedBy?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
