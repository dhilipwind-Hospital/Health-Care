import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../Organization';
import { Location } from '../Location';
import { User } from '../User';
import { OtRoom } from './OtRoom';

export enum SurgeryType {
  ELECTIVE = 'elective',
  EMERGENCY = 'emergency',
  DAY_CARE = 'day_care',
}

export enum SurgeryPriority {
  EMERGENCY = 'emergency',
  URGENT = 'urgent',
  ELECTIVE = 'elective',
}

export enum SurgeryStatus {
  SCHEDULED = 'scheduled',
  PRE_OP = 'pre_op',
  IN_PROGRESS = 'in_progress',
  POST_OP = 'post_op',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
}

export enum AnesthesiaType {
  GENERAL = 'general',
  SPINAL = 'spinal',
  EPIDURAL = 'epidural',
  LOCAL = 'local',
  REGIONAL = 'regional',
  SEDATION = 'sedation',
  COMBINED = 'combined',
}

@Entity('surgeries')
export class Surgery {
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

  @ManyToOne(() => OtRoom)
  @JoinColumn({ name: 'ot_room_id' })
  otRoom!: OtRoom;

  @Column({ name: 'ot_room_id', type: 'uuid' })
  otRoomId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'primary_surgeon_id' })
  primarySurgeon!: User;

  @Column({ name: 'primary_surgeon_id', type: 'uuid' })
  primarySurgeonId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'anesthetist_id' })
  anesthetist?: User;

  @Column({ name: 'anesthetist_id', type: 'uuid', nullable: true })
  anesthetistId?: string;

  @Column({ name: 'admission_id', type: 'uuid', nullable: true })
  admissionId?: string;

  @Column({ unique: true })
  surgeryNumber!: string;

  @Column()
  procedureName!: string;

  @Column({ type: 'varchar', nullable: true })
  procedureCode?: string;

  @Column({ type: 'enum', enum: SurgeryType, default: SurgeryType.ELECTIVE })
  surgeryType!: SurgeryType;

  @Column({ type: 'enum', enum: SurgeryPriority, default: SurgeryPriority.ELECTIVE })
  priority!: SurgeryPriority;

  @Column({ type: 'date' })
  scheduledDate!: Date;

  @Column({ type: 'time' })
  scheduledStartTime!: string;

  @Column({ type: 'time' })
  scheduledEndTime!: string;

  @Column({ type: 'timestamp', nullable: true })
  actualStartTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualEndTime?: Date;

  @Column({ type: 'enum', enum: SurgeryStatus, default: SurgeryStatus.SCHEDULED })
  status!: SurgeryStatus;

  @Column({ type: 'text', nullable: true })
  preOpDiagnosis?: string;

  @Column({ type: 'text', nullable: true })
  postOpDiagnosis?: string;

  @Column({ type: 'text', nullable: true })
  operativeFindings?: string;

  @Column({ type: 'text', nullable: true })
  operativeNotes?: string;

  @Column({ type: 'text', nullable: true })
  complications?: string;

  @Column({ type: 'int', nullable: true })
  bloodLossML?: number;

  @Column({ type: 'enum', enum: AnesthesiaType, nullable: true })
  anesthesiaType?: AnesthesiaType;

  @Column({ type: 'int', nullable: true })
  estimatedDuration?: number;

  @Column({ type: 'int', nullable: true })
  actualDuration?: number;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @Column({ name: 'cancelled_by', type: 'uuid', nullable: true })
  cancelledBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'boolean', default: false })
  consentObtained!: boolean;

  @Column({ type: 'text', nullable: true })
  consentDocumentUrl?: string;

  @Column({ type: 'varchar', length: 20, default: 'not_billed' })
  billingStatus!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
