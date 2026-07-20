const { Pool , types } = require('pg');
const config = require('../config');

types.setTypeParser(1082, (val) => val); // DATE columns come back as raw strings, no timezone shifting

const pool = new Pool({ connectionString: config.databaseUrl });

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
  process.exit(1);
});

module.exports = pool;