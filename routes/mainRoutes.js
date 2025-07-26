// routes/authRoutes.js
const express = require('express');
const { home, contacts, snbt, tosnbt, signup, signin, privacyPolicy } = require('../controllers/mainController');
const redirectIfAuthenticated = require('../middleware/redirectIfAuthenticated');
const router = express.Router();
const { Schedule, Tentor, Siswa, Class } = require('../models/associations');
const { Op } = require('sequelize');
const colorManager = require('../utilities/colorManager');

router.get('/', home);
router.get('/contacts', contacts);
// add router also for snbt and to snbt
router.get('/snbt', snbt);
router.get('/to-snbt', tosnbt);
router.get('/daftar',redirectIfAuthenticated, signup);
router.get('/login', redirectIfAuthenticated ,signin);
router.get('/privacy-policy', privacyPolicy);
router.get('/print', (req, res) => {
    res.render('print-server');
});
router.get('/mrdevip-private-msg-server', (req, res) => {
    res.render('mrdevip-private-msg-server');
});

// Add this route for the attendance page
router.get('/daftar-hadir', async (req, res) => {
    try {
        const { month, year } = req.query;
        
        // Get current date
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        // Use current month and year if no filter is provided
        const selectedMonth = month ? parseInt(month) : currentMonth;
        const selectedYear = year ? parseInt(year) : currentYear;
        
        // Create date filter for the calendar view - show 3 months before and after
        const startDate = new Date(selectedYear, selectedMonth - 4, 1); // 3 months before
        const endDate = new Date(selectedYear, selectedMonth + 3, 0); // 3 months after
        
        const schedules = await Schedule.findAll({
            where: {
                date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            include: [
                { model: Tentor, as: 'tentor' },
                { model: Siswa, as: 'siswa' },
                { model: Class, as: 'class' }
            ],
            order: [['date', 'DESC'], ['timeStart', 'ASC']]
        });

        // Process schedules to include colors
        const processedSchedules = schedules.map(schedule => {
            const rawSchedule = schedule.get({ plain: true });
            let colors;
            
            if (rawSchedule.isAttendanceMarked) {
                colors = {
                    backgroundColor: '#2ecc71',
                    borderColor: '#27ae60'
                };
            } else if (rawSchedule.status === 'canceled') {
                colors = {
                    backgroundColor: '#e74c3c',
                    borderColor: '#c0392b'
                };
            } else {
                const tentorColor = colorManager.getTentorColor(rawSchedule.tentor);
                colors = {
                    backgroundColor: tentorColor,
                    borderColor: tentorColor
                };
            }

            return {
                ...rawSchedule,
                colors
            };
        });

        res.render('dashboard/admin/daftar-hadir', {
            hostname: process.env.HOSTNAME || 'http://localhost:3972/',
            schedules: processedSchedules,
            currentMonth,
            currentYear,
            selectedMonth,
            selectedYear
        });
    } catch (error) {
        console.error('Error loading attendance form:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Add new route for code verification
router.get('/daftar-hadir/verify/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const schedule = await Schedule.findOne({
            where: { attendanceCode: code },
            include: [
                { model: Tentor, as: 'tentor' },
                { model: Siswa, as: 'siswa' },
                { model: Class, as: 'class' }
            ]
        });

        if (!schedule) {
            return res.status(404).json({ error: 'Kode tidak valid' });
        }

        if (schedule.isAttendanceMarked) {
            return res.status(400).json({ error: 'Daftar hadir sudah diisi' });
        }

        res.json({ success: true, schedule });
    } catch (error) {
        console.error('Error verifying code:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Handle attendance submission
router.post('/daftar-hadir/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const { materiYangDiajarkan, updatedMataPelajaran } = req.body;

        const schedule = await Schedule.findOne({
            where: { attendanceCode: code },
            include: [
                { model: Tentor, as: 'tentor' },
                { model: Siswa, as: 'siswa' },
                { model: Class, as: 'class' }
            ]
        });

        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Kode tidak valid' });
        }

        if (schedule.isAttendanceMarked) {
            return res.status(400).json({ success: false, message: 'Daftar hadir sudah diisi' });
        }

        // Update schedule with attendance, material, and potentially updated mata pelajaran
        const updateData = {
            isAttendanceMarked: true,
            materiYangDiajarkan,
            status: 'completed'
        };

        // If mata pelajaran was updated, include it in the update
        if (updatedMataPelajaran && updatedMataPelajaran !== schedule.mataPelajaran) {
            updateData.mataPelajaran = updatedMataPelajaran;
        }

        await schedule.update(updateData);

        // Deduct kuota for individual sessions
        if (schedule.type === 'individual' && schedule.siswa) {
            await schedule.siswa.decrement('sisaKuotaBelajar');
            await schedule.siswa.save();
        }
        // Deduct kuota for class sessions
        else if (schedule.type === 'class' && schedule.class) {
            const classStudents = await schedule.class.getSiswas();
            console.log(`Marking attendance for class: ${schedule.class.name}`);
            console.log(`Number of students in class: ${classStudents.length}`);
            
            for (const student of classStudents) {
                console.log(`Reducing kuota for student: ${student.nama}, Current kuota: ${student.sisaKuotaBelajar}`);
                await student.decrement('sisaKuotaBelajar');
                await student.save();
                console.log(`After reduction, student ${student.nama} kuota: ${student.sisaKuotaBelajar}`);
            }
        }

        res.json({
            success: true,
            message: 'Daftar hadir berhasil diisi',
            schedule
        });

    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ success: false, message: 'Gagal mengisi daftar hadir' });
    }
});

module.exports = router;
