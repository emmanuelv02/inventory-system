import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProcessedEventsTable1742201715044
  implements MigrationInterface
{
  name = 'CreateProcessedEventsTable1742201715044';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "processed_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "correlation_id" character varying NOT NULL, "event_type" character varying NOT NULL, "entity_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ba68353edc3a2f9d1affdfa4218" UNIQUE ("correlation_id"), CONSTRAINT "PK_a08d68aa0747daea9efd2ddea53" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "processed_events"`);
  }
}
