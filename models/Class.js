const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Siswa = require('./Siswa');

class Class extends Model {
    // Method to add a student to the class
    addStudent(siswaId) {
        const studentIds = this.getDataValue('studentIds') || [];
        if (!studentIds.includes(siswaId)) {
            studentIds.push(siswaId);
            return this.update({ studentIds });
        }
        return this;
    }

    // Method to remove a student from the class
    removeStudent(siswaId) {
        const studentIds = this.getDataValue('studentIds') || [];
        const updatedStudentIds = studentIds.filter(id => id !== siswaId);
        return this.update({ studentIds: updatedStudentIds });
    }

    // New method to get students in the class
    async getSiswas() {
        // If studentIds is an array, find the corresponding students
        const studentIds = this.getDataValue('studentIds') || [];
        
        if (studentIds.length === 0) {
            return [];
        }

        // Find students with matching IDs
        const students = await Siswa.findAll({
            where: { 
                id: studentIds,
                isActive: true 
            }
        });

        return students;
    }
}

Class.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    studentIds: {
        type: DataTypes.JSONB,
        defaultValue: [],
        get() {
            const value = this.getDataValue('studentIds');
            // Ensure we always return an array of numbers
            if (Array.isArray(value)) {
                return value.map(id => Number(id));
            }
            return [];
        },
        set(value) {
            // Ensure we always store an array of numbers
            if (Array.isArray(value)) {
                const processedValue = value.map(id => Number(id));
                this.setDataValue('studentIds', processedValue);
            } else {
                this.setDataValue('studentIds', []);
            }
        }
    },
    fee: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 50000 // Default fee per session for class
    },
    mataPelajaran: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
        comment: 'List of subjects taught in this class'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    sequelize,
    modelName: 'Class',
    tableName: 'classes',
    timestamps: true
});

module.exports = Class; 