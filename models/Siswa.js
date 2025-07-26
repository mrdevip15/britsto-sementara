const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class Siswa extends Model {}

Siswa.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  namaLengkap: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Full legal name for administrative purposes'
  },
  noHp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  noHpOrtu: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  alamat: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  asalSekolah: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  kelas: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tanggalBayarTerakhir: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  sisaKuotaBelajar: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  schedules: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  paymentPeriod: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1_month'
  },
  paymentType: {
    type: DataTypes.ENUM('pre_paid', 'post_paid'),
    allowNull: false,
    defaultValue: 'pre_paid'
  },
  paymentHistory: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of payment objects with amount, date, period, status, additionalSessions, and isLocked fields'
  },
  tingkat: {
    type: DataTypes.ENUM('SD', 'SMP', 'SMA', 'Alumni'),
    allowNull: true
  },
  kurikulum: {
    type: DataTypes.ENUM('K13', 'Merdeka', 'Cambridge', 'Pearson', 'SNBT'),
    allowNull: true
  },
  mataPelajaran: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  fee: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50000 // Default fee per session
  },
}, {
  sequelize,
  modelName: 'Siswa',
  tableName: 'siswas',
  timestamps: true,
});

module.exports = Siswa; 