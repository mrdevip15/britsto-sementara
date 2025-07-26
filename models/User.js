const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Assuming you have a Sequelize instance configured
const Token = require('./Token');
class User extends Model {}

User.init({
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nama_ortu: DataTypes.STRING,
  no_hp_ortu: DataTypes.STRING,
  nama: DataTypes.STRING,
  asal_sekolah: DataTypes.STRING,
  paket: DataTypes.STRING,
  jenjang: DataTypes.STRING,
  program: DataTypes.STRING,
  phone: DataTypes.STRING,
  disqualifiedExams : {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [], // Default to an empty array
  },
  tokens: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [], // Default to an empty array
  },
  answers: {
    type: DataTypes.JSONB, // Use JSONB for efficient storage and querying
    allowNull: true,
    defaultValue: [], // Initialize with an empty array
  },
  examTaken : {
    type: DataTypes.JSONB, // Use JSONB for efficient storage and querying
    allowNull: true,
    defaultValue: [], // Initialize with an empty array
  },
  examCompleted : {
    type: DataTypes.JSONB, // Use JSONB for efficient storage and querying
    allowNull: true,
    defaultValue: [], // Initialize with an empty array
  },
  activeSessionId: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  createdAt: DataTypes.DATE,
  isMember: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false, // Default to false indicating not a member
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: false,
});
module.exports = User;
