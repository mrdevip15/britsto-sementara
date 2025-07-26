const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class ContentSoal extends Model {}

ContentSoal.init(
  {
    no: DataTypes.STRING,
    content: DataTypes.TEXT,
    a: DataTypes.TEXT,
    b: DataTypes.TEXT,
    c: DataTypes.TEXT,
    d: DataTypes.TEXT,
    e: DataTypes.TEXT,
    tipeSoal: DataTypes.STRING,
    answer: DataTypes.STRING,
    materi: DataTypes.STRING,
    mapelId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'mapel', // This must match the table name of Mapel
        key: 'id',
      },
    },
    pembahasan: DataTypes.TEXT,
  },
  {
    sequelize, // Pass the Sequelize instance here
    modelName: 'ContentSoal',
    tableName: 'content_soal',
    timestamps: false,
  }
);


module.exports = ContentSoal;
