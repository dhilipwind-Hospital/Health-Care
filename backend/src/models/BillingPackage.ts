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

export enum PackageCategory {
  SURGERY = 'surgery',
  DELIVERY = 'delivery',
  DAYCARE = 'daycare',
  INVESTIGATION = 'investigation',
  WELLNESS = 'wellness',
}

@Entity('billing_packages')
export class BillingPackage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column()
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'enum', enum: PackageCategory, default: PackageCategory.SURGERY })
  category!: PackageCategory;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  inclusions?: Array<{ item: string; category: string; quantity: number; unitPrice: number }>;

  @Column({ type: 'simple-array', nullable: true })
  exclusions?: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'int', default: 365 })
  validityDays!: number;

  @Column({ type: 'boolean', default: true })
  gstApplicable!: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  hsnSacCode?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
