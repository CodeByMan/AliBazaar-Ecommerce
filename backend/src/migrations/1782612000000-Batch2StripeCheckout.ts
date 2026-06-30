import { MigrationInterface, QueryRunner } from 'typeorm';

type ColumnMetadataRow = {
  columnType: string;
  characterSetName: string | null;
  collationName: string | null;
};

type TableEngineRow = {
  engine: string | null;
};

type ExistingTableRow = {
  tableName: string;
};

export class Batch2StripeCheckout1782612000000 implements MigrationInterface {
  name = 'Batch2StripeCheckout1782612000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.adoptLegacyTableNames(queryRunner);

    await this.archiveLegacyTable(
      queryRunner,
      'payment_table',
      'payment_intent_id',
    );
    await this.archiveLegacyTable(
      queryRunner,
      'shipment_table',
      'estimated_delivery_at',
    );
    await this.archiveLegacyTable(queryRunner, 'order_table', 'order_number');

    await this.ensureAuthTable(queryRunner);
    await this.ensureUserTable(queryRunner);
    await this.ensureProductTable(queryRunner);

    await this.ensureInnoDb(queryRunner, 'auth_table');
    await this.ensureInnoDb(queryRunner, 'user_table');
    await this.ensureInnoDb(queryRunner, 'product_table');

    await this.ensureBaselineCommerceTables(queryRunner);

    const userIdColumnType = await this.getReferencedColumnDefinition(
      queryRunner,
      'user_table',
      'id',
    );
    const productIdColumnType = await this.getReferencedColumnDefinition(
      queryRunner,
      'product_table',
      'id',
    );

    await this.ensureOrderTable(queryRunner, userIdColumnType);
    await this.ensureOrderItemTable(queryRunner, productIdColumnType);
    await this.ensurePaymentTable(queryRunner);
    await this.ensureShipmentTable(queryRunner);
    await this.ensureCheckoutSessionTable(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [
      'checkout_session_table',
      'shipment_table',
      'payment_table',
      'order_item_table',
      'order_table',
    ]) {
      if (await queryRunner.hasTable(table)) {
        await queryRunner.dropTable(table, true, true, true);
      }
    }

    await this.restoreLegacyTable(queryRunner, 'order_table');
    await this.restoreLegacyTable(queryRunner, 'shipment_table');
    await this.restoreLegacyTable(queryRunner, 'payment_table');
  }

  private async adoptLegacyTableNames(queryRunner: QueryRunner): Promise<void> {
    const aliases: Record<string, string[]> = {
      auth_table: ['auth', 'auths', 'authentication', 'authentications'],
      user_table: ['user', 'users', 'customer', 'customers'],
      product_table: ['product', 'products'],
      review_table: ['review', 'reviews'],
      cart_table: ['cart', 'carts'],
      wishlist_table: ['wishlist', 'wishlists', 'wish_list'],
      order_table: ['order', 'orders'],
      payment_table: ['payment', 'payments'],
      shipment_table: ['shipment', 'shipments'],
    };

    for (const [canonicalName, candidates] of Object.entries(aliases)) {
      if (await queryRunner.hasTable(canonicalName)) {
        continue;
      }

      const legacyName = await this.findExistingTableName(
        queryRunner,
        candidates,
      );

      if (legacyName) {
        await queryRunner.renameTable(legacyName, canonicalName);
      }
    }
  }

  private async ensureAuthTable(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('auth_table'))) {
      await queryRunner.query(`
        CREATE TABLE auth_table (
          id INT NOT NULL AUTO_INCREMENT,
          username VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(255) NOT NULL,
          PRIMARY KEY (id),
          UNIQUE KEY uq_auth_username (username)
        ) ENGINE=InnoDB
      `);
      return;
    }

    await this.assertColumns(queryRunner, 'auth_table', [
      'id',
      'username',
      'password',
      'role',
    ]);
  }

  private async ensureUserTable(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('user_table')) {
      await this.assertColumns(queryRunner, 'user_table', [
        'id',
        'name',
        'age',
        'email',
        'phone',
        'auth_table',
      ]);
      return;
    }

    const authIdColumnType = await this.getReferencedColumnDefinition(
      queryRunner,
      'auth_table',
      'id',
    );

    await queryRunner.query(`
      CREATE TABLE user_table (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        age INT NOT NULL,
        email VARCHAR(50) NOT NULL,
        phone VARCHAR(15) NOT NULL,
        auth_table ${authIdColumnType} NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_user_auth (auth_table),
        KEY idx_user_email (email),
        CONSTRAINT fk_user_auth FOREIGN KEY (auth_table) REFERENCES auth_table(id) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  private async ensureProductTable(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('product_table')) {
      await this.assertColumns(queryRunner, 'product_table', [
        'id',
        'name',
        'description',
        'price',
        'stock',
        'image',
        'category',
      ]);
      return;
    }

    await queryRunner.query(`
      CREATE TABLE product_table (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        stock INT NOT NULL,
        image VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        PRIMARY KEY (id),
        KEY idx_product_category (category),
        KEY idx_product_name (name)
      ) ENGINE=InnoDB
    `);
  }

  private async ensureBaselineCommerceTables(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const userIdColumnType = await this.getReferencedColumnDefinition(
      queryRunner,
      'user_table',
      'id',
    );
    const productIdColumnType = await this.getReferencedColumnDefinition(
      queryRunner,
      'product_table',
      'id',
    );

    if (!(await queryRunner.hasTable('review_table'))) {
      await queryRunner.query(`
        CREATE TABLE review_table (
          id INT NOT NULL AUTO_INCREMENT,
          product_id ${productIdColumnType} NOT NULL,
          user_id ${userIdColumnType} NOT NULL,
          review TEXT NOT NULL,
          rating DECIMAL(2,1) NOT NULL,
          image VARCHAR(255) NULL,
          reviewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_review_product (product_id),
          KEY idx_review_user (user_id),
          CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES product_table(id) ON DELETE CASCADE ON UPDATE NO ACTION,
          CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES user_table(id) ON DELETE NO ACTION ON UPDATE NO ACTION
        ) ENGINE=InnoDB
      `);
    } else {
      await this.ensureInnoDb(queryRunner, 'review_table');
      await this.assertColumns(queryRunner, 'review_table', [
        'id',
        'product_id',
        'user_id',
        'review',
        'rating',
        'image',
        'reviewed_at',
      ]);
    }

    if (!(await queryRunner.hasTable('cart_table'))) {
      await queryRunner.query(`
        CREATE TABLE cart_table (
          id INT NOT NULL AUTO_INCREMENT,
          user_id ${userIdColumnType} NOT NULL,
          product_id ${productIdColumnType} NOT NULL,
          quantity INT NOT NULL,
          total DECIMAL(10,2) NOT NULL,
          PRIMARY KEY (id),
          KEY idx_cart_user (user_id),
          KEY idx_cart_product (product_id),
          CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES user_table(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
          CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES product_table(id) ON DELETE NO ACTION ON UPDATE NO ACTION
        ) ENGINE=InnoDB
      `);
    } else {
      await this.ensureInnoDb(queryRunner, 'cart_table');
      await this.assertColumns(queryRunner, 'cart_table', [
        'id',
        'user_id',
        'product_id',
        'quantity',
        'total',
      ]);
    }

    if (!(await queryRunner.hasTable('wishlist_table'))) {
      await queryRunner.query(`
        CREATE TABLE wishlist_table (
          id INT NOT NULL AUTO_INCREMENT,
          user_id ${userIdColumnType} NOT NULL,
          product_id ${productIdColumnType} NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_wishlist_user (user_id),
          KEY idx_wishlist_product (product_id),
          CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES user_table(id) ON DELETE CASCADE ON UPDATE NO ACTION,
          CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES product_table(id) ON DELETE CASCADE ON UPDATE NO ACTION
        ) ENGINE=InnoDB
      `);
    } else {
      await this.ensureInnoDb(queryRunner, 'wishlist_table');
      await this.assertColumns(queryRunner, 'wishlist_table', [
        'id',
        'user_id',
        'product_id',
        'created_at',
      ]);
    }
  }

  private async ensureOrderTable(
    queryRunner: QueryRunner,
    userIdColumnType: string,
  ): Promise<void> {
    if (await queryRunner.hasTable('order_table')) {
      await this.ensureInnoDb(queryRunner, 'order_table');
      await this.assertColumns(queryRunner, 'order_table', [
        'id',
        'order_number',
        'user_id',
        'customer_full_name',
        'customer_email',
        'customer_phone',
        'address',
        'city',
        'state_province',
        'postal_code',
        'country',
        'subtotal',
        'delivery_charge',
        'discount',
        'total',
        'currency',
        'status',
        'stock_restored',
        'created_at',
        'updated_at',
      ]);
      return;
    }

    await queryRunner.query(`
      CREATE TABLE order_table (
        id INT NOT NULL AUTO_INCREMENT,
        order_number VARCHAR(32) NULL,
        user_id ${userIdColumnType} NULL,
        customer_full_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(150) NOT NULL,
        customer_phone VARCHAR(30) NOT NULL,
        address VARCHAR(255) NOT NULL,
        city VARCHAR(80) NOT NULL,
        state_province VARCHAR(80) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        country VARCHAR(80) NOT NULL DEFAULT 'Pakistan',
        notes TEXT NULL,
        subtotal DECIMAL(12,2) NOT NULL,
        delivery_charge DECIMAL(12,2) NOT NULL DEFAULT 0,
        discount DECIMAL(12,2) NOT NULL DEFAULT 0,
        total DECIMAL(12,2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'PKR',
        status ENUM('Pending','Confirmed','Processing','Dispatched','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
        stock_restored TINYINT NOT NULL DEFAULT 0,
        created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uq_order_number (order_number),
        KEY idx_order_user (user_id),
        KEY idx_order_customer_email (customer_email),
        KEY idx_order_customer_phone (customer_phone),
        KEY idx_order_status_created (status, created_at),
        CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES user_table(id) ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  private async ensureOrderItemTable(
    queryRunner: QueryRunner,
    productIdColumnType: string,
  ): Promise<void> {
    if (await queryRunner.hasTable('order_item_table')) {
      await this.ensureInnoDb(queryRunner, 'order_item_table');
      return;
    }

    await queryRunner.query(`
      CREATE TABLE order_item_table (
        id INT NOT NULL AUTO_INCREMENT,
        order_id INT NOT NULL,
        product_id ${productIdColumnType} NULL,
        product_id_snapshot ${productIdColumnType} NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_image VARCHAR(500) NULL,
        unit_price DECIMAL(12,2) NOT NULL,
        quantity INT NOT NULL,
        line_total DECIMAL(12,2) NOT NULL,
        PRIMARY KEY (id),
        KEY idx_order_item_order (order_id),
        KEY idx_order_item_product (product_id),
        CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES order_table(id) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES product_table(id) ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  private async ensurePaymentTable(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('payment_table')) {
      await this.ensureInnoDb(queryRunner, 'payment_table');
      return;
    }

    await queryRunner.query(`
      CREATE TABLE payment_table (
        id INT NOT NULL AUTO_INCREMENT,
        order_id INT NOT NULL,
        provider VARCHAR(30) NOT NULL DEFAULT 'stripe',
        payment_intent_id VARCHAR(255) NOT NULL,
        charge_id VARCHAR(255) NULL,
        status ENUM('Pending','Succeeded','Failed','Refunded') NOT NULL DEFAULT 'Pending',
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'PKR',
        payment_method_type VARCHAR(50) NULL,
        last_error VARCHAR(500) NULL,
        paid_at TIMESTAMP NULL,
        created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uq_payment_order (order_id),
        UNIQUE KEY uq_payment_intent (payment_intent_id),
        CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES order_table(id) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  private async ensureShipmentTable(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('shipment_table')) {
      await this.ensureInnoDb(queryRunner, 'shipment_table');
      return;
    }

    await queryRunner.query(`
      CREATE TABLE shipment_table (
        id INT NOT NULL AUTO_INCREMENT,
        order_id INT NOT NULL,
        address VARCHAR(255) NOT NULL,
        city VARCHAR(80) NOT NULL,
        state VARCHAR(80) NOT NULL,
        country VARCHAR(80) NOT NULL,
        zip VARCHAR(20) NOT NULL,
        status ENUM('Pending','Confirmed','Processing','Dispatched','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
        estimated_delivery_at TIMESTAMP NULL,
        dispatched_at TIMESTAMP NULL,
        delivered_at TIMESTAMP NULL,
        created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uq_shipment_order (order_id),
        CONSTRAINT fk_shipment_order FOREIGN KEY (order_id) REFERENCES order_table(id) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  private async ensureCheckoutSessionTable(
    queryRunner: QueryRunner,
  ): Promise<void> {
    if (await queryRunner.hasTable('checkout_session_table')) {
      await this.ensureInnoDb(queryRunner, 'checkout_session_table');
      return;
    }

    await queryRunner.query(`
      CREATE TABLE checkout_session_table (
        id VARCHAR(36) NOT NULL,
        checkout_reference VARCHAR(64) NOT NULL,
        payment_intent_id VARCHAR(255) NULL,
        customer JSON NOT NULL,
        items JSON NOT NULL,
        subtotal DECIMAL(12,2) NOT NULL,
        delivery_charge DECIMAL(12,2) NOT NULL DEFAULT 0,
        discount DECIMAL(12,2) NOT NULL DEFAULT 0,
        total DECIMAL(12,2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'PKR',
        consumed TINYINT NOT NULL DEFAULT 0,
        stock_released TINYINT NOT NULL DEFAULT 0,
        order_id INT NULL,
        expires_at TIMESTAMP NOT NULL,
        consumed_at TIMESTAMP NULL,
        stock_released_at TIMESTAMP NULL,
        created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uq_checkout_reference (checkout_reference),
        UNIQUE KEY uq_checkout_payment_intent (payment_intent_id),
        KEY idx_checkout_expiry (consumed, stock_released, expires_at)
      ) ENGINE=InnoDB
    `);
  }

  private async archiveLegacyTable(
    queryRunner: QueryRunner,
    tableName: string,
    newColumn: string,
  ): Promise<void> {
    if (!(await queryRunner.hasTable(tableName))) {
      return;
    }

    const table = await queryRunner.getTable(tableName);
    if (table?.findColumnByName(newColumn)) {
      return;
    }

    const legacyName = await this.nextAvailableLegacyName(
      queryRunner,
      tableName,
    );
    await queryRunner.renameTable(tableName, legacyName);
  }

  private async restoreLegacyTable(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<void> {
    if (await queryRunner.hasTable(tableName)) {
      return;
    }

    const legacyName = await this.findExistingTableName(queryRunner, [
      `legacy_${tableName}_batch1`,
    ]);

    if (legacyName) {
      await queryRunner.renameTable(legacyName, tableName);
    }
  }

  private async nextAvailableLegacyName(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<string> {
    const baseName = `legacy_${tableName}_batch1`;
    if (!(await queryRunner.hasTable(baseName))) {
      return baseName;
    }

    for (let suffix = 2; suffix <= 100; suffix += 1) {
      const candidate = `${baseName}_${suffix}`;
      if (!(await queryRunner.hasTable(candidate))) {
        return candidate;
      }
    }

    throw new Error(
      `Unable to allocate a legacy backup name for ${tableName}.`,
    );
  }

  private async findExistingTableName(
    queryRunner: QueryRunner,
    candidates: string[],
  ): Promise<string | null> {
    for (const candidate of candidates) {
      const rows = (await queryRunner.query(
        `
          SELECT TABLE_NAME AS tableName
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = DATABASE()
            AND LOWER(TABLE_NAME) = LOWER(?)
          LIMIT 1
        `,
        [candidate],
      )) as ExistingTableRow[];

      if (rows[0]?.tableName) {
        return rows[0].tableName;
      }
    }

    return null;
  }

  private async assertColumns(
    queryRunner: QueryRunner,
    tableName: string,
    expectedColumns: string[],
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table) {
      throw new Error(`Required table ${tableName} could not be loaded.`);
    }

    const existingColumns = new Set(table.columns.map((column) => column.name));
    const missingColumns = expectedColumns.filter(
      (column) => !existingColumns.has(column),
    );

    if (missingColumns.length > 0) {
      throw new Error(
        `Table ${tableName} is incompatible with the current application. Missing columns: ${missingColumns.join(', ')}.`,
      );
    }
  }

  private async ensureInnoDb(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<void> {
    if (!(await queryRunner.hasTable(tableName))) {
      throw new Error(
        `Required table ${tableName} does not exist in database ${String(queryRunner.connection.options.database ?? 'configured database')}.`,
      );
    }

    const rows = (await queryRunner.query(
      `
        SELECT ENGINE AS engine
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
        LIMIT 1
      `,
      [tableName],
    )) as TableEngineRow[];

    const engine = rows[0]?.engine;
    if (!engine) {
      throw new Error(
        `Unable to determine the storage engine for ${tableName}.`,
      );
    }

    if (engine.toLowerCase() !== 'innodb') {
      await queryRunner.query(
        `ALTER TABLE ${this.quoteIdentifier(tableName)} ENGINE=InnoDB`,
      );
    }
  }

  private async getReferencedColumnDefinition(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<string> {
    const rows = (await queryRunner.query(
      `
        SELECT
          COLUMN_TYPE AS columnType,
          CHARACTER_SET_NAME AS characterSetName,
          COLLATION_NAME AS collationName
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
        LIMIT 1
      `,
      [tableName, columnName],
    )) as ColumnMetadataRow[];

    const column = rows[0];
    if (!column) {
      throw new Error(
        `Required column ${tableName}.${columnName} does not exist in database ${String(queryRunner.connection.options.database ?? 'configured database')}.`,
      );
    }

    const columnType = column.columnType.trim();
    const supportedIdType =
      /^(tinyint|smallint|mediumint|int|integer|bigint)(\(\d+\))?( unsigned)?$/i;
    if (!supportedIdType.test(columnType)) {
      throw new Error(
        `Unsupported foreign-key type ${columnType} on ${tableName}.${columnName}.`,
      );
    }

    let definition = columnType;

    if (column.characterSetName) {
      definition += ` CHARACTER SET ${this.validateSqlName(column.characterSetName)}`;
    }

    if (column.collationName) {
      definition += ` COLLATE ${this.validateSqlName(column.collationName)}`;
    }

    return definition;
  }

  private quoteIdentifier(identifier: string): string {
    return `\`${this.validateSqlName(identifier)}\``;
  }

  private validateSqlName(value: string): string {
    if (!/^[A-Za-z0-9_]+$/.test(value)) {
      throw new Error(`Unsafe SQL identifier: ${value}`);
    }
    return value;
  }
}
