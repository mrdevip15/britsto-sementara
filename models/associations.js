const Class = require('./Class');
const Siswa = require('./Siswa');
const Schedule = require('./Schedule');
const Tentor = require('./Tentor');

// Class associations
Class.hasMany(Schedule, {
    foreignKey: 'classId'
});
Schedule.belongsTo(Class, {
    foreignKey: 'classId'
});

// Define associations
Tentor.hasMany(Schedule, {
  foreignKey: 'tentorId',
  as: 'sessions'
});

Siswa.hasMany(Schedule, {
  foreignKey: 'siswaId',
  as: 'sessions',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Schedule.belongsTo(Tentor, {
  foreignKey: 'tentorId',
  as: 'tentor'
});

Schedule.belongsTo(Siswa, {
  foreignKey: 'siswaId',
  as: 'siswa',
});

// Add this association
Class.belongsToMany(Siswa, { 
    through: 'class_students',
    foreignKey: 'classId',
    otherKey: 'siswaId'
});

Siswa.belongsToMany(Class, { 
    through: 'class_students',
    foreignKey: 'siswaId',
    otherKey: 'classId'
});

module.exports = {
  Tentor,
  Siswa,
  Schedule,
  Class,
}; 