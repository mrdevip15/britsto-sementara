const { Pool } = require('pg');

// Create a new pool instance
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'BritsEdu_development',
    password: 'topsecret',
    port: 5432,  // default port for PostgreSQL
  });

module.exports = pool;
