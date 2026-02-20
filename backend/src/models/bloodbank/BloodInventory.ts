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
import { User } from '../User';
import { BloodDonor } from './BloodDonor';

export enum BloodComponent {
  WHOLE_BLOOD = 'whole_blood',
  PRBC = 'prbc',
  FFP = 'ffp',
  PLATELET_CONCENTRATE = 'platelet_concentrate',
  CRYOPRECIPITATE = 'cryoprecipitate',
  PLATELET_RICH_PLASMA = 'platelet_rich_plasma',
  PACKED_CELLS = 'packed_cells',
}

export enum BloodBagStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  CROSS_MATCHED = 'cross_matched',
  ISSUED = 'issued',
  TRANSFUSED = 'transfused',
  EXPIRED = 'expired',
  DISCARDED = 'discarded',
  QUARANTINE = 'quarantine',
}

@Entity('blood_inventory')
export class BloodInventory {
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
  bagNumber!: string;

  @ManyToOne(() => BloodDonor, { nullable: true })
  @JoinColumn({ name: 'donor_id' })
  donor?: BloodDonor;

  @Column({ name: 'donor_id', type: 'uuid', nullable: true })
  donorId?: string;

  @Column({ type: 'varchar', length: 5 })
  bloodGroup!: string;

  @Column({ type: 'enum', enum: BloodComponent, default: BloodComponent.WHOLE_BLOOD })
  component!: BloodComponent;

  @Column({ type: 'int' })
  volume!: number;

  @Column({ type: 'date' })
  collectionDate!: Date;

  @Column({ type: 'date' })
  expiryDate!: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  storageTemp?: string;

  @Column({ type: 'enum', enum: BloodBagStatus, default: BloodBagStatus.QUARANTINE })
  status!: BloodBagStatus;

  @Column({ type: 'jsonb', nullable: true })
  testResults?: {
    hiv?: string;
    hbsag?: string;
    hcv?: string;
    vdrl?: string;
    malaria?: string;
    bloodGroupConfirmed?: boolean;
  };

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'issued_to' })
  issuedToPatient?: User;

  @Column({ name: 'issued_to', type: 'uuid', nullable: true })
  issuedTo?: string;

  @Column({ type: 'timestamp', nullable: true })
  issuedDate?: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'issued_by' })
  issuedByUser?: User;

  @Column({ name: 'issued_by', type: 'uuid', nullable: true })
  issuedBy?: string;

  @Column({ type: 'text', nullable: true })
  discardReason?: string;

  @Column({ type: 'date', nullable: true })
  discardDate?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
