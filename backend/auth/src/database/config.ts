import { DataSource } from 'typeorm';
import { User } from '../models/user';
import { Role } from '../models/role';
import { Organization } from '../models/organization';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://app_user:app_password@localhost:5432/modular_db',
  synchronize: process.env.NODE_ENV !== 'production', // Use migrations in production
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Role, Organization],
  migrations: [],
  subscribers: [],
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('PostgreSQL database connected (TypeORM).');
  } catch (error) {
    console.error('Database connection failed', error);
    process.exit(1);
  }
};
