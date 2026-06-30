import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductDiscounts1782882000000 implements MigrationInterface {
  name = 'ProductDiscounts1782882000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const productTable = await queryRunner.getTable('product_table');
    if (!productTable) return;

    if (!productTable.findColumnByName('discount_enabled')) {
      await queryRunner.query(`
        ALTER TABLE product_table
        ADD discount_enabled TINYINT NOT NULL DEFAULT 0
      `);
    }

    const refreshedTable = await queryRunner.getTable('product_table');
    if (!refreshedTable?.findColumnByName('discount_percentage')) {
      await queryRunner.query(`
        ALTER TABLE product_table
        ADD discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const productTable = await queryRunner.getTable('product_table');
    if (!productTable) return;

    if (productTable.findColumnByName('discount_percentage')) {
      await queryRunner.query(
        'ALTER TABLE product_table DROP COLUMN discount_percentage',
      );
    }

    const refreshedTable = await queryRunner.getTable('product_table');
    if (refreshedTable?.findColumnByName('discount_enabled')) {
      await queryRunner.query(
        'ALTER TABLE product_table DROP COLUMN discount_enabled',
      );
    }
  }
}
