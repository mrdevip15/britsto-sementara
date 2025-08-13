const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const db = {};

// Use the unified sequelize instance
const sequelize = require('../config/sequelize');

fs.readdirSync(__dirname)
  .filter((file) => file !== basename && file.slice(-3) === '.js')
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db); // Initialize all associations
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
