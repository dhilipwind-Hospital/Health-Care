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
import { Location } from '../Location';

export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

@Entity('blood_donors')
export class BloodDonor {
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
  donorNumber!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ type: 'date' })
  dateOfBirth!: Date;

  @Column({ type: 'varchar', length: 10 })
  gender!: string;

  @Column({ type: 'varchar', length: 5 })
  bloodGroup!: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'varchar', nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', nullable: true })
  city?: string;

  @Column({ type: 'varchar', nullable: true })
  state?: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  aadhaarNumber?: string;

  @Column({ type: 'varchar', nullable: true })
  occupation?: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight?: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  hemoglobin?: number;

  @Column({ type: 'date', nullable: true })
  lastDonationDate?: Date;

  @Column({ type: 'int', default: 0 })
  totalDonations!: number;

  @Column({ type: 'boolean', default: false })
  isDeferral!: boolean;

  @Column({ type: 'text', nullable: true })
  deferralReason?: string;

  @Column({ type: 'date', nullable: true })
  deferralUntil?: Date;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  consentGiven!: boolean;

  @Column({ type: 'date', nullable: true })
  consentDate?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
