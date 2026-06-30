import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Auth } from './src/auth/auth.entity';
import { Role } from './src/role/role.entity';

config();

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'ecommerce',
  entities: [Auth, Role],
  synchronize: false,
});

async function seedAdmin() {
  await dataSource.initialize();
  const authRepo = dataSource.getRepository(Auth);
  const roleRepo = dataSource.getRepository(Role);

  let adminRole = await roleRepo.findOne({ where: { name: 'admin' } });
  if (!adminRole) {
    adminRole = await roleRepo.save(
      roleRepo.create({
        name: 'admin',
        description: 'Seeded AliBazaar administrator',
        isSystem: true,
        isActive: true,
      }),
    );
  }

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const existing = await authRepo.findOne({
    where: [{ role: 'admin' }, { username: adminUsername }],
  });
  if (existing) {
    console.log('Admin already exists');
    await dataSource.destroy();
    return;
  }

  await authRepo.save(
    authRepo.create({
      username: adminUsername,
      password: await bcrypt.hash(
        process.env.ADMIN_PASSWORD || 'Admin@123',
        12,
      ),
      role: adminRole.name,
      isActive: true,
    }),
  );
  console.log('Admin user created successfully. Change the default password.');
  await dataSource.destroy();
}

void seedAdmin().catch(async (error) => {
  console.error(error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exitCode = 1;
});
