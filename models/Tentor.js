const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class Tentor extends Model {}

Tentor.init({
  nama: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  namaLengkap: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Full legal name for administrative purposes'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  noHp: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  noRekening: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  schedules: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [], // Store recurring or preferred schedules
  },
  mataPelajaran: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
    comment: 'List of subjects that the tentor can teach'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  earnings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completedSessions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  pendingEarnings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Custom color for the tentor in UI elements',
    validate: {
      isHexColor: function(value) {
        if (value && !/^#[0-9A-F]{6}$/i.test(value)) {
          throw new Error('Color must be a valid hex color code (e.g. #FF5733)');
        }
      }
    }
  },
}, {
  sequelize,
  modelName: 'Tentor',
  tableName: 'tentors',
  timestamps: true,
});

module.exports = Tentor; 