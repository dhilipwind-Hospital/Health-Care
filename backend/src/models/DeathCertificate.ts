import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './Organization';
import { Location } from './Location';
import { User } from './User';

export enum DeathPlace {
  HOSPITAL = 'hospital',
  BROUGHT_DEAD = 'brought_dead',
  HOME = 'home',
  OTHER = 'other',
}

export enum MannerOfDeath {
  NATURAL = 'natural',
  ACCIDENT = 'accident',
  SUICIDE = 'suicide',
  HOMICIDE = 'homicide',
  PENDING = 'pending',
  UNKNOWN = 'unknown',
}

export enum DeathCertificateStatus {
  DRAFT = 'draft',
  CERTIFIED = 'certified',
  REGISTERED = 'registered',
  ISSUED = 'issued',
}

@Entity('death_certificates')
export class DeathCertificate {
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
  certificateNumber!: string;

  // Deceased
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'patient_id' })
  patient?: User;

  @Column({ name: 'patient_id', type: 'uuid', nullable: true })
  patientId?: string;

  @Column({ name: 'admission_id', type: 'uuid', nullable: true })
  admissionId?: string;

  @Column()
  deceasedName!: string;

  @Column({ type: 'timestamp' })
  dateOfDeath!: Date;

  @Column({ type: 'time' })
  timeOfDeath!: string;

  @Column({ type: 'enum', enum: DeathPlace, default: DeathPlace.HOSPITAL })
  placeOfDeath!: DeathPlace;

  @Column({ type: 'varchar', nullable: true })
  wardName?: string;

  @Column({ type: 'varchar', nullable: true })
  bedNumber?: string;

  // Demographics
  @Column({ type: 'int' })
  age!: number;

  @Column({ type: 'varchar', length: 10, default: 'years' })
  ageUnit!: string;

  @Column({ type: 'varchar', length: 10 })
  gender!: string;

  @Column({ type: 'varchar', nullable: true })
  fatherOrHusbandName?: string;

  @Column({ type: 'varchar', nullable: true })
  motherName?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', nullable: true })
  religion?: string;

  @Column({ type: 'varchar', nullable: true })
  occupation?: string;

  @Column({ type: 'varchar', nullable: true })
  maritalStatus?: string;

  @Column({ type: 'varchar', default: 'Indian' })
  nationality!: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  aadhaarNumber?: string;

  // Cause of Death (WHO ICD format)
  @Column({ type: 'varchar' })
  immediateCause!: string;

  @Column({ type: 'varchar', nullable: true })
  antecedentCause1?: string;

  @Column({ type: 'varchar', nullable: true })
  antecedentCause2?: string;

  @Column({ type: 'varchar', nullable: true })
  underlyingCause?: string;

  @Column({ type: 'text', nullable: true })
  otherConditions?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  icdCodePrimary?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  icdCodeSecondary?: string;

  @Column({ type: 'enum', enum: MannerOfDeath, default: MannerOfDeath.NATURAL })
  mannerOfDeath!: MannerOfDeath;

  // Pregnancy related (females 15-49)
  @Column({ type: 'boolean', default: false })
  wasPregnant!: boolean;

  @Column({ type: 'varchar', nullable: true })
  pregnancyRelation?: string;

  // MLC
  @Column({ type: 'boolean', default: false })
  isMlc!: boolean;

  @Column({ type: 'boolean', default: false })
  policeInformed!: boolean;

  @Column({ type: 'boolean', default: false })
  postmortemRequired!: boolean;

  @Column({ type: 'boolean', default: false })
  postmortemDone!: boolean;

  @Column({ type: 'text', nullable: true })
  postmortemFindings?: string;

  // Certifying Doctor
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'certifying_doctor_id' })
  certifyingDoctor?: User;

  @Column({ name: 'certifying_doctor_id', type: 'uuid', nullable: true })
  certifyingDoctorId?: string;

  @Column({ type: 'varchar', nullable: true })
  certifyingDoctorName?: string;

  @Column({ type: 'varchar', nullable: true })
  certifyingDoctorReg?: string;

  @Column({ type: 'timestamp', nullable: true })
  certifiedAt?: Date;

  // Body Handover
  @Column({ type: 'varchar', nullable: true })
  bodyHandoverTo?: string;

  @Column({ type: 'varchar', nullable: true })
  bodyHandoverRelation?: string;

  @Column({ type: 'varchar', nullable: true })
  bodyHandoverIdProof?: string;

  @Column({ type: 'timestamp', nullable: true })
  bodyHandoverDate?: Date;

  @Column({ type: 'varchar', nullable: true })
  bodyHandoverWitness?: string;

  // Registration
  @Column({ type: 'varchar', nullable: true })
  registrationNumber?: string;

  @Column({ type: 'varchar', nullable: true })
  registeredAt?: string;

  @Column({ type: 'date', nullable: true })
  registrationDate?: Date;

  @Column({ type: 'enum', enum: DeathCertificateStatus, default: DeathCertificateStatus.DRAFT })
  status!: DeathCertificateStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
