import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pgPool = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgresql://app_user:app_password@localhost:5432/modular_db',
  max: 20
});

export class VersioningService {
  async initSchema() {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS layout_snapshots (
        id SERIAL PRIMARY KEY,
        layout_id VARCHAR(255) NOT NULL,
        version INTEGER NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255)
      );
      CREATE INDEX IF NOT EXISTS idx_layout_snapshots_layout_id ON layout_snapshots(layout_id);
    `);
  }

  async saveSnapshot(layoutId: string, version: number, data: any, userId?: string) {
    const query = `
      INSERT INTO layout_snapshots (layout_id, version, data, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pgPool.query(query, [layoutId, version, JSON.stringify(data), userId]);
    return result.rows[0];
  }

  async getSnapshot(layoutId: string, version: number) {
    const query = `
      SELECT * FROM layout_snapshots 
      WHERE layout_id = $1 AND version = $2
      LIMIT 1
    `;
    const result = await pgPool.query(query, [layoutId, version]);
    return result.rows[0] || null;
  }

  async getLatestSnapshot(layoutId: string) {
    const query = `
      SELECT * FROM layout_snapshots 
      WHERE layout_id = $1
      ORDER BY version DESC
      LIMIT 1
    `;
    const result = await pgPool.query(query, [layoutId]);
    return result.rows[0] || null;
  }
}

export const versioningService = new VersioningService();
