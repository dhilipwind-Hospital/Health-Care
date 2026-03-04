import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';
import { Admission } from './inpatient/Admission';

export enum VisitorStatus {
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  DENIED = 'denied',
  SCHEDULED = 'scheduled'
}

@Entity('inpatient_visitors')
export class InpatientVisitor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'pass_number', length: 30 })
  passNumber!: string;

  @Column({ name: 'visitor_name', length: 100 })
  visitorName!: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 50, nullable: true })
  relationship?: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'admission_id', nullable: true })
  admissionId?: string;

  @ManyToOne(() => Admission, { nullable: true })
  @JoinColumn({ name: 'admission_id' })
  admission?: Admission;

  @Column({ length: 200, nullable: true })
  purpose?: string;

  @Column({ name: 'visit_date', type: 'date' })
  visitDate!: Date;

  @Column({ name: 'check_in_time', type: 'timestamp', nullable: true })
  checkInTime?: Date;

  @Column({ name: 'check_out_time', type: 'timestamp', nullable: true })
  checkOutTime?: Date;

  @Column({ type: 'enum', enum: VisitorStatus, default: VisitorStatus.SCHEDULED })
  status!: VisitorStatus;

  @Column({ name: 'id_type', length: 30, nullable: true })
  idType?: string;

  @Column({ name: 'id_number', length: 50, nullable: true })
  idNumber?: string;

  @Column({ type: 'jsonb', nullable: true })
  items?: Record<string, any>;

  @Column({ name: 'approved_by_id', nullable: true })
  approvedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy?: User;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
