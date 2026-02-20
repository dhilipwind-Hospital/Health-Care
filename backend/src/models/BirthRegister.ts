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

export enum DeliveryType {
  NORMAL_VAGINAL = 'normal_vaginal',
  ASSISTED_VAGINAL = 'assisted_vaginal',
  LSCS = 'lscs',
  FORCEPS = 'forceps',
  VACUUM = 'vacuum',
  BREECH = 'breech',
}

export enum BirthType {
  SINGLE = 'single',
  TWIN = 'twin',
  TRIPLET = 'triplet',
  QUADRUPLET = 'quadruplet',
  OTHER = 'other',
}

export enum BirthRegisterStatus {
  DRAFT = 'draft',
  CERTIFIED = 'certified',
  REGISTERED = 'registered',
  ISSUED = 'issued',
}

@Entity('birth_registers')
export class BirthRegister {
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
  registerNumber!: string;

  // Child Details
  @Column({ type: 'varchar', nullable: true })
  childName?: string;

  @Column({ type: 'date' })
  dateOfBirth!: Date;

  @Column({ type: 'time' })
  timeOfBirth!: string;

  @Column({ type: 'varchar', length: 10 })
  gender!: string;

  @Column({ type: 'decimal', precision: 5, scale: 3 })
  birthWeight!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  birthLength?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  headCircumference?: number;

  @Column({ type: 'int', nullable: true })
  apgarScore1Min?: number;

  @Column({ type: 'int', nullable: true })
  apgarScore5Min?: number;

  @Column({ type: 'int', default: 1 })
  birthOrder!: number;

  @Column({ type: 'enum', enum: BirthType, default: BirthType.SINGLE })
  typeOfBirth!: BirthType;

  // Delivery Details
  @Column({ type: 'enum', enum: DeliveryType, default: DeliveryType.NORMAL_VAGINAL })
  deliveryType!: DeliveryType;

  @Column({ type: 'varchar', default: 'hospital' })
  deliveryPlace!: string;

  @Column({ name: 'admission_id', type: 'uuid', nullable: true })
  admissionId?: string;

  @Column({ type: 'varchar', nullable: true })
  wardName?: string;

  // Mother Details
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'mother_id' })
  mother?: User;

  @Column({ name: 'mother_id', type: 'uuid', nullable: true })
  motherId?: string;

  @Column()
  motherName!: string;

  @Column({ type: 'int' })
  motherAge!: number;

  @Column({ type: 'varchar', length: 12, nullable: true })
  motherAadhaar?: string;

  @Column({ type: 'text', nullable: true })
  motherAddress?: string;

  @Column({ type: 'varchar', nullable: true })
  motherReligion?: string;

  @Column({ type: 'varchar', default: 'Indian' })
  motherNationality!: string;

  @Column({ type: 'varchar', nullable: true })
  motherEducation?: string;

  @Column({ type: 'varchar', nullable: true })
  motherOccupation?: string;

  @Column({ type: 'int', nullable: true })
  gravida?: number;

  @Column({ type: 'int', nullable: true })
  para?: number;

  @Column({ type: 'int', nullable: true })
  livingChildren?: number;

  @Column({ type: 'boolean', default: false })
  antenatalCareReceived!: boolean;

  // Father Details
  @Column()
  fatherName!: string;

  @Column({ type: 'int', nullable: true })
  fatherAge?: number;

  @Column({ type: 'varchar', length: 12, nullable: true })
  fatherAadhaar?: string;

  @Column({ type: 'varchar', nullable: true })
  fatherOccupation?: string;

  @Column({ type: 'varchar', nullable: true })
  fatherEducation?: string;

  @Column({ type: 'varchar', default: 'Indian' })
  fatherNationality!: string;

  // Attending Details
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'attending_doctor_id' })
  attendingDoctor?: User;

  @Column({ name: 'attending_doctor_id', type: 'uuid', nullable: true })
  attendingDoctorId?: string;

  @Column({ type: 'varchar', nullable: true })
  attendingDoctorName?: string;

  @Column({ type: 'varchar', nullable: true })
  attendingDoctorReg?: string;

  @Column({ type: 'varchar', default: 'doctor' })
  attendedBy!: string;

  // Complications
  @Column({ type: 'simple-array', nullable: true })
  complications?: string[];

  @Column({ type: 'simple-array', nullable: true })
  neonatalComplications?: string[];

  @Column({ type: 'boolean', default: false })
  nicuAdmission!: boolean;

  @Column({ type: 'text', nullable: true })
  nicuReason?: string;

  // Stillbirth
  @Column({ type: 'boolean', default: false })
  isStillbirth!: boolean;

  @Column({ type: 'varchar', nullable: true })
  stillbirthType?: string;

  @Column({ type: 'text', nullable: true })
  causeOfStillbirth?: string;

  // Registration
  @Column({ type: 'varchar', nullable: true })
  registrationNumber?: string;

  @Column({ type: 'varchar', nullable: true })
  registeredAt?: string;

  @Column({ type: 'date', nullable: true })
  registrationDate?: Date;

  // Vaccination at Birth
  @Column({ type: 'boolean', default: false })
  bcgGiven!: boolean;

  @Column({ type: 'boolean', default: false })
  opv0Given!: boolean;

  @Column({ type: 'boolean', default: false })
  hepB0Given!: boolean;

  @Column({ type: 'boolean', default: false })
  vitaminKGiven!: boolean;

  @Column({ type: 'enum', enum: BirthRegisterStatus, default: BirthRegisterStatus.DRAFT })
  status!: BirthRegisterStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
