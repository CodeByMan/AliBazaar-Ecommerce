import type { MigrationInterface, QueryRunner } from 'typeorm';

export class FypCommerceExpansion1782705600000 implements MigrationInterface {
  name = 'FypCommerceExpansion1782705600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.createRoles(queryRunner);
    await this.extendAuth(queryRunner);
    await this.createCategories(queryRunner);
    await this.extendOrders(queryRunner);
    await this.extendPayments(queryRunner);
    await this.extendCheckoutSessions(queryRunner);
    await this.extendReviews(queryRunner);
    await this.createCoupons(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS coupon_redemption_table');
    await queryRunner.query('DROP TABLE IF EXISTS user_coupon_table');
    await queryRunner.query('DROP TABLE IF EXISTS coupon_table');
    await queryRunner.query('DROP TABLE IF EXISTS order_status_history_table');

    await this.dropForeignKeyIfExists(
      queryRunner,
      'review_table',
      'fk_review_order_item',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'review_table',
      'uq_review_order_item',
    );
    for (const column of [
      'order_item_id',
      'feedback',
      'is_visible',
      'updated_at',
    ]) {
      await this.dropColumnIfExists(queryRunner, 'review_table', column);
    }

    for (const column of ['payment_provider', 'coupon_id', 'coupon_code']) {
      await this.dropColumnIfExists(
        queryRunner,
        'checkout_session_table',
        column,
      );
    }
    for (const column of ['card_last_four', 'card_brand', 'is_test']) {
      await this.dropColumnIfExists(queryRunner, 'payment_table', column);
    }
    for (const column of [
      'coupon_code',
      'cancellation_reason',
      'cancelled_at',
      'cancelled_by_auth_id',
    ]) {
      await this.dropColumnIfExists(queryRunner, 'order_table', column);
    }

    await this.dropForeignKeyIfExists(
      queryRunner,
      'product_table',
      'fk_product_category',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'product_table',
      'idx_product_category_id',
    );
    await this.dropColumnIfExists(queryRunner, 'product_table', 'category_id');
    await queryRunner.query('DROP TABLE IF EXISTS category_table');

    for (const column of ['is_active', 'created_at', 'updated_at']) {
      await this.dropColumnIfExists(queryRunner, 'auth_table', column);
    }
    await queryRunner.query('DROP TABLE IF EXISTS role_table');
  }

  private async createRoles(queryRunner: QueryRunner) {
    if (!(await queryRunner.hasTable('role_table'))) {
      await queryRunner.query(`
        CREATE TABLE role_table (
          id INT NOT NULL AUTO_INCREMENT,
          name VARCHAR(50) NOT NULL,
          description VARCHAR(255) NULL,
          is_system TINYINT NOT NULL DEFAULT 0,
          is_active TINYINT NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_role_name (name)
        ) ENGINE=InnoDB
      `);
    }
    await queryRunner.query(`
      INSERT INTO role_table (name, description, is_system, is_active)
      VALUES
        ('admin', 'Seeded AliBazaar administrator', 1, 1),
        ('user', 'Storefront customer', 1, 1),
        ('manager', 'Store manager account', 0, 1),
        ('employee', 'Store employee account', 0, 1),
        ('rider', 'Delivery rider account', 0, 1)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `);
    await queryRunner.query(`
      INSERT IGNORE INTO role_table (name, description, is_system, is_active)
      SELECT DISTINCT LOWER(role), CONCAT('Imported role: ', role), 0, 1
      FROM auth_table
      WHERE role IS NOT NULL AND role <> ''
    `);
  }

  private async extendAuth(queryRunner: QueryRunner) {
    await this.addColumnIfMissing(
      queryRunner,
      'auth_table',
      'is_active',
      'TINYINT NOT NULL DEFAULT 1',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'auth_table',
      'created_at',
      'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'auth_table',
      'updated_at',
      'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    );
  }

  private async createCategories(queryRunner: QueryRunner) {
    if (!(await queryRunner.hasTable('category_table'))) {
      await queryRunner.query(`
        CREATE TABLE category_table (
          id INT NOT NULL AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(120) NOT NULL,
          description TEXT NULL,
          image VARCHAR(500) NULL,
          is_active TINYINT NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_category_name (name),
          UNIQUE KEY uq_category_slug (slug)
        ) ENGINE=InnoDB
      `);
    }
    await queryRunner.query(`
      INSERT IGNORE INTO category_table (name, slug, is_active)
      SELECT DISTINCT
        TRIM(category),
        LOWER(TRIM(BOTH '-' FROM REGEXP_REPLACE(TRIM(category), '[^A-Za-z0-9]+', '-'))),
        1
      FROM product_table
      WHERE category IS NOT NULL AND TRIM(category) <> ''
    `);
    await this.addColumnIfMissing(
      queryRunner,
      'product_table',
      'category_id',
      'INT NULL',
    );
    await queryRunner.query(`
      UPDATE product_table product
      INNER JOIN category_table category
        ON LOWER(category.name) = LOWER(product.category)
      SET product.category_id = category.id
      WHERE product.category_id IS NULL
    `);
    await this.addIndexIfMissing(
      queryRunner,
      'product_table',
      'idx_product_category_id',
      'category_id',
    );
    await this.addForeignKeyIfMissing(
      queryRunner,
      'product_table',
      'fk_product_category',
      'category_id',
      'category_table',
      'id',
      'SET NULL',
    );
  }

  private async extendOrders(queryRunner: QueryRunner) {
    await queryRunner.query(`
      UPDATE order_table
      SET status = 'Pending'
      WHERE status IN ('Confirmed', 'Processing')
    `);
    await queryRunner.query(`
      ALTER TABLE order_table
      MODIFY status ENUM('Pending','Dispatched','Delivered','Cancelled')
      NOT NULL DEFAULT 'Pending'
    `);
    await queryRunner.query(`
      UPDATE shipment_table
      SET status = 'Pending'
      WHERE status IN ('Confirmed', 'Processing')
    `);
    await queryRunner.query(`
      ALTER TABLE shipment_table
      MODIFY status ENUM('Pending','Dispatched','Delivered','Cancelled')
      NOT NULL DEFAULT 'Pending'
    `);

    await this.addColumnIfMissing(
      queryRunner,
      'order_table',
      'coupon_code',
      'VARCHAR(50) NULL',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'order_table',
      'cancellation_reason',
      'VARCHAR(500) NULL',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'order_table',
      'cancelled_at',
      'TIMESTAMP NULL',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'order_table',
      'cancelled_by_auth_id',
      'INT NULL',
    );

    if (!(await queryRunner.hasTable('order_status_history_table'))) {
      await queryRunner.query(`
        CREATE TABLE order_status_history_table (
          id INT NOT NULL AUTO_INCREMENT,
          order_id INT NOT NULL,
          old_status ENUM('Pending','Dispatched','Delivered','Cancelled') NULL,
          new_status ENUM('Pending','Dispatched','Delivered','Cancelled') NOT NULL,
          reason VARCHAR(500) NULL,
          changed_by_auth_id INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_order_status_history_order (order_id, created_at),
          CONSTRAINT fk_order_status_history_order
            FOREIGN KEY (order_id) REFERENCES order_table(id)
            ON DELETE CASCADE ON UPDATE NO ACTION
        ) ENGINE=InnoDB
      `);
      await queryRunner.query(`
        INSERT INTO order_status_history_table
          (order_id, old_status, new_status, reason, created_at)
        SELECT id, NULL, status, 'Imported current order status', created_at
        FROM order_table
      `);
    }
  }

  private async extendPayments(queryRunner: QueryRunner) {
    await this.addColumnIfMissing(
      queryRunner,
      'payment_table',
      'card_last_four',
      'VARCHAR(4) NULL',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'payment_table',
      'card_brand',
      'VARCHAR(30) NULL',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'payment_table',
      'is_test',
      'TINYINT NOT NULL DEFAULT 1',
    );
  }

  private async extendCheckoutSessions(queryRunner: QueryRunner) {
    await this.addColumnIfMissing(
      queryRunner,
      'checkout_session_table',
      'payment_provider',
      "VARCHAR(30) NOT NULL DEFAULT 'stripe'",
    );
    await this.addColumnIfMissing(
      queryRunner,
      'checkout_session_table',
      'coupon_id',
      'INT NULL',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'checkout_session_table',
      'coupon_code',
      'VARCHAR(50) NULL',
    );
  }

  private async extendReviews(queryRunner: QueryRunner) {
    await this.addColumnIfMissing(
      queryRunner,
      'review_table',
      'order_item_id',
      'INT NULL',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'review_table',
      'feedback',
      'TEXT NULL',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'review_table',
      'is_visible',
      'TINYINT NOT NULL DEFAULT 1',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'review_table',
      'updated_at',
      'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    );
    await this.addIndexIfMissing(
      queryRunner,
      'review_table',
      'uq_review_order_item',
      'order_item_id',
      true,
    );
    await this.addForeignKeyIfMissing(
      queryRunner,
      'review_table',
      'fk_review_order_item',
      'order_item_id',
      'order_item_table',
      'id',
      'SET NULL',
    );
  }

  private async createCoupons(queryRunner: QueryRunner) {
    if (!(await queryRunner.hasTable('coupon_table'))) {
      await queryRunner.query(`
        CREATE TABLE coupon_table (
          id INT NOT NULL AUTO_INCREMENT,
          code VARCHAR(50) NOT NULL,
          type ENUM('percentage','fixed') NOT NULL,
          kind ENUM('discount','compensation') NOT NULL DEFAULT 'discount',
          value DECIMAL(12,2) NOT NULL,
          minimum_order_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
          maximum_discount DECIMAL(12,2) NULL,
          starts_at TIMESTAMP NULL,
          expires_at TIMESTAMP NULL,
          usage_limit INT NULL,
          per_user_limit INT NOT NULL DEFAULT 1,
          used_count INT NOT NULL DEFAULT 0,
          is_active TINYINT NOT NULL DEFAULT 1,
          created_by_auth_id INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_coupon_code (code),
          KEY idx_coupon_active_dates (is_active, starts_at, expires_at)
        ) ENGINE=InnoDB
      `);
    }
    if (!(await queryRunner.hasTable('user_coupon_table'))) {
      await queryRunner.query(`
        CREATE TABLE user_coupon_table (
          id INT NOT NULL AUTO_INCREMENT,
          coupon_id INT NOT NULL,
          user_id INT NOT NULL,
          source_order_id INT NULL,
          reason VARCHAR(500) NULL,
          assigned_by_auth_id INT NULL,
          used_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_user_coupon_assignment (coupon_id, user_id),
          KEY idx_user_coupon_user (user_id, used_at),
          CONSTRAINT fk_user_coupon_coupon
            FOREIGN KEY (coupon_id) REFERENCES coupon_table(id)
            ON DELETE CASCADE ON UPDATE NO ACTION,
          CONSTRAINT fk_user_coupon_user
            FOREIGN KEY (user_id) REFERENCES user_table(id)
            ON DELETE CASCADE ON UPDATE NO ACTION,
          CONSTRAINT fk_user_coupon_order
            FOREIGN KEY (source_order_id) REFERENCES order_table(id)
            ON DELETE SET NULL ON UPDATE NO ACTION
        ) ENGINE=InnoDB
      `);
    }
    if (!(await queryRunner.hasTable('coupon_redemption_table'))) {
      await queryRunner.query(`
        CREATE TABLE coupon_redemption_table (
          id INT NOT NULL AUTO_INCREMENT,
          coupon_id INT NOT NULL,
          user_id INT NOT NULL,
          order_id INT NOT NULL,
          discount_amount DECIMAL(12,2) NOT NULL,
          redeemed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_coupon_redemption_order (coupon_id, order_id),
          KEY idx_coupon_redemption_user (user_id, redeemed_at),
          CONSTRAINT fk_coupon_redemption_coupon
            FOREIGN KEY (coupon_id) REFERENCES coupon_table(id)
            ON DELETE RESTRICT ON UPDATE NO ACTION,
          CONSTRAINT fk_coupon_redemption_user
            FOREIGN KEY (user_id) REFERENCES user_table(id)
            ON DELETE RESTRICT ON UPDATE NO ACTION,
          CONSTRAINT fk_coupon_redemption_order
            FOREIGN KEY (order_id) REFERENCES order_table(id)
            ON DELETE CASCADE ON UPDATE NO ACTION
        ) ENGINE=InnoDB
      `);
    }
  }

  private async addColumnIfMissing(
    queryRunner: QueryRunner,
    table: string,
    column: string,
    definition: string,
  ) {
    if (!(await queryRunner.hasColumn(table, column))) {
      await queryRunner.query(
        `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`,
      );
    }
  }

  private async dropColumnIfExists(
    queryRunner: QueryRunner,
    table: string,
    column: string,
  ) {
    if (await queryRunner.hasColumn(table, column)) {
      await queryRunner.query(
        `ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``,
      );
    }
  }

  private async addIndexIfMissing(
    queryRunner: QueryRunner,
    table: string,
    index: string,
    column: string,
    unique = false,
  ) {
    if (!(await this.indexExists(queryRunner, table, index))) {
      await queryRunner.query(
        `ALTER TABLE \`${table}\` ADD ${unique ? 'UNIQUE ' : ''}INDEX \`${index}\` (\`${column}\`)`,
      );
    }
  }

  private async dropIndexIfExists(
    queryRunner: QueryRunner,
    table: string,
    index: string,
  ) {
    if (await this.indexExists(queryRunner, table, index)) {
      await queryRunner.query(
        `ALTER TABLE \`${table}\` DROP INDEX \`${index}\``,
      );
    }
  }

  private async addForeignKeyIfMissing(
    queryRunner: QueryRunner,
    table: string,
    constraint: string,
    column: string,
    referencedTable: string,
    referencedColumn: string,
    onDelete: string,
  ) {
    if (!(await this.constraintExists(queryRunner, table, constraint))) {
      await queryRunner.query(`
        ALTER TABLE \`${table}\`
        ADD CONSTRAINT \`${constraint}\`
        FOREIGN KEY (\`${column}\`) REFERENCES \`${referencedTable}\`(\`${referencedColumn}\`)
        ON DELETE ${onDelete} ON UPDATE NO ACTION
      `);
    }
  }

  private async dropForeignKeyIfExists(
    queryRunner: QueryRunner,
    table: string,
    constraint: string,
  ) {
    if (await this.constraintExists(queryRunner, table, constraint)) {
      await queryRunner.query(
        `ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${constraint}\``,
      );
    }
  }

  private async indexExists(
    queryRunner: QueryRunner,
    table: string,
    index: string,
  ) {
    const rows = (await queryRunner.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
       LIMIT 1`,
      [table, index],
    )) as unknown[];
    return rows.length > 0;
  }

  private async constraintExists(
    queryRunner: QueryRunner,
    table: string,
    constraint: string,
  ) {
    const rows = (await queryRunner.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?
       LIMIT 1`,
      [table, constraint],
    )) as unknown[];
    return rows.length > 0;
  }
}
