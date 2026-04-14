import knex from 'knex';

const db = knex({
  client: 'pg',
  connection: {
    host: 'aws-1-us-east-2.pooler.supabase.com',
    port: 5432,
    user: 'postgres.prhtpzqtpkriksdmeorj',
    password: 'Baoan0902727331',
    database: 'postgres',
    pool: { min: 0, max: 20 },
    ssl: { rejectUnauthorized: false }
  }
});

export default db;