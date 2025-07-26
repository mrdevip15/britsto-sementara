// routes/userRoutes.js
const express = require('express');
const adminAuth = require('../middleware/adminAuthMiddleware');
const userService = require('../services/userService');
const navAdmin = require('../middleware/navAdmin');
const User = require('../models/User');
const adminData = {
    email:'super-admin@togg.secret',
    nama : 'admin',
    photos : 'https://lh3.googleusercontent.com/a/ACg8ocJjXEBasv0X2PvokXtvLBAxeHQ85aVIcxUBDWsq8cu6OrS9rqs=s48-c'
}
const {
    dashboard,
    deleteUser,
    getAllMapels,
    addPaketSoal,
    addPaketSoalPost,
    deletePaket,
    getContentSoals,
    getInputSoalPage,
    saveSoal,
    deleteSoalHandler,
    getTokenPage,
    addTokenHandler,
    addTokenPage,
    deleteToken,
    adminLogin,
    resetSession,
    getEditPaketSoal,
    updatePaketSoal,
    exportSoal,
    importSoal,
    resetUserExams,
    getDetailedNilai,
    resetUserSession,
    acceptMember,
    cancelMember,
    getNilai,
    getNilaiByOwner,
    pesertaUjian,
    exportUsersCSV,
    exportUsersBasicCSV,
    importUsersCSV
} = require('../controllers/adminController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { Op } = require('sequelize');
const Mapel = require('../models/Mapel');
const ContentSoal = require('../models/ContentSoal');
const mapelService = require('../services/mapelService');
const { Schedule, Tentor, Siswa } = require('../models/associations');
const { generateTimeSlots, mapEventsToIntervals, getTeacherColor } = require('../utilities/scheduleHelper');
const Class = require('../models/Class');
const colorManager = require('../utilities/colorManager');

const Token = require('../models/Token');
const { getTentorSessions } = require('../controllers/adminController');

const nodemailer = require('nodemailer');
const { generateScheduleReminderEmail } = require('../utilities/emailTemplates');

const router = express.Router();

// Apply navAdmin middleware to all admin routes
router.use(navAdmin);

// Redirect root to login
router.get('/', (req, res) => {
    if (req.cookies.adminToken === process.env.ADMIN_SECRET) {
        return res.redirect('/admin/dashboard');
    }
    res.redirect('/admin/login');
});

// Login routes (unprotected)
router.get('/login', (req, res) => {
    if (req.cookies.adminToken === process.env.ADMIN_SECRET) {
        return res.redirect('/admin/dashboard');
    }
    res.render('dashboard/admin/login');
});

router.post('/login', adminLogin); // Use the new adminLogin method

// Protected routes
router.use(adminAuth); // Apply admin authentication to all routes below

// Dashboard and User Management
router.get('/dashboard', dashboard);
router.post('/delete-user/:id', deleteUser); // Changed from GET to POST

// Mapel Management
router.get('/manajemen-soal/daftar-subtest', getAllMapels);
router.get('/manajemen-soal/tambah-paket-soal', addPaketSoal);
router.post('/manajemen-soal/tambah-paket-soal', addPaketSoalPost);
router.get('/manajemen-soal/hapus-subtest/:kodekategori', deletePaket);
router.get('/manajemen-soal/mapel/:kodekategori', getContentSoals);
router.get('/manajemen-soal/mapel/:kodekategori/:no', getInputSoalPage);
router.post('/manajemen-soal/mapel/:kodekategori/:no', saveSoal);
router.delete('/manajemen-soal/mapel/:kodekategori/:no', deleteSoalHandler);
router.get('/manajemen-soal/edit-paket-soal/:kodekategori', getEditPaketSoal);
router.post('/manajemen-soal/edit-paket-soal/:kodekategori', updatePaketSoal);

// Token Management
router.get('/manajemen-token/daftar-token', getTokenPage);
router.get('/manajemen-token/tambah-token', addTokenPage);
router.post('/manajemen-token/tambah-token', addTokenHandler);
router.get('/manajemen-token/hapus-token/:id', deleteToken);

// Reset Session
router.get('/reset-session', (req, res) => {
    // Call the reset session controller function
    resetSession(req, res);
});

// Logout route
router.get('/logout', (req, res) => {
    res.clearCookie('adminToken');
    res.redirect('/admin/login');
});

// Add this route with the other protected routes
router.post('/reset-user-session/:userId', resetUserSession);

// Add these routes
router.get('/exportSoal/:kodekategori', exportSoal);
router.post('/importSoal', upload.single('file'), importSoal);

// Add this route with the other protected routes
router.post('/reset-user-exams/:userId', resetUserExams);

// Add this route with the other protected routes
router.post('/accept-member/:userId', acceptMember);

// Add this route with the other protected routes
router.post('/cancel-member/:userId', cancelMember);

// Add this route with the other protected routes
router.get('/manajemen-soal/nilai/:kodekategori', getNilai);

// Add this route with the other protected routes
router.get('/manajemen-soal/nilai-by-owner/:owner', getNilaiByOwner);

// Add this route with the other protected routes
router.get('/manajemen-soal/nilai-detail/:kodekategori', getDetailedNilai);

// Add this route with the other protected routes
router.get('/manajemen-soal/preview/:kodekategori', async (req, res) => {
    try {
        const { kodekategori } = req.params;
        const mapel = await mapelService.getMapelByKodeKategori(kodekategori);
        const contentSoals = await mapelService.getContentSoalsByKodeKategori(kodekategori);
        if (!mapel) {
            return res.status(404).send('Mapel not found');
        }
        // Sort questions by number
        contentSoals.sort((a, b) => a.no - b.no);

        res.render('dashboard/admin/print-soal', {
            mapel: mapel,
            soals: contentSoals
        });
    } catch (error) {
        console.error('Error loading preview page:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Add these routes with your other protected routes
router.get('/jadwal', adminAuth, async (req, res) => {
    try {
        const { month, year } = req.query;

        // Get current date
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // Months are 0-indexed
        const currentYear = currentDate.getFullYear();

        // Use current month and year if no filter is provided
        const selectedMonth = month ? parseInt(month) : currentMonth;
        const selectedYear = year ? parseInt(year) : currentYear;

        // Create date filter
        const startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0); // Last day of the month

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
            order: [['date', 'ASC'], ['timeStart', 'ASC']]
        });

        // Fetch tentors, siswas, and classes
        const tentors = await Tentor.findAll({ where: { isActive: true } });
        const siswas = await Siswa.findAll({ where: { isActive: true } });
        const classes = await Class.findAll({ where: { isActive: true } });

        res.render('dashboard/admin/master-jadwal', {
            user: adminData,
            schedules,
            tentors,
            siswas,
            classes,
            currentMonth,
            currentYear,
            selectedMonth,
            selectedYear
        });
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/jadwal/tambah', async (req, res) => {
    try {
        const tentors = await Tentor.findAll({ where: { isActive: true } });
        const siswas = await Siswa.findAll({ where: { isActive: true } });
        const classes = await Class.findAll({ 
            where: { isActive: true },
            include: [{
                model: Siswa,
            }]
        });
        
        res.render('dashboard/admin/input-jadwal', {
            user: adminData,
            tentors,
            siswas,
            classes,
            jadwal: null,
            error: req.query.error,
            message: req.query.message
        });
    } catch (error) {
        console.error('Error fetching data for jadwal form:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/jadwal/tambah', async (req, res) => {
    try {
        const { date, timeStart, timeEnd, tentorId, type, siswaId, classId, mataPelajaran } = req.body;

        // Validate sessions based on type
        if (type === 'individual') {
            const siswa = await Siswa.findByPk(siswaId);
            if (!siswa) {
                return req.headers['content-type'] === 'application/json'
                    ? res.status(400).json({ success: false, message: 'Siswa tidak ditemukan' })
                    : res.redirect('/admin/jadwal/tambah?error=Siswa tidak ditemukan');
            }
            if (siswa.sisaKuotaBelajar <= 0) {
                return req.headers['content-type'] === 'application/json'
                    ? res.status(400).json({ success: false, message: 'Siswa tidak memiliki sisa pertemuan' })
                    : res.redirect('/admin/jadwal/tambah?error=Siswa tidak memiliki sisa pertemuan');
            }
        } else if (type === 'class') {
            const kelas = await Class.findByPk(classId);
            
            if (!kelas) {
                return req.headers['content-type'] === 'application/json'
                    ? res.status(400).json({ success: false, message: 'Kelas tidak ditemukan' })
                    : res.redirect('/admin/jadwal/tambah?error=Kelas tidak ditemukan');
            }

            // Check if class has students using studentIds
            if (!kelas.studentIds || kelas.studentIds.length === 0) {
                return req.headers['content-type'] === 'application/json'
                    ? res.status(400).json({ success: false, message: 'Kelas tidak memiliki siswa' })
                    : res.redirect('/admin/jadwal/tambah?error=Kelas tidak memiliki siswa. Silakan tambahkan siswa ke kelas terlebih dahulu.');
            }

            // Check if any student in the class has insufficient sessions
            const students = await Siswa.findAll({
                where: {
                    id: kelas.studentIds
                }
            });

            const insufficientStudents = students.filter(siswa => siswa.sisaKuotaBelajar <= 0);
            if (insufficientStudents.length > 0) {
                const studentNames = insufficientStudents.map(s => s.nama).join(', ');
                return req.headers['content-type'] === 'application/json'
                    ? res.status(400).json({ success: false, message: `Beberapa siswa tidak memiliki sisa pertemuan: ${studentNames}` })
                    : res.redirect(`/admin/jadwal/tambah?error=Beberapa siswa tidak memiliki sisa pertemuan: ${studentNames}`);
            }
        }

        // Create the schedule if validation passes
        const schedule = await Schedule.create({
            date,
            timeStart,
            timeEnd,
            tentorId,
            type,
            siswaId: type === 'individual' ? siswaId : null,
            classId: type === 'class' ? classId : null,
            mataPelajaran,
            status: 'scheduled'
        });

        // Get the tentor name for the title
        const tentor = await Tentor.findByPk(tentorId);
        const studentName = type === 'individual' 
            ? (await Siswa.findByPk(siswaId)).nama 
            : (await Class.findByPk(classId)).name;

        // Prepare the response
        const scheduleResponse = {
            id: schedule.id,
            title: `${tentor.nama} - ${studentName} - ${mataPelajaran}`,
            start: new Date(`${date}T${timeStart}`),
            end: new Date(`${date}T${timeEnd}`),
            extendedProps: {
                tentorId,
                type,
                siswaId: type === 'individual' ? siswaId : null,
                classId: type === 'class' ? classId : null,
                mataPelajaran,
                status: 'scheduled',
                tentorNama: tentor.nama,
                studentInfo: studentName
            }
        };

        // In the route for adding a new schedule, add color assignment
        const backgroundColor = colorManager.getTentorColor(tentor);

        // Include backgroundColor in the response
        return res.json({
            success: true,
            schedule: {
                ...scheduleResponse,
                backgroundColor,
                borderColor: backgroundColor
            }
        });
    } catch (error) {
        console.error('Error creating schedule:', error);
        return req.headers['content-type'] === 'application/json'
            ? res.status(500).json({ success: false, message: 'Gagal menambahkan jadwal', error: error.message })
            : res.redirect('/admin/jadwal/tambah?error=Gagal menambahkan jadwal: ' + error.message);
    }
});

// Add this route for deleting schedules
router.post('/jadwal/delete/:id', async (req, res) => {
    try {
        const schedule = await Schedule.findByPk(req.params.id, {
            include: [
                { model: Tentor, as: 'tentor' },
                { model: Siswa, as: 'siswa' },
                { model: Class, as: 'class' }
            ]
        });
        
        if (!schedule) {
            // Handle both JSON and form post responses
            return req.headers['content-type'] === 'application/json'
                ? res.status(404).json({
                    success: false,
                    message: 'Jadwal tidak ditemukan'
                })
                : res.redirect('/admin/jadwal/preview?error=Jadwal tidak ditemukan');
        }

        // Check if it's a completed schedule
        const isCompleted = schedule.status === 'completed';
        const { isCompletedSchedule, restoreSession } = req.body;

        // Get schedule details for the response
        const scheduleDetails = {
            date: new Date(schedule.date).toLocaleDateString('id-ID'),
            time: `${schedule.timeStart} - ${schedule.timeEnd}`,
            tentor: schedule.tentor?.nama || 'Unknown',
            student: schedule.type === 'class' 
                ? (schedule.Class?.name || 'Unknown Class')
                : (schedule.siswa?.nama || 'Unknown Student'),
            status: schedule.status,
            mataPelajaran: schedule.mataPelajaran
        };

        // If completed schedule but not authorized to delete it
        if (isCompleted && !isCompletedSchedule) {
            return req.headers['content-type'] === 'application/json'
                ? res.status(400).json({
                    success: false,
                    message: 'Jadwal yang sudah selesai memerlukan password untuk dihapus'
                })
                : res.redirect('/admin/jadwal/preview?error=Jadwal yang sudah selesai memerlukan password untuk dihapus');
        }

        // Handle restoration of session quota and earnings
        if (isCompleted && restoreSession) {
            // For individual sessions
            if (schedule.type === 'individual' && schedule.siswa) {
                // Restore session quota to student
                await schedule.siswa.increment('sisaKuotaBelajar');
                await schedule.siswa.save();
                console.log(`Restored 1 session to student ${schedule.siswa.nama}`);
            } 
            // For class sessions
            else if (schedule.type === 'class' && schedule.class) {
                // Get all students in the class
                const classStudents = await schedule.class.getSiswas();
                for (const student of classStudents) {
                    // Restore session quota to each student
                    await student.increment('sisaKuotaBelajar');
                    await student.save();
                    console.log(`Restored 1 session to class student ${student.nama}`);
                }
            }

            // Remove earnings from tentor
            if (schedule.tentor) {
                let fee = 0;

                // Calculate fee based on schedule type
                if (schedule.type === 'individual' && schedule.siswa) {
                    fee = schedule.siswa.fee || 0;
                } else if (schedule.type === 'class' && schedule.class) {
                    fee = schedule.class.fee || 0;
                }

                if (fee > 0) {
                    await schedule.tentor.decrement('earnings', { by: fee });
                    await schedule.tentor.decrement('completedSessions');
                    await schedule.tentor.save();
                    console.log(`Removed fee ${fee} from tentor ${schedule.tentor.nama}`);
                }
            }
        }

        // Delete the schedule
        await schedule.destroy();

        // Respond based on request type
        if (req.headers['content-type'] === 'application/json') {
            return res.json({
                success: true,
                message: isCompleted 
                    ? 'Jadwal selesai berhasil dihapus dan sesi telah dikembalikan' 
                    : 'Jadwal berhasil dihapus',
                details: scheduleDetails
            });
        } else {
            return res.redirect('/admin/jadwal/preview?message=Jadwal berhasil dihapus');
        }

    } catch (error) {
        console.error('Error deleting schedule:', error);
        
        // Respond based on request type
        if (req.headers['content-type'] === 'application/json') {
            return res.status(500).json({
                success: false,
                message: 'Gagal menghapus jadwal',
                error: error.message
            });
        } else {
            return res.redirect('/admin/jadwal/preview?error=Gagal menghapus jadwal');
        }
    }
});

// Tentor Management Routes
router.get('/tentor', adminAuth, async (req, res) => {
    try {
        const { month, year } = req.query;
        
        // Get current date
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        // Use current month and year if no filter is provided
        const selectedMonth = month ? parseInt(month) : currentMonth;
        const selectedYear = year ? parseInt(year) : currentYear;
        
        // Create date filter
        const startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0); // Last day of the month
        
        const dateFilter = {
            date: {
                [Op.between]: [startDate, endDate]
            }
        };

        const tentors = await Tentor.findAll({
            include: [{
                model: Schedule,
                as: 'sessions',
                where: {
                    ...dateFilter,
                    status: {
                        [Op.not]: 'canceled' // Exclude canceled sessions
                    }
                },
                required: false, // Still show tentors even if they have no sessions in the period
                include: [
                    { model: Siswa, as: 'siswa' },
                    { model: Class, as: 'class' }
                ]
            }]
        });

        // Calculate earnings for each tentor
        for (const tentor of tentors) {
            let totalEarnings = 0;
            let pendingEarnings = 0;
            let completedSessions = 0;

            tentor.sessions.forEach(session => {
                if (session.type === 'individual' && session.siswa) {
                    const fee = session.siswa.fee || 0;
                    if (session.status === 'completed') {
                        totalEarnings += fee;
                        completedSessions++;
                    } else if (session.status === 'scheduled') {
                        pendingEarnings += fee;
                    }
                } else if (session.type === 'class' && session.class) {
                    const fee = session.class.fee || 0;
                    if (session.status === 'completed') {
                        totalEarnings += fee;
                        completedSessions++;
                    } else if (session.status === 'scheduled') {
                        pendingEarnings += fee;
                    }
                }
            });

            // Add filtered values to the tentor object for display
            tentor.filteredEarnings = totalEarnings;
            tentor.filteredPendingEarnings = pendingEarnings;
            tentor.filteredCompletedSessions = completedSessions;
        }

        res.render('dashboard/admin/master-tentor', {
            user: adminData,
            tentors: tentors,
            currentMonth,
            currentYear,
            selectedMonth,
            selectedYear
        });
    } catch (error) {
        console.error('Error fetching tentors:', error);
        res.redirect('/admin/dashboard?error=Failed to fetch tentors');
    }
});

router.get('/tentor/tambah', (req, res) => {
  res.render('dashboard/admin/input-tentor', {
    user: adminData,
    tentor: null
  });
});

router.post('/tentor/tambah', async (req, res) => {
  try {
    const { nama, namaLengkap, email, noHp, noRekening, mataPelajaran, color } = req.body;
    await Tentor.create({
      nama,
      namaLengkap,
      email,
      noHp,
      noRekening,
      mataPelajaran: Array.isArray(mataPelajaran) ? mataPelajaran : mataPelajaran ? [mataPelajaran] : [],
      isActive: true,
      color
    });
    res.redirect('/admin/tentor?message=Tentor berhasil ditambahkan');
  } catch (error) {
    console.error('Error creating tentor:', error);
    res.redirect('/admin/tentor/tambah?error=Gagal menambahkan tentor');
  }
});

router.get('/tentor/edit/:id', async (req, res) => {
  try {
    const tentor = await Tentor.findByPk(req.params.id);
    if (!tentor) {
      return res.status(404).send('Tentor not found');
    }
    res.render('dashboard/admin/input-tentor', {
      user: adminData,
      tentor
    });
  } catch (error) {
    console.error('Error fetching tentor:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/tentor/edit/:id', async (req, res) => {
  try {
    const { nama, namaLengkap, email, noHp, noRekening, mataPelajaran, isActive, color } = req.body;
    await Tentor.update({
      nama,
      namaLengkap,
      email,
      noHp,
      noRekening,
      mataPelajaran: Array.isArray(mataPelajaran) ? mataPelajaran : mataPelajaran ? [mataPelajaran] : [],
      isActive: isActive === 'on',
      color
    }, {
      where: { id: req.params.id }
    });
    res.redirect('/admin/tentor?message=Tentor berhasil diupdate');
  } catch (error) {
    console.error('Error updating tentor:', error);
    res.redirect(`/admin/tentor/edit/${req.params.id}?error=Gagal mengupdate tentor`);
  }
});

router.post('/tentor/delete/:id', async (req, res) => {
    try {
        const tentorId = req.params.id;
        
        // Check if tentor has any schedules
        const existingSchedules = await Schedule.findOne({
            where: {
                tentorId: tentorId,
                status: {
                    [Op.not]: 'canceled' // Exclude canceled schedules
                }
            }
        });

        if (existingSchedules) {
            return res.redirect('/admin/tentor?error=Tidak dapat menghapus tentor yang masih memiliki jadwal aktif');
        }

        // If no active schedules, proceed with deletion
        await Tentor.destroy({
            where: { id: tentorId }
        });

        res.redirect('/admin/tentor?message=Tentor berhasil dihapus');
    } catch (error) {
        console.error('Error deleting tentor:', error);
        res.redirect('/admin/tentor?error=Gagal menghapus tentor');
    }
});

// Siswa Management Routes
router.get('/siswa', async (req, res) => {
  try {
    const siswas = await Siswa.findAll();
    res.render('dashboard/admin/master-siswa', {
      user: adminData,
      siswas
    });
  } catch (error) {
    console.error('Error fetching siswas:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/siswa/tambah', (req, res) => {
  res.render('dashboard/admin/input-siswa', {
    user: adminData,
    siswa: null
  });
});

router.post('/siswa/tambah', async (req, res) => {
    try {
        console.log('Received data for tambah siswa:', req.body);
        const { 
            nama, 
            namaLengkap,
            noHp, 
            noHpOrtu, 
            alamat, 
            asalSekolah, 
            kelas, 
            sisaKuotaBelajar,
            paymentType,
            paymentPeriod,
            tingkat,
            kurikulum,
            mataPelajaran,
            fee 
        } = req.body;

        await Siswa.create({
            nama,
            namaLengkap,
            noHp,
            noHpOrtu,
            alamat,
            asalSekolah,
            kelas,
            sisaKuotaBelajar: parseInt(sisaKuotaBelajar),
            paymentType,
            paymentPeriod,
            tingkat,
            kurikulum,
            mataPelajaran: Array.isArray(mataPelajaran) ? mataPelajaran : [mataPelajaran],
            fee: parseInt(fee),
            isActive: true
        });

        res.redirect('/admin/siswa?message=Siswa berhasil ditambahkan');
    } catch (error) {
        console.error('Error creating siswa:', error);
        res.redirect('/admin/siswa/tambah?error=Gagal menambahkan siswa');
    }
});

router.get('/siswa/edit/:id', async (req, res) => {
    try {
        const siswa = await Siswa.findByPk(req.params.id);
        
        if (!siswa) {
            return res.status(404).send('Siswa not found');
        }

        // Get classes where this student is a member
        const classes = await Class.findAll({
            where: {
                studentIds: {
                    [Op.contains]: [siswa.id]
                }
            }
        });

        res.render('dashboard/admin/input-siswa', {
            user: adminData,
            siswa: {
                ...siswa.toJSON(),
                Classes: classes
            }
        });
    } catch (error) {
        console.error('Error fetching siswa:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/siswa/edit/:id', async (req, res) => {
    try {
        console.log('Received data for edit siswa:', req.body);
        const { 
            nama, 
            namaLengkap,
            noHp, 
            noHpOrtu, 
            alamat, 
            asalSekolah, 
            kelas, 
            sisaKuotaBelajar,
            paymentType,
            paymentPeriod,
            tingkat,
            kurikulum,
            mataPelajaran,
            fee,
            isActive 
        } = req.body;

        await Siswa.update({
            nama,
            namaLengkap,
            noHp,
            noHpOrtu,
            alamat,
            asalSekolah,
            kelas,
            sisaKuotaBelajar: parseInt(sisaKuotaBelajar),
            paymentType,
            paymentPeriod,
            tingkat,
            kurikulum,
            mataPelajaran: Array.isArray(mataPelajaran) ? mataPelajaran : [mataPelajaran],
            fee: parseInt(fee),
            isActive: isActive === 'true'
        }, {
            where: { id: req.params.id }
        });

        res.redirect('/admin/siswa?message=Siswa berhasil diupdate');
    } catch (error) {
        console.error('Error updating siswa:', error);
        res.redirect(`/admin/siswa/edit/${req.params.id}?error=Gagal mengupdate siswa`);
    }
});

router.post('/siswa/delete/:id', async (req, res) => {
  try {
    const siswaId = req.params.id;
  
    // Check if siswa has any active schedules
    const existingSchedules = await Schedule.findOne({
      where: {
        siswaId: siswaId,
        status: {
          [Op.not]: 'canceled' // Exclude canceled schedules
        }
      }
    });

    if (existingSchedules) {
      return res.redirect('/admin/siswa?error=Tidak dapat menghapus siswa yang masih memiliki jadwal aktif');
    }

    // If no active schedules, proceed with deletion
    await Siswa.destroy({
      where: { id: siswaId }
    });

    res.redirect('/admin/siswa?message=Siswa berhasil dihapus');
  } catch (error) {
    console.error('Error deleting siswa:', error);
    res.redirect('/admin/siswa?error=Gagal menghapus siswa');
  }
});

// Add this route with your other siswa routes
router.get('/siswa/payment-history/:id', async (req, res) => {
    try {
        const siswa = await Siswa.findByPk(req.params.id);
        if (!siswa) {
            return res.redirect('/admin/siswa?error=Siswa tidak ditemukan');
        }
        
        res.render('dashboard/admin/siswa-payment-history', {
            user: adminData,
            siswa,
            paymentHistory: siswa.paymentHistory || []
        });
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.redirect('/admin/siswa?error=Gagal memuat riwayat pembayaran');
    }
});

// Add this route with your other siswa routes
router.post('/siswa/add-payment/:id', async (req, res) => {
    try {
        const { amount, date, period, status, additionalSessions } = req.body;
        const siswa = await Siswa.findByPk(req.params.id);
        
        if (!siswa) {
            return res.redirect('/admin/siswa?error=Siswa tidak ditemukan');
        }
        // Get existing payment history or initialize empty array
        let paymentHistory = siswa.paymentHistory || [];
        
        // Create new payment entry
        const newPayment = {
            date: new Date(date),
            amount: parseFloat(amount),
            period,
            status,
            additionalSessions: parseInt(additionalSessions) || 0
        };
        paymentHistory.push(newPayment);

        // Calculate new total sessions only if status is 'paid'
        const currentSessions = siswa.sisaKuotaBelajar || 0;
        const newTotalSessions = status === 'paid' ? 
            currentSessions + (parseInt(additionalSessions) || 0) : 
            currentSessions;

        // Update siswa record
        await Siswa.update({
            paymentHistory: paymentHistory,
            tanggalBayarTerakhir: new Date(date),
            sisaKuotaBelajar: newTotalSessions
        }, {
            where: { id: siswa.id }
        });

        const message = status === 'paid' ? 
            `Pembayaran berhasil ditambahkan dan ${additionalSessions} pertemuan ditambahkan` :
            'Pembayaran berhasil ditambahkan (status pending)';
        
        res.redirect(`/admin/siswa/payment-history/${siswa.id}?message=${message}`);
    } catch (error) {
        console.error('Error adding payment:', error);
        console.error('Error stack:', error.stack);
        res.redirect(`/admin/siswa/payment-history/${req.params.id}?error=Gagal menambahkan pembayaran`);
    }
});

// Add route for editing payment
router.post('/siswa/edit-payment/:id', async (req, res) => {
    try {
        const { amount, date, period, status, additionalSessions, index } = req.body;
        const siswa = await Siswa.findByPk(req.params.id);
        
        if (!siswa) {
            return res.redirect('/admin/siswa?error=Siswa tidak ditemukan');
        }

        // Get existing payment history
        let paymentHistory = siswa.paymentHistory || [];
        
        if (index < 0 || index >= paymentHistory.length) {
            return res.redirect(`/admin/siswa/payment-history/${siswa.id}?error=Pembayaran tidak ditemukan`);
        }

        // Get the old payment data
        const oldPayment = paymentHistory[index];
        const oldAdditionalSessions = oldPayment.status === 'paid' ? (oldPayment.additionalSessions || 0) : 0;
        
        // Create updated payment entry
        const updatedPayment = {
            date: new Date(date),
            amount: parseFloat(amount),
            period,
            status,
            additionalSessions: parseInt(additionalSessions) || 0
        };

        // Update the payment in the history
        paymentHistory[index] = updatedPayment;

        // Calculate session difference based on status changes
        const newAdditionalSessions = status === 'paid' ? (parseInt(additionalSessions) || 0) : 0;
        const sessionDifference = newAdditionalSessions - oldAdditionalSessions;
        
        // Update siswa record
        const currentSessions = siswa.sisaKuotaBelajar || 0;
        const newTotalSessions = Math.max(0, currentSessions + sessionDifference);

        await Siswa.update({
            paymentHistory: paymentHistory,
            tanggalBayarTerakhir: new Date(date),
            sisaKuotaBelajar: newTotalSessions
        }, {
            where: { id: siswa.id }
        });

        res.redirect(`/admin/siswa/payment-history/${siswa.id}?message=Pembayaran berhasil diupdate`);
    } catch (error) {
        console.error('Error editing payment:', error);
        res.redirect(`/admin/siswa/payment-history/${req.params.id}?error=Gagal mengupdate pembayaran`);
    }
});

// Add route for deleting payment
router.post('/siswa/delete-payment/:id/:index', async (req, res) => {
    try {
        const siswa = await Siswa.findByPk(req.params.id);
        const index = parseInt(req.params.index);
        
        if (!siswa) {
            return res.json({ success: false, message: 'Siswa tidak ditemukan' });
        }

        // Get existing payment history
        let paymentHistory = siswa.paymentHistory || [];
        
        if (index < 0 || index >= paymentHistory.length) {
            return res.json({ success: false, message: 'Pembayaran tidak ditemukan' });
        }

        // Get the payment to be deleted
        const deletedPayment = paymentHistory[index];
        const deletedSessions = deletedPayment.status === 'paid' ? (deletedPayment.additionalSessions || 0) : 0;

        // Remove the payment from history
        paymentHistory.splice(index, 1);

        // Update siswa record - only reduce sessions if the deleted payment was 'paid'
        const currentSessions = siswa.sisaKuotaBelajar || 0;
        const newTotalSessions = Math.max(0, currentSessions - deletedSessions);

        await Siswa.update({
            paymentHistory: paymentHistory,
            sisaKuotaBelajar: newTotalSessions
        }, {
            where: { id: siswa.id }
        });

        res.json({ success: true, message: 'Pembayaran berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.json({ success: false, message: 'Gagal menghapus pembayaran' });
    }
});

// Add route for locking payment
router.post('/siswa/lock-payment/:id/:index', async (req, res) => {
    try {
        const siswa = await Siswa.findByPk(req.params.id);
        const index = parseInt(req.params.index);
        
        if (!siswa) {
            return res.json({ success: false, message: 'Siswa tidak ditemukan' });
        }

        // Get existing payment history
        let paymentHistory = siswa.paymentHistory || [];
        
        if (index < 0 || index >= paymentHistory.length) {
            return res.json({ success: false, message: 'Pembayaran tidak ditemukan' });
        }

        // Lock the payment
        paymentHistory[index].isLocked = true;

        // Update siswa record
        await Siswa.update({
            paymentHistory: paymentHistory
        }, {
            where: { id: siswa.id }
        });

        res.json({ success: true, message: 'Pembayaran berhasil dikunci' });
    } catch (error) {
        console.error('Error locking payment:', error);
        res.json({ success: false, message: 'Gagal mengunci pembayaran' });
    }
});

// Update the edit jadwal route
router.post('/jadwal/edit/:id', adminAuth, async (req, res) => {
    try {
        const scheduleId = req.params.id;
        const schedule = await Schedule.findByPk(scheduleId, {
            include: [
                { model: Tentor, as: 'tentor' },
                { model: Siswa, as: 'siswa' },
                { model: Class, as: 'class' }
            ]
        });

        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
        }

        // Check if this is a completion with attendance marking
        if (req.body.isAttendanceMarked && req.body.status === 'completed' && !schedule.isAttendanceMarked) {
            // Deduct kuota if it's an individual session
            if (schedule.type === 'individual' && schedule.siswa) {
                await schedule.siswa.decrement('sisaKuotaBelajar');
                await schedule.siswa.save();
            }
            // For class type, deduct from all students in the class
            else if (schedule.type === 'class' && schedule.class) {
                const classStudents = await schedule.class.getSiswas();
                for (const student of classStudents) {
                    await student.decrement('sisaKuotaBelajar');
                    await student.save();
                }
            }
        }

        // Update the schedule
        await schedule.update(req.body);

        // Fetch the updated schedule with relations
        const updatedSchedule = await Schedule.findByPk(scheduleId, {
            include: [
                { model: Tentor, as: 'tentor' },
                { model: Siswa, as: 'siswa' },
                { model: Class, as: 'class' }
            ]
        });

        // Format the response
        const response = {
            success: true,
            message: 'Jadwal berhasil diperbarui',
            schedule: {
                id: updatedSchedule.id,
                title: updatedSchedule.type === 'class' 
                    ? `${updatedSchedule.mataPelajaran} - ${updatedSchedule.class?.name}`
                    : `${updatedSchedule.mataPelajaran} - ${updatedSchedule.siswa?.nama}`,
                start: `${updatedSchedule.date}T${updatedSchedule.timeStart}`,
                end: `${updatedSchedule.date}T${updatedSchedule.timeEnd}`,
                extendedProps: {
                    tentorId: updatedSchedule.tentorId,
                    tentorNama: updatedSchedule.tentor?.nama,
                    type: updatedSchedule.type,
                    siswaId: updatedSchedule.siswaId,
                    classId: updatedSchedule.classId,
                    status: updatedSchedule.status,
                    mataPelajaran: updatedSchedule.mataPelajaran,
                    studentInfo: updatedSchedule.type === 'class' 
                        ? updatedSchedule.class?.name
                        : updatedSchedule.siswa?.nama,
                    isAttendanceMarked: updatedSchedule.isAttendanceMarked
                }
            }
        };

        // In the route for editing a schedule, add color assignment
        const backgroundColor = colorManager.getTentorColor(updatedSchedule.tentor);

        // Include backgroundColor in the response
        return req.headers['content-type'] === 'application/json'
            ? res.json({
                success: true,
                schedule: {
                    ...updatedSchedule.toJSON(),
                    backgroundColor,
                    borderColor: backgroundColor
                }
            })
            : res.redirect('/admin/jadwal?message=Jadwal berhasil diperbarui');
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui jadwal',
            error: error.message
        });
    }
});

router.get('/jadwal/preview', async (req, res) => {
    const currentDate = new Date();
        
    // Calculate the start date for three months ago
    const startDate = new Date(currentDate);
    startDate.setMonth(currentDate.getMonth() - 4); // Set to three months ago
    const endDate = new Date(currentDate);
    endDate.setMonth(currentDate.getMonth() + 2);
    
    try {
        const schedules = await Schedule.findAll({
            where: {
                date: {
                    [Op.between]: [startDate, endDate] // Between startDate and currentDate
                }
            },
            include: [
                { model: Tentor, as: 'tentor' },
                { model: Siswa, as: 'siswa' },
                { model: Class }
            ]
        });
        
        const tentors = await Tentor.findAll({ where: { isActive: true } });
        const siswas = await Siswa.findAll({ where: { isActive: true } });
        const classes = await Class.findAll({ where: { isActive: true } });

        // Create filter items for dropdown
        const filterItems = [];
        
        // Add classes to filter items
        classes.forEach(kelas => {
            filterItems.push({
                id: `class_${kelas.id}`,
                nama: `Kelas: ${kelas.name}`,
                isClass: true,
                classId: kelas.id
            });
        });
        
        // Add individual students to filter items
        siswas.forEach(siswa => {
            filterItems.push({
                id: `student_${siswa.id}`,
                nama: siswa.nama,
                isClass: false,
                siswaId: siswa.id
            });
        });

        res.render('dashboard/admin/jadwal-preview', {
            user: adminData,
            calendarEvents: schedules.map(schedule => {
                const startDateTime = `${schedule.date}T${schedule.timeStart}`;
                const endDateTime = `${schedule.date}T${schedule.timeEnd}`;
                
                let title;
                let studentInfo;
                let filterItemId;

                if (schedule.type === 'class') {
                    studentInfo = schedule.Class ? schedule.Class.name : 'Kelas tidak ditemukan';
                    title = `${schedule.tentor.nama} - ${studentInfo} (${schedule.mataPelajaran})`;
                    filterItemId = `class_${schedule.classId}`;
                } else {
                    studentInfo = schedule.siswa ? schedule.siswa.nama : 'Siswa tidak ditemukan';
                    title = `${schedule.tentor.nama} - ${studentInfo} (${schedule.mataPelajaran})`;
                    filterItemId = `student_${schedule.siswaId}`;
                }

                return {
                    id: schedule.id,
                    title,
                    start: startDateTime,
                    end: endDateTime,
                    backgroundColor: colorManager.getTentorColor(schedule.tentor),
                    borderColor: colorManager.getTentorColor(schedule.tentor),
                    extendedProps: {
                        status: schedule.status,
                        tentorId: schedule.tentorId,
                        type: schedule.type,
                        siswaId: schedule.siswaId,
                        classId: schedule.classId,
                        tentorNama: schedule.tentor.nama,
                        studentInfo,
                        mataPelajaran: schedule.mataPelajaran,
                        filterItemId
                    }
                };
            }),
            tentors,
            siswas,
            classes,
            filterItems
        });
    } catch (error) {
        console.error('Error generating schedule preview:', error);
        res.redirect('/admin/jadwal?error=Gagal membuat preview jadwal');
    }
});

// Class Management Routes
router.get('/class', async (req, res) => {
    try {
        const classes = await Class.findAll({
            include: [{
                model: Siswa,
                required: false,
                through: { attributes: [] }
            }]
        });

        const classesWithStudents = await Promise.all(classes.map(async (kelas) => {
            const studentIds = kelas.studentIds || [];
            const students = await Siswa.findAll({
                where: { id: studentIds }
            });
            return {
                ...kelas.toJSON(),
                Siswas: students
            };
        }));

        res.render('dashboard/admin/master-class', {
            user: adminData,
            classes: classesWithStudents
        });
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/class/tambah', async (req, res) => {
    try {
        const siswas = await Siswa.findAll({ where: { isActive: true } });
        res.render('dashboard/admin/input-class', {
            user: adminData,
            kelas: null,
            siswas
        });
    } catch (error) {
        console.error('Error loading add class form:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/class/tambah', async (req, res) => {
    try {
        const { name, description, siswaIds, fee, mataPelajaran } = req.body;
        
        // Create the class with student IDs array
        const newClass = await Class.create({
            name,
            description,
            studentIds: siswaIds ? (Array.isArray(siswaIds) ? siswaIds : [siswaIds]) : [],
            fee: parseInt(fee),
            mataPelajaran: Array.isArray(mataPelajaran) ? mataPelajaran : mataPelajaran ? [mataPelajaran] : []
        });

        res.redirect('/admin/class?message=Kelas berhasil dibuat');
    } catch (error) {
        console.error('Error creating class:', error);
        res.redirect('/admin/class?error=Gagal menambahkan kelas');
    }
});

router.get('/class/edit/:id', async (req, res) => {
    try {
        const kelas = await Class.findByPk(req.params.id);
        const allSiswas = await Siswa.findAll({ where: { isActive: true } });
        
        if (!kelas) {
            return res.status(404).send('Kelas tidak ditemukan');
        }

        // Ensure studentIds is an array
        const currentStudentIds = kelas.studentIds || [];
  

        res.render('dashboard/admin/input-class', {
            user: adminData,
            kelas: {
                ...kelas.toJSON(),
                studentIds: currentStudentIds
            },
            siswas: allSiswas
        });
    } catch (error) {
        console.error('Error fetching class:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/class/edit/:id', async (req, res) => {
    try {
        const { name, description, siswaIds, fee, mataPelajaran, isActive } = req.body;
        const classId = req.params.id;

        await Class.update({
            name,
            description,
            studentIds: siswaIds ? (Array.isArray(siswaIds) ? siswaIds : [siswaIds]) : [],
            fee: parseInt(fee),
            mataPelajaran: Array.isArray(mataPelajaran) ? mataPelajaran : mataPelajaran ? [mataPelajaran] : [],
            isActive: isActive === 'true'
        }, {
            where: { id: classId }
        });

        res.redirect('/admin/class?message=Kelas berhasil diupdate');
    } catch (error) {
        console.error('Error updating class:', error);
        res.redirect(`/admin/class/edit/${req.params.id}?error=Gagal mengupdate kelas`);
    }
});

router.post('/class/delete/:id', async (req, res) => {
    try {
        // First, check if the class exists
        const classToDelete = await Class.findByPk(req.params.id, {
            include: [{
                model: Siswa,
                as: 'Siswas',
                through: 'class_students'
            }]
        });
        
        if (!classToDelete) {
            return res.redirect('/admin/class?error=Kelas tidak ditemukan');
        }
        
        // Get the class name for the success message
        const className = classToDelete.name;
        
        // Check if class has any scheduled sessions
        const scheduleCount = await Schedule.count({
            where: { 
                classId: req.params.id,
                // Optionally only consider future or non-completed schedules
                // date: { [Op.gte]: new Date() },
                // status: { [Op.ne]: 'completed' }
            }
        });
        
        if (scheduleCount > 0) {
            return res.redirect(`/admin/class?error=Kelas ${className} tidak dapat dihapus karena masih memiliki ${scheduleCount} jadwal terkait`);
        }
        
        // Check if the class has students enrolled
        const studentCount = classToDelete.Siswas ? classToDelete.Siswas.length : 0;
        
        // If class has students, log this information for tracking
        if (studentCount > 0) {
            console.log(`Deleting class ${className} with ${studentCount} students enrolled`);
            
            // Delete all class-student associations
            await classToDelete.removeStudents(classToDelete.Siswas);
        }
        
        // Delete the class
        await classToDelete.destroy();
        
        res.redirect(`/admin/class?message=Kelas ${className} berhasil dihapus`);
    } catch (error) {
        console.error('Error deleting class:', error);
        res.redirect('/admin/class?error=Gagal menghapus kelas: ' + error.message);
    }
});

// Add this route with your other protected routes
router.get('/user-report/:userId', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.userId);
        if (!user) {
            return res.redirect('/admin/dashboard?error=User not found');
        }

      
        
        // Get unique tokens
        const userTokens = user.examCompleted ? [...new Set(user.examCompleted.map(exam => exam.tokenValue))] : [];
        
     
        
        // Get token details
        const tokens = await Token.findAll({
            where: {
                token: userTokens
            },
            attributes: ['token', 'owner', 'namaToken']
        });

        // Group exams by token and transform the data structure
        const examsByToken = {};
        for (const tokenValue of userTokens) {
            const tokenExams = user.examCompleted
                .filter(exam => exam.tokenValue === tokenValue)
                .flatMap(exam => {
                    return exam.kodekategories.map(async (kodekategori) => {
                        const mapel = await Mapel.findOne({
                            where: { kodekategori }
                        });
                        
                        return {
                            date: mapel ? mapel.tanggalMulai : new Date(), // Use tanggalMulai from mapel
                            token: exam.tokenValue,
                            score: exam.scores[kodekategori],
                            kodekategori: kodekategori,
                            mapel: mapel ? mapel.mapel : 'Unknown',
                            duration: mapel ? mapel.durasi : 0
                        };
                    });
                });

            // Resolve all promises
            examsByToken[tokenValue] = await Promise.all(tokenExams.flat());
        }

        // Sort tokens by date using the first exam's date in each token group
        const sortedTokens = Object.keys(examsByToken).sort((a, b) => {
            const dateA = new Date(examsByToken[a][0].date);
            const dateB = new Date(examsByToken[b][0].date);
            return dateA - dateB;
        });

        res.render('dashboard/admin/user-report', {
            user: adminData,
            userData: user,
            examsByToken,
            tokens,
            sortedTokens
        });
    } catch (error) {
        console.error('Error generating user report:', error);
        res.redirect('/admin/dashboard?error=Failed to generate user report');
    }
});

// Use the new controller function
router.get('/tentor/:id/sessions', getTentorSessions);

// Add new route for peserta ujian
router.get('/peserta-ujian', pesertaUjian);

// Export users to CSV
router.get('/export-users-csv', exportUsersCSV);

// Export basic user data to CSV
router.get('/export-users-basic-csv', exportUsersBasicCSV);

// Import users from CSV
router.post('/import-users-csv', upload.single('csvFile'), importUsersCSV);

// Add this route to handle GET requests for editing a token
router.get('/manajemen-token/edit/:id', async (req, res) => {
    try {
        const tokenId = req.params.id;
        const token = await Token.findByPk(tokenId); // Fetch the token by ID

        if (!token) {
            return res.status(404).send('Token not found');
        }

        res.render('dashboard/admin/edit-token', {
            token: token.toJSON(), // Pass the token data to the view
            user: adminData // Pass user data if needed
        });
    } catch (error) {
        console.error('Error fetching token:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Update token route
router.post('/manajemen-token/update/:id', async (req, res) => {
    try {
        const tokenId = req.params.id;
        const { namaToken, kategori, kuota, maxSubtest, owner } = req.body;

        await Token.update({
            namaToken,
            kategori,
            kuota,
            maxSubtest,
            owner
        }, {
            where: { id: tokenId }
        });

        res.json({ success: true, message: 'Token berhasil diperbarui' });
    } catch (error) {
        console.error('Error updating token:', error);
        res.status(500).json({ success: false, error: 'Gagal memperbarui token' });
    }
});

// Delete token route
router.post('/manajemen-token/delete/:id', async (req, res) => {
    try {
        const tokenId = req.params.id;
        await Token.destroy({
            where: { id: tokenId }
        });
        res.redirect('/admin/manajemen-token/daftar-token?message=Token berhasil dihapus');
    } catch (error) {
        console.error('Error deleting token:', error);
        res.redirect('/admin/manajemen-token/daftar-token?error=Gagal menghapus token');
    }
});



// In your schedule update route
router.post('/jadwal/update-status/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const schedule = await Schedule.findByPk(id);
        
        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
        }

        if (status === 'completed' && !schedule.isAttendanceMarked) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tentor belum mengisi daftar hadir',
                attendanceCode: schedule.attendanceCode 
            });
        }

        await schedule.update({ status });
        res.json({ success: true, message: 'Status jadwal berhasil diupdate' });
    } catch (error) {
        console.error('Error updating schedule status:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Add master daftar hadir route
router.get('/daftar-hadir', adminAuth, navAdmin, async (req, res) => {
    try {
        const { month, year } = req.query;
        
        // Get current date
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        // Use current month and year if no filter is provided
        const selectedMonth = month ? parseInt(month) : currentMonth;
        const selectedYear = year ? parseInt(year) : currentYear;
        
        const startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0); // Last day of the month
        
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
            order: [['date', 'ASC'], ['timeStart', 'ASC']]
        });

        res.render('dashboard/admin/master-daftar-hadir', {
            user: adminData,
            schedules,
            currentMonth,
            currentYear,
            selectedMonth,
            selectedYear
        });
    } catch (error) {
        console.error('Error fetching attendance records:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Add this route to handle sending reminders
router.post('/jadwal/send-reminders', async (req, res) => {
    try {
        // Get tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        // Find all schedules for tomorrow
        const schedules = await Schedule.findAll({
            where: {
                date: {
                    [Op.gte]: tomorrow,
                    [Op.lt]: dayAfterTomorrow
                },
                status: 'scheduled' // Only send reminders for scheduled sessions
            },
            include: [
                { model: Tentor, as: 'tentor' },
                { model: Siswa, as: 'siswa' },
                { model: Class, as: 'class' }
            ]
        });

        console.log('Creating transporter with config:', {
            host: process.env.IMAP_HOST,
            port: process.env.IMAP_PORT,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER
                // password omitted for security
            }
        });

        // Create email transporter using IMAP configuration
        const transporter = nodemailer.createTransport({
            host: process.env.IMAP_HOST,
            port: process.env.IMAP_PORT,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            },
            debug: true // Enable debug logging
        });

        // Verify transporter configuration
        try {
            await transporter.verify();
            console.log('Transporter verification successful');
        } catch (verifyError) {
            console.error('Transporter verification failed:', verifyError);
            return res.status(500).json({
                success: false,
                message: 'Email configuration error: ' + verifyError.message
            });
        }

        const successfulEmails = [];
        const failedEmails = [];

        // Send emails for each schedule
        for (const schedule of schedules) {
            const studentInfo = schedule.type === 'class' ? 
                schedule.class.name : 
                schedule.siswa.nama;

                const emailContent = generateScheduleReminderEmail(
                    schedule, 
                    studentInfo,
                    "https://geniusgate.id",
                    schedule.type === 'individual' 
                        ? schedule.siswa.alamat 
                        : 'Brits Edu Center'
                );

            try {
                console.log(`Attempting to send email to ${schedule.tentor.email}`);
                const info = await transporter.sendMail({
                    from: {
                        name: 'Brits Edu Center',
                        address: process.env.EMAIL_USER
                    },
                    to: schedule.tentor.email,
                    subject: `Pengingat Jadwal Mengajar Besok - ${studentInfo}`,
                    html: emailContent
                });

                console.log('Email sent successfully:', {
                    messageId: info.messageId,
                    response: info.response,
                    recipient: schedule.tentor.email
                });
                
                // Mark the schedule as email sent
                await schedule.update({ emailSent: true });

                successfulEmails.push({
                    email: schedule.tentor.email,
                    tentor: schedule.tentor.nama,
                    messageId: info.messageId
                });
            } catch (emailError) {
                console.error('Failed to send email:', {
                    recipient: schedule.tentor.email,
                    error: emailError.message,
                    stack: emailError.stack
                });
                
                failedEmails.push({
                    email: schedule.tentor.email,
                    tentor: schedule.tentor.nama,
                    error: emailError.message
                });
                continue;
            }
        }

        // Return detailed response
        res.json({ 
            success: true, 
            message: `Berhasil mengirim ${successfulEmails.length} pengingat, gagal mengirim ${failedEmails.length} pengingat`,
            details: {
                successful: successfulEmails,
                failed: failedEmails
            }
        });
    } catch (error) {
        console.error('Error in send-reminders:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal mengirim pengingat: ' + error.message
        });
    }
});

// Add route to reset email sent status
router.post('/jadwal/reset-email-status/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await Schedule.findByPk(id);
        
        if (!schedule) {
            return res.status(404).json({ 
                success: false, 
                message: 'Jadwal tidak ditemukan' 
            });
        }

        await schedule.update({ emailSent: false });
        
        res.json({ 
            success: true, 
            message: 'Status email berhasil direset' 
        });
    } catch (error) {
        console.error('Error resetting email status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal mereset status email' 
        });
    }
});

// Add route for sending individual reminder
router.post('/jadwal/send-individual-reminder/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const schedule = await Schedule.findOne({
            where: {
                id,
                status: 'scheduled'
            },
            include: [
                { model: Tentor, as: 'tentor' },
                { model: Siswa, as: 'siswa' },
                { model: Class, as: 'class' }
            ]
        });

        if (!schedule) {
            return res.status(404).json({ 
                success: false, 
                message: 'Jadwal tidak ditemukan atau bukan jadwal yang aktif' 
            });
        }

        // Create email transporter
        const transporter = nodemailer.createTransport({
            host: process.env.IMAP_HOST,
            port: process.env.IMAP_PORT,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const studentInfo = schedule.type === 'class' ? 
            schedule.class.name : 
            schedule.siswa.nama;

        const emailContent = generateScheduleReminderEmail(
            schedule, 
            studentInfo,
            "https://geniusgate.id",
            schedule.type === 'individual' 
                ? schedule.siswa.alamat 
                : 'Brits Edu Center'
        );

        try {
            const info = await transporter.sendMail({
                from: {
                    name: 'Brits Edu Center',
                    address: process.env.EMAIL_USER
                },
                to: schedule.tentor.email,
                subject: `Pengingat Jadwal Mengajar - ${studentInfo}`,
                html: emailContent
            });

            // Mark the schedule as email sent
            await schedule.update({ emailSent: true });

            res.json({ 
                success: true, 
                message: `Email berhasil dikirim ke ${schedule.tentor.nama}`,
                details: {
                    messageId: info.messageId,
                    recipient: schedule.tentor.email
                }
            });
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            res.status(500).json({ 
                success: false, 
                message: `Gagal mengirim email: ${emailError.message}`
            });
        }
    } catch (error) {
        console.error('Error sending individual reminder:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal mengirim pengingat: ' + error.message
        });
    }
});

// Add route to get student sessions
router.get('/siswa/:id/sessions', async (req, res) => {
    try {
        const { id } = req.params;
        const { month, year } = req.query;
        
        // Create date filter if month and year are provided
        let dateFilter = {};
        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Last day of the month
            dateFilter = {
                date: {
                    [Op.between]: [startDate, endDate]
                }
            };
        }

        const sessions = await Schedule.findAll({
            where: {
                siswaId: id,
                ...dateFilter
            },
            include: [
                { model: Tentor, as: 'tentor' },
                { model: Siswa, as: 'siswa' }
            ],
            order: [['date', 'ASC'], ['timeStart', 'ASC']]
        });

        res.json({
            success: true,
            sessions: sessions.map(session => ({
                id: session.id,
                date: session.date,
                timeStart: session.timeStart,
                timeEnd: session.timeEnd,
                tentor: session.tentor.nama,
                mataPelajaran: session.mataPelajaran,
                status: session.status,
                isAttendanceMarked: session.isAttendanceMarked
            }))
        });
    } catch (error) {
        console.error('Error fetching student sessions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
    }
});

// Add new route for printing sessions

router.get('/siswa/:id/sessions/print', async (req, res) => {
    try {
        const { id } = req.params;
        const { month, year } = req.query;

        // Get student details
        const siswa = await Siswa.findByPk(id);
        if (!siswa) {
            return res.status(404).send('Siswa tidak ditemukan');
        }

        // Create date filter
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of the month

        const sessions = await Schedule.findAll({
            where: {
                siswaId: id,
                date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            include: [
                { model: Tentor, as: 'tentor' },
                { model: Siswa, as: 'siswa' }
            ],
            order: [['date', 'ASC'], ['timeStart', 'ASC']]
        });

        // Format sessions like in the API response
        const formattedSessions = sessions.map(session => ({
            id: session.id,
            date: session.date,
            timeStart: session.timeStart,
            timeEnd: session.timeEnd,
            tentor: session.tentor.nama,
            mataPelajaran: session.mataPelajaran,
            status: session.status,
            isAttendanceMarked: session.isAttendanceMarked
        }));

        // Sort sessions by date
        formattedSessions.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Define day names array
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

        // Find the first day of the first session to determine week start
        let firstSessionDay = null;
        if (formattedSessions.length > 0) {
            const firstDate = new Date(formattedSessions[0].date);
            firstSessionDay = dayNames[firstDate.getDay()];
        }

        // Reorder dayOrder array based on the first session day
        let reorderedDayOrder = [...dayOrder];
        if (firstSessionDay) {
            const startIndex = dayOrder.indexOf(firstSessionDay);
            if (startIndex !== -1) {
                reorderedDayOrder = [
                    ...dayOrder.slice(startIndex),
                    ...dayOrder.slice(0, startIndex)
                ];
            }
        }

        // Group sessions by week
        const weeks = {
            'Pekan 1': {},
            'Pekan 2': {},
            'Pekan 3': {},
            'Pekan 4': {},
            'Pekan 5': {}
        };

        formattedSessions.forEach(session => {
            const date = new Date(session.date);
            const weekOfMonth = Math.ceil(date.getDate() / 7);
            const dayName = dayNames[date.getDay()];
            const weekKey = `Pekan ${weekOfMonth}`;

            if (!weeks[weekKey]) {
                weeks[weekKey] = {};
            }

            weeks[weekKey][dayName] = {
                date: date.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }).split('-').join('/'),
                timeStart: session.timeStart.substring(0, 5),
                timeEnd: session.timeEnd.substring(0, 5),
                mataPelajaran: session.mataPelajaran,
                tentor: session.tentor,
                status: session.status
            };
        });

        // Sort days in each week according to reordered dayOrder
        Object.keys(weeks).forEach(weekKey => {
            const sortedWeek = {};
            reorderedDayOrder.forEach(day => {
                if (weeks[weekKey][day]) {
                    sortedWeek[day] = weeks[weekKey][day];
                }
            });
            weeks[weekKey] = sortedWeek;
        });

        const monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        res.render('dashboard/admin/print-sessions', {
            siswa,
            month: monthNames[month - 1],
            year,
            weeks,
            dayOrder: reorderedDayOrder
        });
    } catch (error) {
        console.error('Error preparing print view:', error);
        res.status(500).send('Error preparing print view');
    }
});


module.exports = router;
