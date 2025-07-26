// config/sequelize.js

const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load environment variables from .env file

const sequelize = new Sequelize(
  process.env.NODE_ENV === 'production' ? process.env.PROD_DB_NAME : process.env.DB_NAME,
  process.env.NODE_ENV === 'production' ? process.env.PROD_DB_USERNAME : process.env.DB_USERNAME,
  process.env.NODE_ENV === 'production' ? process.env.PROD_DB_PASSWORD : process.env.DB_PASSWORD,
  {
    host: process.env.NODE_ENV === 'production' ? process.env.PROD_DB_HOST : process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.NODE_ENV === 'production' ? process.env.PROD_DB_PORT : process.env.DB_PORT,
    dialectOptions: {
      supportBigNumbers: true,
      json: true
    },
  }
);

module.exports = sequelize;
