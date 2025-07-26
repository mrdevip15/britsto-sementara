const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class Session extends Model {}

Session.init(
  {
    sid: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      collate: 'default', // Adjust if necessary
    },
    sess: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    expire: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize, // Pass the Sequelize instance here
    modelName: 'Session',
    tableName: 'session',
    timestamps: false,
  }
);

module.exports = Session;
