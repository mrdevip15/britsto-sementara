const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Assuming you have a Sequelize instance configured

const Token = sequelize.define('Token', {
  namaToken: {
    type: DataTypes.STRING,
    allowNull: false, // Optional: set to true if you want this field to be optional
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  kuota: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  maxSubtest: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 7
  },
  kategori: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  owner: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userRegistered: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [], // Default to an empty array
  },
}, {
  tableName: 'tokens', // Optional: Specify the table name
  timestamps: false, // Optional: true if createdAt and updatedAt timestamps are needed
});

module.exports = Token;
