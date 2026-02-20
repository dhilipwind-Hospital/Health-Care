import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../Organization';
import { Location } from '../Location';
import { User } from '../User';

export enum ModalityType {
  XRAY = 'xray',
  CT = 'ct',
  MRI = 'mri',
  ULTRASOUND = 'ultrasound',
  MAMMOGRAPHY = 'mammography',
  FLUOROSCOPY = 'fluoroscopy',
  DEXA = 'dexa',
  PET_CT = 'pet_ct',
  ANGIOGRAPHY = 'angiography',
  ECG = 'ecg',
  ECHO = 'echo',
}

export enum RadiologyPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  STAT = 'stat',
}

export enum RadiologyOrderStatus {
  ORDERED = 'ordered',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REPORTED = 'reported',
  VERIFIED = 'verified',
  CANCELLED = 'cancelled',
}

export enum Laterality {
  LEFT = 'left',
  RIGHT = 'right',
  BILATERAL = 'bilateral',
  NA = 'na',
}

@Entity('radiology_orders')
export class RadiologyOrder {
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
  orderNumber!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'referring_doctor_id' })
  referringDoctor!: User;

  @Column({ name: 'referring_doctor_id', type: 'uuid' })
  referringDoctorId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'radiologist_id' })
  radiologist?: User;

  @Column({ name: 'radiologist_id', type: 'uuid', nullable: true })
  radiologistId?: string;

  @Column({ name: 'admission_id', type: 'uuid', nullable: true })
  admissionId?: string;

  @Column({ type: 'enum', enum: ModalityType })
  modalityType!: ModalityType;

  @Column({ type: 'varchar' })
  bodyPart!: string;

  @Column({ type: 'enum', enum: Laterality, default: Laterality.NA })
  laterality!: Laterality;

  @Column({ type: 'varchar' })
  studyDescription!: string;

  @Column({ type: 'text', nullable: true })
  clinicalHistory?: string;

  @Column({ type: 'text', nullable: true })
  provisionalDiagnosis?: string;

  @Column({ type: 'enum', enum: RadiologyPriority, default: RadiologyPriority.ROUTINE })
  priority!: RadiologyPriority;

  @Column({ type: 'boolean', default: false })
  contrastRequired!: boolean;

  @Column({ type: 'varchar', nullable: true })
  contrastType?: string;

  @Column({ type: 'text', nullable: true })
  patientPrep?: string;

  @Column({ type: 'enum', enum: RadiologyOrderStatus, default: RadiologyOrderStatus.ORDERED })
  status!: RadiologyOrderStatus;

  @Column({ type: 'date', nullable: true })
  scheduledDate?: Date;

  @Column({ type: 'time', nullable: true })
  scheduledTime?: string;

  @Column({ type: 'timestamp', nullable: true })
  performedDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  reportedDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  verifiedDate?: Date;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @Column({ type: 'varchar', length: 20, default: 'not_billed' })
  billingStatus!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
