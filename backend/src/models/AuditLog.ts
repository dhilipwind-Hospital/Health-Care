import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';

@Entity('audit_logs')
@Index(['organizationId', 'createdAt']) // Optimize for filtering by org and date
@Index(['userId', 'action']) // Optimize for user activity search
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    action!: string; // e.g., "LOGIN", "CREATE_PATIENT", "DELETE_USER"

    @Column({ nullable: true })
    entityType!: string; // e.g., "User", "Patient", "Appointment"

    @Column({ nullable: true })
    entityId!: string; // The specific ID of the item affected

    @Column({ type: 'jsonb', nullable: true })
    details!: any; // Flexible JSON for "Before/After" value diffs

    @Column({ nullable: true })
    ipAddress!: string;

    @Column({ nullable: true })
    userAgent!: string;

    @Column({ name: 'user_id', nullable: true })
    userId!: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user?: User;

    @Column({ name: 'organization_id', nullable: true })
    organizationId!: string;

    @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' })
    organization?: Organization;

    @CreateDateColumn()
    createdAt!: Date;
}
