const { Pool } = require('pg');
const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

const pool = new Pool({
  host: PGHOST,
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
  port: 5432,
  ssl: { require: true }
});

// Test connection
pool.query('SELECT NOW()')
  .then(() => console.log('Database connected'))
  .catch(err => console.error('Database error', err));

module.exports = pool;