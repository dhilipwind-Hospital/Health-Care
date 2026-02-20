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

export enum OtRoomType {
  MAJOR = 'major',
  MINOR = 'minor',
  EMERGENCY = 'emergency',
  DAY_CARE = 'day_care',
}

export enum OtRoomStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  CLEANING = 'cleaning',
  RESERVED = 'reserved',
}

@Entity('ot_rooms')
export class OtRoom {
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

  @Column()
  name!: string;

  @Column({ type: 'varchar', length: 20 })
  code!: string;

  @Column({ type: 'enum', enum: OtRoomType, default: OtRoomType.MAJOR })
  type!: OtRoomType;

  @Column({ type: 'enum', enum: OtRoomStatus, default: OtRoomStatus.AVAILABLE })
  status!: OtRoomStatus;

  @Column({ type: 'varchar', nullable: true })
  floor?: string;

  @Column({ type: 'int', default: 1 })
  capacity!: number;

  @Column({ type: 'jsonb', nullable: true })
  equipment?: Array<{ name: string; status: string }>;

  @Column({ type: 'jsonb', nullable: true })
  features?: {
    hasLaminarFlow?: boolean;
    hasCArm?: boolean;
    hasLaparoscopy?: boolean;
    hasRobotics?: boolean;
  };

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
