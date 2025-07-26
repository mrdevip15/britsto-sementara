const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Update the path if your sequelize instance is in a different directory
const ContentSoal =require('./ContentSoal')
class Mapel extends Model {}

Mapel.init(
  {
    kategori: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mapel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    kodekategori: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tanggalMulai: {
      type: DataTypes.DATE, // Use DATE for proper date handling
      allowNull: false,
    },
    tanggalBerakhir: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    prasyarat: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    durasi: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize, // Pass the Sequelize instance
    modelName: 'Mapel',
    tableName: 'mapel',
    timestamps: false, // Disable timestamps if not needed
  }
);

// Define associations
Mapel.hasMany(ContentSoal, {
  foreignKey: 'mapelId',
  as: 'soals', // Alias for the relationship
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

ContentSoal.belongsTo(Mapel, {
  foreignKey: 'mapelId',
  as: 'mapel', // Alias for the reverse relationship
});
module.exports = Mapel;
