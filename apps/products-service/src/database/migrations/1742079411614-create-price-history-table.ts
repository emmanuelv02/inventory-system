import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePriceHistoryTable1742079411614
  implements MigrationInterface
{
  name = 'CreatePriceHistoryTable1742079411614';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "price_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "price" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e41e25472373d4b574b153229e9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "price_history" ADD CONSTRAINT "FK_ebdb4d54c8de7847c0f7a9e4fbb" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "price_history" DROP CONSTRAINT "FK_ebdb4d54c8de7847c0f7a9e4fbb"`,
    );
    await queryRunner.query(`DROP TABLE "price_history"`);
  }
}
