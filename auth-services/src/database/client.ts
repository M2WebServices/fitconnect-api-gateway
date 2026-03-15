import { Pool, type PoolConfig } from "pg";
import { env } from "../config/env";

interface UserRecord {
  id: string;
  email: string;
  pseudo: string;
  passwordHash: string;
}

type FindUniqueArgs = {
  where: {
    id?: string;
    email?: string;
    pseudo?: string;
  };
};

type CreateArgs = {
  data: UserRecord;
};

let pool: Pool | null = null;

const createPoolConfig = (): PoolConfig => {
  if (env.databaseUrl) {
    return {
      connectionString: env.databaseUrl,
      ...(env.databaseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    };
  }

  return {
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName,
    ...(env.databaseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  };
};

const getPool = (): Pool => {
  if (!pool) {
    throw new Error("Auth database is not initialized");
  }

  return pool;
};

const mapUser = (row: {
  id: string;
  email: string;
  pseudo: string;
  password_hash: string;
}): UserRecord => ({
  id: row.id,
  email: row.email,
  pseudo: row.pseudo,
  passwordHash: row.password_hash,
});

const userRepository = {
  async findUnique(args: FindUniqueArgs): Promise<UserRecord | null> {
    const { id, email, pseudo } = args.where;

    if (!id && !email && !pseudo) {
      return null;
    }

    const client = getPool();

    if (id) {
      const result = await client.query(
        `SELECT id, email, pseudo, password_hash FROM auth_users WHERE id = $1 LIMIT 1`,
        [id]
      );
      return result.rows[0] ? mapUser(result.rows[0]) : null;
    }

    if (email) {
      const result = await client.query(
        `SELECT id, email, pseudo, password_hash FROM auth_users WHERE email = $1 LIMIT 1`,
        [email]
      );
      return result.rows[0] ? mapUser(result.rows[0]) : null;
    }

    const result = await client.query(
      `SELECT id, email, pseudo, password_hash FROM auth_users WHERE pseudo = $1 LIMIT 1`,
      [pseudo]
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  },

  async create(args: CreateArgs): Promise<UserRecord> {
    const user = args.data;
    const client = getPool();

    const result = await client.query(
      `
      INSERT INTO auth_users (id, email, pseudo, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, pseudo, password_hash
      `,
      [user.id, user.email, user.pseudo, user.passwordHash]
    );

    return mapUser(result.rows[0]);
  },
};

const db = {
  user: userRepository,
};

export async function initializeDatabase() {
  if (pool) {
    return db;
  }

  const nextPool = new Pool(createPoolConfig());
  await nextPool.query("SELECT 1");
  await nextPool.query(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      pseudo TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  pool = nextPool;
  return db;
}

export function getPrismaClient() {
  return db;
}

export async function disconnectDatabase() {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
}
