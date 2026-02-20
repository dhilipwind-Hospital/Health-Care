import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

export enum InquirySource {
    LANDING_PAGE = 'landing_page',
    CONTACT_FORM = 'contact_form',
    DEMO_REQUEST = 'demo_request',
    PRICING_PAGE = 'pricing_page'
}

export enum InquiryStatus {
    NEW = 'new',
    CONTACTED = 'contacted',
    QUALIFIED = 'qualified',
    PROPOSAL_SENT = 'proposal_sent',
    WON = 'won',
    LOST = 'lost'
}

export enum CompanySize {
    SMALL = 'small',       // 1-50 beds
    MEDIUM = 'medium',     // 51-200 beds
    LARGE = 'large',       // 201-500 beds
    ENTERPRISE = 'enterprise' // 500+ beds
}

@Entity({ name: 'sales_inquiries' })
export class SalesInquiry {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, name: 'full_name' })
    fullName!: string;

    @Column({ type: 'varchar', length: 255 })
    email!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    phone?: string;

    @Column({ type: 'varchar', length: 255, nullable: true, name: 'company_name' })
    companyName?: string;

    @Column({
        type: 'enum',
        enum: CompanySize,
        nullable: true,
        name: 'company_size'
    })
    companySize?: CompanySize;

    @Column({ type: 'text' })
    message!: string;

    @Column({
        type: 'enum',
        enum: InquirySource,
        default: InquirySource.LANDING_PAGE
    })
    source!: InquirySource;

    @Column({
        type: 'enum',
        enum: InquiryStatus,
        default: InquiryStatus.NEW
    })
    status!: InquiryStatus;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'assigned_to' })
    assignedTo?: User;

    @Column({ type: 'uuid', nullable: true, name: 'assigned_to' })
    assignedToId?: string;

    @Column({ type: 'varchar', length: 100, nullable: true, name: 'interested_plan' })
    interestedPlan?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    country?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    city?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', nullable: true, name: 'contacted_at' })
    contactedAt?: Date;

    @Column({ type: 'timestamp', nullable: true, name: 'converted_at' })
    convertedAt?: Date;
}
