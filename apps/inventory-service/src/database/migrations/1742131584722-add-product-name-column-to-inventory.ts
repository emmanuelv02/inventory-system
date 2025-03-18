import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductNameColumnToInventory1742131584722
  implements MigrationInterface
{
  name = 'AddProductNameColumnToInventory1742131584722';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_inventory" ADD "product_name" character varying NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_inventory" DROP COLUMN "product_name"`,
    );
  }
}
