import { MigrationInterface, QueryRunner } from 'typeorm';

export class ImageUploadsExpansion1782792000000 implements MigrationInterface {
  name = 'ImageUploadsExpansion1782792000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const userTable = await queryRunner.getTable('user_table');
    if (userTable && !userTable.findColumnByName('profile_image')) {
      await queryRunner.query(`
        ALTER TABLE user_table
        ADD profile_image VARCHAR(500) NOT NULL DEFAULT 'defaults/user-avatar.svg'
      `);
    }

    if (!(await queryRunner.hasTable('product_image_table'))) {
      await queryRunner.query(`
        CREATE TABLE product_image_table (
          id INT NOT NULL AUTO_INCREMENT,
          product_id INT NOT NULL,
          image VARCHAR(500) NOT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_product_image_product (product_id, sort_order),
          CONSTRAINT fk_product_image_product
            FOREIGN KEY (product_id) REFERENCES product_table(id)
            ON DELETE CASCADE ON UPDATE NO ACTION
        ) ENGINE=InnoDB
      `);
    }

    await queryRunner.query(`
      INSERT INTO product_image_table (product_id, image, sort_order)
      SELECT product.id, product.image, 0
      FROM product_table product
      WHERE product.image IS NOT NULL
        AND TRIM(product.image) <> ''
        AND NOT EXISTS (
          SELECT 1 FROM product_image_table images
          WHERE images.product_id = product.id
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('product_image_table')) {
      await queryRunner.query('DROP TABLE product_image_table');
    }
    const userTable = await queryRunner.getTable('user_table');
    if (userTable?.findColumnByName('profile_image')) {
      await queryRunner.query(
        'ALTER TABLE user_table DROP COLUMN profile_image',
      );
    }
  }
}
