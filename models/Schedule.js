const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Class = require('./Class');
const Siswa = require('./Siswa');
const Tentor = require('./Tentor');

class Schedule extends Model {
    static async updateTentorEarnings(scheduleId) {
        try {
            const schedule = await this.findByPk(scheduleId, {
                include: [
                    { model: Siswa, as: 'siswa' },
                    { model: Tentor, as: 'tentor' }
                ]
            });

            if (schedule && schedule.status === 'completed') {
                const fee = schedule.siswa.fee;
                await schedule.tentor.increment('earnings', { by: fee });
                await schedule.tentor.increment('completedSessions');
                await schedule.tentor.decrement('pendingEarnings', { by: fee });
            }
        } catch (error) {
            console.error('Error updating tentor earnings:', error);
        }
    }
}

Schedule.init({
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  timeStart: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  timeEnd: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  tentorId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'tentors',
      key: 'id',
    },
  },
  siswaId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'siswas',
      key: 'id',
    },
  },
  mataPelajaran: {
    type: DataTypes.ENUM(
      'MTK', 'IPA', 'IPAS', 'KIMIA', 'FISIKA', 'BIOLOGI', 
      'BINDO', 'BING', 'IPS', 'PPKN', 'PAI', 
      'PBM', 'PPU', 'PU', 'PK', 'LBI', 'LBE', 'PM', 'English', 'Sosiologi', 'Ekonomi', 'Geografi', 'Sejarah', 'TIU', 'TWK', 'TKP', 'TIK'
    ),
    allowNull: false,
  },
  materiYangDiajarkan: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  attendanceCode: {
    type: DataTypes.STRING(6),
    allowNull: true,
    unique: true,
  },
  isAttendanceMarked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'canceled'),
    defaultValue: 'scheduled',
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('individual', 'class'),
    defaultValue: 'individual',
  },
  emailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
}, {
  sequelize,
  modelName: 'Schedule',
  tableName: 'schedules',
  timestamps: true,
});

Schedule.belongsTo(Class, {
    foreignKey: 'classId',
    as: 'class'
});

Schedule.beforeCreate(async (schedule, options) => {
    try {
        if (schedule.status === 'scheduled') {
            const tentor = await Tentor.findByPk(schedule.tentorId);
            if (tentor) {
                let fee = 0;

                if (schedule.type === 'individual' && schedule.siswaId) {
                    const siswa = await Siswa.findByPk(schedule.siswaId);
                    if (siswa) {
                        fee = siswa.fee;
                    }
                } else if (schedule.type === 'class' && schedule.classId) {
                    const classData = await Class.findByPk(schedule.classId);
                    if (classData) {
                        fee = classData.fee; // Use class fee directly without multiplication
                    }
                }

                if (fee > 0) {
                    await tentor.increment('pendingEarnings', { by: fee });
                }
            }
        }

        // Generate unique 6-digit code
        const generateCode = () => {
            return Math.floor(100000 + Math.random() * 900000).toString();
        };

        let code = generateCode();
        let isUnique = false;

        // Keep generating until we get a unique code
        while (!isUnique) {
            const existingSchedule = await Schedule.findOne({ where: { attendanceCode: code } });
            if (!existingSchedule) {
                isUnique = true;
            } else {
                code = generateCode();
            }
        }

        schedule.attendanceCode = code;
    } catch (error) {
        console.error('Error updating pending earnings:', error);
    }
});

Schedule.beforeUpdate(async (schedule, options) => {
    try {
        if (schedule.changed('status')) {
            const oldStatus = schedule.previous('status');
            const newStatus = schedule.status;
            
            const tentor = await Tentor.findByPk(schedule.tentorId);
            if (!tentor) return;

            let fee = 0;

            // Calculate fee based on schedule type
            if (schedule.type === 'individual' && schedule.siswaId) {
                const siswa = await Siswa.findByPk(schedule.siswaId);
                if (siswa) {
                    fee = siswa.fee;
                }
            } else if (schedule.type === 'class' && schedule.classId) {
                const classData = await Class.findByPk(schedule.classId);
                if (classData) {
                    fee = classData.fee;
                }
            }

            if (fee > 0) {
                // If status changes to completed
                if (oldStatus === 'scheduled' && newStatus === 'completed') {
                    await tentor.increment('earnings', { by: fee });
                    await tentor.decrement('pendingEarnings', { by: fee });
                    await tentor.increment('completedSessions');
                }
                // If status changes from completed back to scheduled
                else if (oldStatus === 'completed' && newStatus === 'scheduled') {
                    await tentor.decrement('earnings', { by: fee });
                    await tentor.increment('pendingEarnings', { by: fee });
                    await tentor.decrement('completedSessions');
                }
                // If status changes to canceled
                else if (newStatus === 'canceled') {
                    if (oldStatus === 'scheduled') {
                        await tentor.decrement('pendingEarnings', { by: fee });
                    } else if (oldStatus === 'completed') {
                        await tentor.decrement('earnings', { by: fee });
                        await tentor.decrement('completedSessions');
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error updating tentor earnings:', error);
    }
});

module.exports = Schedule; 