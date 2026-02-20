import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePatientAccessGrantsTable1737460800000 implements MigrationInterface {
    name = 'CreatePatientAccessGrantsTable1737460800000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the patient_access_grants table
        await queryRunner.createTable(
            new Table({
                name: 'patient_access_grants',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'patient_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'patient_organization_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'requesting_doctor_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'doctor_organization_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['pending', 'approved', 'rejected', 'expired', 'revoked'],
                        default: "'pending'",
                    },
                    {
                        name: 'requestedDuration',
                        type: 'enum',
                        enum: ['24_hours', '3_days', '1_week', 'custom'],
                        default: "'24_hours'",
                    },
                    {
                        name: 'access_token',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                        isUnique: true,
                    },
                    {
                        name: 'rejection_token',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'granted_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'expires_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'revoked_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'reason',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'urgency_level',
                        type: 'varchar',
                        length: '20',
                        default: "'normal'",
                    },
                    {
                        name: 'requested_access_type',
                        type: 'varchar',
                        length: '50',
                        default: "'full_history'",
                    },
                    {
                        name: 'access_count',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'last_accessed_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'patient_ip_address',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'doctor_ip_address',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'email_sent_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'reminder_sent_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'expiry_notification_sent',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true
        );

        // Create foreign keys
        await queryRunner.createForeignKey(
            'patient_access_grants',
            new TableForeignKey({
                columnNames: ['patient_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.createForeignKey(
            'patient_access_grants',
            new TableForeignKey({
                columnNames: ['requesting_doctor_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.createForeignKey(
            'patient_access_grants',
            new TableForeignKey({
                columnNames: ['patient_organization_id'],
                referencedTableName: 'organizations',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.createForeignKey(
            'patient_access_grants',
            new TableForeignKey({
                columnNames: ['doctor_organization_id'],
                referencedTableName: 'organizations',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            })
        );

        // Create indexes
        await queryRunner.createIndex(
            'patient_access_grants',
            new TableIndex({
                name: 'IDX_patient_access_grants_patient_doctor_status',
                columnNames: ['patient_id', 'requesting_doctor_id', 'status'],
            })
        );

        await queryRunner.createIndex(
            'patient_access_grants',
            new TableIndex({
                name: 'IDX_patient_access_grants_status_expires',
                columnNames: ['status', 'expires_at'],
            })
        );

        console.log('✅ Created patient_access_grants table with indexes');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.dropIndex('patient_access_grants', 'IDX_patient_access_grants_status_expires');
        await queryRunner.dropIndex('patient_access_grants', 'IDX_patient_access_grants_patient_doctor_status');

        // Drop table (cascades foreign keys)
        await queryRunner.dropTable('patient_access_grants');

        console.log('✅ Dropped patient_access_grants table');
    }
}
