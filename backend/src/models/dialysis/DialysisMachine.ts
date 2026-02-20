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

export enum MachineStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  OUT_OF_ORDER = 'out_of_order',
}

@Entity('dialysis_machines')
export class DialysisMachine {
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
  machineNumber!: string;

  @Column({ type: 'varchar', nullable: true })
  brand?: string;

  @Column({ type: 'varchar', nullable: true })
  model?: string;

  @Column({ type: 'varchar', nullable: true })
  serialNumber?: string;

  @Column({ type: 'enum', enum: MachineStatus, default: MachineStatus.AVAILABLE })
  status!: MachineStatus;

  @Column({ type: 'date', nullable: true })
  lastMaintenanceDate?: Date;

  @Column({ type: 'date', nullable: true })
  nextMaintenanceDate?: Date;

  @Column({ type: 'int', default: 0 })
  totalSessions!: number;

  @Column({ type: 'date', nullable: true })
  installationDate?: Date;

  @Column({ type: 'date', nullable: true })
  warrantyExpiry?: Date;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
