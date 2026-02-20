import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';

export enum WasteCategory {
  YELLOW = 'yellow',
  RED = 'red',
  WHITE = 'white',
  BLUE = 'blue'
}

export enum DisposalMethod {
  INCINERATION = 'incineration',
  AUTOCLAVING = 'autoclaving',
  CHEMICAL_TREATMENT = 'chemical_treatment',
  SHREDDING = 'shredding',
  DEEP_BURIAL = 'deep_burial',
  SECURED_LANDFILL = 'secured_landfill'
}

@Entity('biomedical_waste_entries')
export class BiomedicalWasteEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ type: 'date' })
  date!: Date;

  @Column({
    type: 'enum',
    enum: WasteCategory
  })
  category!: WasteCategory;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'quantity_kg', type: 'decimal', precision: 10, scale: 2 })
  quantityKg!: number;

  @Column({ name: 'source_department', nullable: true, length: 100 })
  sourceDepartment?: string;

  @Column({ name: 'container_id', nullable: true, length: 50 })
  containerId?: string;

  @Column({
    name: 'disposal_method',
    type: 'enum',
    enum: DisposalMethod,
    nullable: true
  })
  disposalMethod?: DisposalMethod;

  @Column({ name: 'disposed_at', type: 'timestamp', nullable: true })
  disposedAt?: Date;

  @Column({ name: 'disposed_by_id', nullable: true })
  disposedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'disposed_by_id' })
  disposedBy?: User;

  @Column({ name: 'manifest_number', nullable: true, length: 50 })
  manifestNumber?: string;

  @Column({ name: 'transporter_name', nullable: true, length: 200 })
  transporterName?: string;

  @Column({ name: 'vehicle_number', nullable: true, length: 20 })
  vehicleNumber?: string;

  @Column({ name: 'treatment_facility', nullable: true, length: 200 })
  treatmentFacility?: string;

  @Column({ name: 'recorded_by_id', nullable: true })
  recordedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'recorded_by_id' })
  recordedBy?: User;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
