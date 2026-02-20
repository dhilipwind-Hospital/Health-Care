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
import { User } from '../User';

export enum CrossMatchStatus {
  REQUESTED = 'requested',
  SAMPLE_RECEIVED = 'sample_received',
  TESTING = 'testing',
  COMPATIBLE = 'compatible',
  INCOMPATIBLE = 'incompatible',
  ISSUED = 'issued',
  CANCELLED = 'cancelled',
}

export enum CrossMatchPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  EMERGENCY = 'emergency',
}

@Entity('cross_match_requests')
export class CrossMatchRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({ unique: true })
  requestNumber!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requested_by' })
  requestedByDoctor!: User;

  @Column({ name: 'requested_by', type: 'uuid' })
  requestedBy!: string;

  @Column({ type: 'varchar', length: 5 })
  patientBloodGroup!: string;

  @Column({ type: 'varchar', length: 30 })
  componentRequired!: string;

  @Column({ type: 'int' })
  unitsRequired!: number;

  @Column({ type: 'enum', enum: CrossMatchPriority, default: CrossMatchPriority.ROUTINE })
  priority!: CrossMatchPriority;

  @Column({ type: 'text', nullable: true })
  indication?: string;

  @Column({ name: 'surgery_id', type: 'uuid', nullable: true })
  surgeryId?: string;

  @Column({ name: 'admission_id', type: 'uuid', nullable: true })
  admissionId?: string;

  @Column({ type: 'enum', enum: CrossMatchStatus, default: CrossMatchStatus.REQUESTED })
  status!: CrossMatchStatus;

  @Column({ type: 'timestamp', nullable: true })
  sampleCollectedAt?: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'tested_by' })
  testedByUser?: User;

  @Column({ name: 'tested_by', type: 'uuid', nullable: true })
  testedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  testedAt?: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  result?: string;

  @Column({ type: 'simple-array', nullable: true })
  compatibleBagIds?: string[];

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
