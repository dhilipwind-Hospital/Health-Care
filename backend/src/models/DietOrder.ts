import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';

export enum DietType {
  REGULAR = 'regular',
  DIABETIC = 'diabetic',
  LOW_SALT = 'low_salt',
  LOW_FAT = 'low_fat',
  RENAL = 'renal',
  CARDIAC = 'cardiac',
  SOFT = 'soft',
  LIQUID = 'liquid',
  CLEAR_LIQUID = 'clear_liquid',
  NPO = 'npo',
  VEGETARIAN = 'vegetarian',
  NON_VEGETARIAN = 'non_vegetarian',
  CUSTOM = 'custom'
}

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
  ALL = 'all'
}

export enum DietOrderStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

@Entity('diet_orders')
export class DietOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'admission_id', nullable: true })
  admissionId?: string;

  @Column({ type: 'enum', enum: DietType })
  dietType!: DietType;

  @Column({ type: 'enum', enum: MealType, default: MealType.ALL })
  mealType!: MealType;

  @Column({ type: 'text', nullable: true })
  specialInstructions?: string;

  @Column({ type: 'simple-array', nullable: true })
  allergies?: string[];

  @Column({ type: 'simple-array', nullable: true })
  restrictions?: string[];

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({ type: 'enum', enum: DietOrderStatus, default: DietOrderStatus.ACTIVE })
  status!: DietOrderStatus;

  @Column({ name: 'ordered_by_id' })
  orderedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ordered_by_id' })
  orderedBy!: User;

  @Column({ name: 'ward_bed', length: 50, nullable: true })
  wardBed?: string;

  @Column({ type: 'int', nullable: true })
  calorieTarget?: number;

  @Column({ type: 'int', nullable: true })
  proteinTarget?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
