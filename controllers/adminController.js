const userService = require('../services/userService');
const mapelService = require('../services/mapelService');
const tokenService = require('../services/tokenService')
const User = require('../models/User');
const ContentSoal = require('../models/ContentSoal');
const csv = require('fast-csv');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const Mapel = require('../models/Mapel');
const Schedule = require('../models/Schedule');
const Siswa = require('../models/Siswa');
const Class = require('../models/Class');
const Tentor = require('../models/Tentor');
const Token = require('../models/Token');
const sequelize = require('sequelize');

// controllers/userController.js
const adminData = {
    email:'super-admin@togg.secret',
    nama : 'admin',
    photos : 'https://lh3.googleusercontent.com/a/ACg8ocJjXEBasv0X2PvokXtvLBAxeHQ85aVIcxUBDWsq8cu6OrS9rqs=s48-c'
}

async function dashboard(req, res) {
    try {
        // Get filter parameters from query string
        const { month, year } = req.query;
        
        // Get current date for default values
        const currentDate = new Date();
        const selectedMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
        const selectedYear = year ? parseInt(year) : currentDate.getFullYear();

        // Get current date in Asia/Makassar timezone
        const today = new Date();
        const formattedToday = today.toISOString().split('T')[0];

        // Basic stats
        const stats = {
            totalSiswa: await Siswa.count({ where: { isActive: true } }),
            totalTentor: await Tentor.count({ where: { isActive: true } }),
            totalPesertaTryout: await User.count(),
            jadwalHariIni: await Schedule.count({
                where: {
                    date: formattedToday
                }
            }),
            // Additional metrics
            totalKelas: await Class.count({ where: { isActive: true } }),
            totalMapel: await Mapel.count(),
            completedSessions: await Schedule.count({ where: { status: 'completed' } }),
            activeTokens: await Token.count()
        };

        // Get today's schedules
        const todaySchedules = await Schedule.findAll({
            where: {
                date: formattedToday
            },
            include: [
                { model: Tentor, as: 'tentor' },
                { model: Siswa, as: 'siswa' },
                { model: Class, as: 'class' }
            ],
            order: [['timeStart', 'ASC']]
        });

        // Get recent activities
        const recentActivities = await getRecentActivities();

        // Get performance metrics with selected month and year
        const performanceMetrics = await getPerformanceMetrics(selectedMonth, selectedYear);

        res.render('dashboard/admin/dashboard', {
            user: adminData,
            stats,
            todaySchedules,
            recentActivities,
            performanceMetrics,
            selectedMonth,
            selectedYear,
            currentMonth: currentDate.getMonth() + 1,
            currentYear: currentDate.getFullYear()
        });
    } catch (error) {
        console.error('Error in dashboard controller:', error);
        res.status(500).send('Error loading dashboard');
    }
}

async function getPerformanceMetrics(selectedMonth, selectedYear) {
    const today = new Date();
    
    // Create date range for selected month
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0); // Last day of selected month

    // Get the start and end dates for the current week
    const currentDay = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDay); // Set to last Sunday
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + (6 - currentDay)); // Set to next Saturday

    // Get all schedules for the selected month
    const thisMonthSchedules = await Schedule.findAll({
        where: {
            date: {
                [Op.between]: [startDate, endDate]
            }
        }
    });

    const completedSessions = thisMonthSchedules.filter(schedule => schedule.status === 'completed').length;
    const totalSessions = thisMonthSchedules.length;

    // Calculate completion rate
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    // Get sessions for the current week
    const thisWeekSchedules = await Schedule.findAll({
        where: {
            date: {
                [Op.between]: [weekStart, weekEnd]
            }
        }
    });

    const totalWeekSessions = thisWeekSchedules.length;
    const daysInWeek = 7; // Always 7 days in a week
    const avgSessionsPerDayThisWeek = daysInWeek > 0 ? Math.round(totalWeekSessions / daysInWeek) : 0; // Average over 7 days

    // Get canceled schedules rate
    const canceledSchedules = await Schedule.count({
        where: {
            status: 'canceled',
            date: {
                [Op.between]: [startDate, endDate]
            }
        }
    });

    // Get most active subjects
    const subjectCounts = await Schedule.findAll({
        where: {
            date: {
                [Op.between]: [startDate, endDate]
            },
            status: 'completed'
        },
        attributes: ['mataPelajaran', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['mataPelajaran'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 1
    });

    const mostActiveSubject = subjectCounts.length > 0 ? {
        name: subjectCounts[0].mataPelajaran,
        count: parseInt(subjectCounts[0].getDataValue('count'))
    } : null;

    // Calculate total pendapatan this month from siswa payments
    let monthlyPendapatan = 0;
    let totalPendapatan = 0;
    const allSiswas = await Siswa.findAll();
    
    for (const siswa of allSiswas) {
        const payments = siswa.paymentHistory || [];
        
        // Calculate monthly and total pendapatan
        payments.forEach(payment => {
            const paymentDate = new Date(payment.date);
            if (payment.status === 'paid') {
                // Add to total pendapatan
                totalPendapatan += payment.amount;
                
                // Add to monthly pendapatan if payment was in selected month
                if (paymentDate >= startDate && paymentDate <= endDate) {
                    monthlyPendapatan += payment.amount;
                }
            }
        });
    }

    // Calculate tentor fees
    let monthlyTentorFees = 0;
    let totalTentorFees = 0;
    const completedSchedules = await Schedule.findAll({
        where: {
            status: 'completed'
        },
        include: [
            { 
                model: Siswa, 
                as: 'siswa',
                attributes: ['fee']
            },
            { 
                model: Class, 
                as: 'class',
                attributes: ['fee']
            }
        ]
    });

    completedSchedules.forEach(schedule => {
        const scheduleDate = new Date(schedule.date);
        const fee = schedule.type === 'individual' ? 
            (schedule.siswa?.fee || 0) : 
            (schedule.class?.fee || 0);
        
        // Add to total fees
        totalTentorFees += fee;
        
        // Add to monthly fees if schedule was in selected month
        if (scheduleDate >= startDate && scheduleDate <= endDate) {
            monthlyTentorFees += fee;
        }
    });

    return {
        sessionMetrics: {
            completed: completedSessions,
            total: totalSessions,
            completionRate: completionRate,
            avgSessionsPerDayThisWeek: avgSessionsPerDayThisWeek
        },
        studentEngagement: {
            activeStudents: await Siswa.count({ 
                where: { 
                    isActive: true,
                    updatedAt: { [Op.gte]: startDate }
                }
            }),
            totalStudents: await Siswa.count()
        },
        testParticipation: {
            activeUsers: await User.count({
                where: {
                    examCompleted: { [Op.ne]: [] }
                }
            }),
            totalUsers: await User.count()
        },
        // New metrics
        monthlyMetrics: {
            totalSchedules: thisMonthSchedules.length,
            canceledRate: Math.round((canceledSchedules / totalSessions) * 100) || 0,
            mostActiveSubject,
            // Add new financial metrics
            pendapatanBulanIni: monthlyPendapatan,
            totalPendapatan: totalPendapatan,
            feeTentorBulanIni: monthlyTentorFees,
            totalFeeTentor: totalTentorFees,
            profitBulanIni: monthlyPendapatan - monthlyTentorFees,
            totalProfit: totalPendapatan - totalTentorFees
        }
    };
}

async function pesertaUjian(req, res) {
    try {
        const siswas = await userService.getAllUsers();
        res.render('dashboard/admin/peserta-ujian', {
            user: adminData,
            siswas
        });
    } catch (error) {
        console.error('Error in peserta ujian controller:', error);
        res.status(500).send('Error fetching users');
    }
}

// Export users to CSV
async function exportUsersCSV(req, res) {
    try {
        const users = await userService.getAllUsers();
        
        // Define CSV header with all fields
        let csvContent = 'id,email,nama,asal_sekolah,paket,program,phone,jenjang,nama_ortu,no_hp_ortu,google_id,photos,isMember,activeSessionId,tokens,examTaken,examCompleted,answers,disqualifiedExams,createdAt\n';
        
        // Add user data rows
        users.forEach(user => {
            const row = [
                user.id || '',
                user.email || '',
                user.nama || '',
                user.asal_sekolah || '',
                user.paket || '',
                user.program || '',
                user.phone || '',
                user.jenjang || '',
                user.nama_ortu || '',
                user.no_hp_ortu || '',
                user.google_id || '',
                user.photos || '',
                user.isMember ? 'Yes' : 'No',
                user.activeSessionId || '',
                JSON.stringify(user.tokens || []),
                JSON.stringify(user.examTaken || []),
                JSON.stringify(user.examCompleted || []),
                JSON.stringify(user.answers || []),
                JSON.stringify(user.disqualifiedExams || []),
                user.createdAt ? new Date(user.createdAt).toISOString() : ''
            ].map(field => {
                // Convert field to string if it's not already
                const stringField = typeof field === 'string' ? field : String(field);
                // Escape fields that contain commas or quotes
                if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                    return `"${stringField.replace(/"/g, '""')}"`;
                }
                return stringField;
            }).join(',');
            
            csvContent += row + '\n';
        });
        
        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=users-complete-${new Date().toISOString().slice(0,10)}.csv`);
        
        // Send CSV content
        res.send(csvContent);
    } catch (error) {
        console.error('Error exporting users to CSV:', error);
        res.redirect('/admin/peserta-ujian?error=Failed to export users');
    }
}

// Export basic user data to CSV (without tryout data)
async function exportUsersBasicCSV(req, res) {
    try {
        const users = await userService.getAllUsers();
        
        // Define CSV header with basic fields only
        let csvContent = 'id,email,nama,asal_sekolah,paket,program,phone,jenjang,nama_ortu,no_hp_ortu,google_id,isMember,createdAt\n';
        
        // Add user data rows
        users.forEach(user => {
            const row = [
                user.id || '',
                user.email || '',
                user.nama || '',
                user.asal_sekolah || '',
                user.paket || '',
                user.program || '',
                user.phone || '',
                user.jenjang || '',
                user.nama_ortu || '',
                user.no_hp_ortu || '',
                user.google_id || '',
                user.isMember ? 'Yes' : 'No',
                user.createdAt ? new Date(user.createdAt).toISOString() : ''
            ].map(field => {
                // Convert field to string if it's not already
                const stringField = typeof field === 'string' ? field : String(field);
                // Escape fields that contain commas or quotes
                if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                    return `"${stringField.replace(/"/g, '""')}"`;
                }
                return stringField;
            }).join(',');
            
            csvContent += row + '\n';
        });
        
        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=users-basic-${new Date().toISOString().slice(0,10)}.csv`);
        
        // Send CSV content
        res.send(csvContent);
    } catch (error) {
        console.error('Error exporting basic user data to CSV:', error);
        res.redirect('/admin/peserta-ujian?error=Failed to export basic user data');
    }
}

// Import users from CSV
async function importUsersCSV(req, res) {
    try {
        if (!req.file) {
            return res.redirect('/admin/peserta-ujian?error=No file uploaded');
        }
        
        const fs = require('fs');
        const csv = require('csv-parser');
        const path = require('path');
        
        const results = [];
        const errors = [];
        let successCount = 0;
        
        // Read and parse CSV file
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                // Process each row
                for (const row of results) {
                    try {
                        // Validate required email field
                        if (!row.email) {
                            errors.push(`Row skipped: Missing email`);
                            continue;
                        }
                        
                        // Check if user already exists
                        const existingUser = await userService.findUserByEmail(row.email);
                        
                        // Parse JSON fields if they exist
                        const tryoutData = {
                            tokens: parseJsonField(row.tokens),
                            examTaken: parseJsonField(row.examTaken),
                            examCompleted: parseJsonField(row.examCompleted),
                            answers: parseJsonField(row.answers),
                            disqualifiedExams: parseJsonField(row.disqualifiedExams)
                        };
                        
                        if (existingUser) {
                            // Update existing user
                            const updateData = {
                                nama: row.nama || existingUser.nama,
                                asal_sekolah: row.asal_sekolah || existingUser.asal_sekolah,
                                paket: row.paket || existingUser.paket,
                                program: row.program || existingUser.program,
                                phone: row.phone || existingUser.phone,
                                jenjang: row.jenjang || existingUser.jenjang,
                                nama_ortu: row.nama_ortu || existingUser.nama_ortu,
                                no_hp_ortu: row.no_hp_ortu || existingUser.no_hp_ortu,
                                google_id: row.google_id || existingUser.google_id,
                                photos: row.photos || existingUser.photos,
                                isMember: row.isMember === 'Yes' ? true : (row.isMember === 'No' ? false : existingUser.isMember),
                                activeSessionId: row.activeSessionId || existingUser.activeSessionId,
                                // Only update tryout data if it exists in the CSV
                                tokens: tryoutData.tokens !== null ? tryoutData.tokens : existingUser.tokens,
                                examTaken: tryoutData.examTaken !== null ? tryoutData.examTaken : existingUser.examTaken,
                                examCompleted: tryoutData.examCompleted !== null ? tryoutData.examCompleted : existingUser.examCompleted,
                                answers: tryoutData.answers !== null ? tryoutData.answers : existingUser.answers,
                                disqualifiedExams: tryoutData.disqualifiedExams !== null ? tryoutData.disqualifiedExams : existingUser.disqualifiedExams
                            };
                            
                            await User.update(updateData, {
                                where: { id: existingUser.id }
                            });
                            
                            successCount++;
                        } else {
                            // Create new user with default password
                            await userService.saveUser({
                                email: row.email,
                                password: 'britsedu', // Default password
                                nama: row.nama || '',
                                asal_sekolah: row.asal_sekolah || '',
                                paket: row.paket || '',
                                program: row.program || '',
                                phone: row.phone || '',
                                jenjang: row.jenjang || '',
                                nama_ortu: row.nama_ortu || '',
                                no_hp_ortu: row.no_hp_ortu || '',
                                google_id: row.google_id || '',
                                photos: row.photos || '',
                                isMember: row.isMember === 'Yes',
                                // Include tryout data for new users if available
                                tokens: tryoutData.tokens || [],
                                examTaken: tryoutData.examTaken || [],
                                examCompleted: tryoutData.examCompleted || [],
                                answers: tryoutData.answers || [],
                                disqualifiedExams: tryoutData.disqualifiedExams || []
                            });
                            
                            successCount++;
                        }
                    } catch (err) {
                        errors.push(`Error processing ${row.email}: ${err.message}`);
                    }
                }
                
                // Delete the temporary file
                fs.unlinkSync(req.file.path);
                
                // Redirect with appropriate message
                if (errors.length > 0) {
                    console.error('Import errors:', errors);
                    return res.redirect(`/admin/peserta-ujian?message=Imported ${successCount} users with ${errors.length} errors&error=${errors.join('. ')}`);
                }
                
                res.redirect(`/admin/peserta-ujian?message=Successfully imported ${successCount} users`);
            });
    } catch (error) {
        console.error('Error importing users from CSV:', error);
        
        // Delete the temporary file if it exists
        if (req.file) {
            const fs = require('fs');
            fs.unlinkSync(req.file.path);
        }
        
        res.redirect('/admin/peserta-ujian?error=Failed to import users');
    }
}

// Helper function to parse JSON fields from CSV
function parseJsonField(field) {
    if (!field) return null;
    try {
        return JSON.parse(field);
    } catch (error) {
        console.error('Error parsing JSON field:', error);
        return null;
    }
}

async function getRecentActivities() {
    const activities = [];
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // Get recent schedules (created and canceled)
    const recentSchedules = await Schedule.findAll({
        where: {
            [Op.or]: [
                { createdAt: { [Op.gte]: threeDaysAgo } },
                { 
                    status: 'canceled',
                    updatedAt: { [Op.gte]: threeDaysAgo }
                }
            ]
        },
        limit: 10,
        order: [['updatedAt', 'DESC']],
        include: [
            { model: Tentor, as: 'tentor' },
            { model: Siswa, as: 'siswa' },
            { model: Class, as: 'class' }
        ]
    });

    recentSchedules.forEach(schedule => {
        const studentInfo = schedule.type === 'class' 
            ? schedule.class?.name 
            : schedule.siswa?.nama;

        if (schedule.status === 'canceled' && schedule.updatedAt >= threeDaysAgo) {
            activities.push({
                description: `Jadwal dibatalkan: ${schedule.tentor.nama} dengan ${studentInfo}`,
                time: schedule.updatedAt.toLocaleString(),
                type: 'canceled'
            });
        } else if (schedule.createdAt >= threeDaysAgo) {
            activities.push({
                description: `Jadwal baru: ${schedule.tentor.nama} dengan ${studentInfo}`,
                time: schedule.createdAt.toLocaleString(),
                type: 'new'
            });
        }
    });

    // Get recent exam completions - using createdAt instead of updatedAt
    const recentExams = await User.findAll({
        where: {
            createdAt: { [Op.gte]: threeDaysAgo },
            examCompleted: { [Op.ne]: [] }
        },
        limit: 5,
        order: [['createdAt', 'DESC']]
    });

    recentExams.forEach(user => {
        if (user.examCompleted && user.examCompleted.length > 0) {
            const latestExam = user.examCompleted[user.examCompleted.length - 1];
            activities.push({
                description: `${user.nama} menyelesaikan ujian ${latestExam.tokenValue}`,
                time: user.createdAt.toLocaleString(),
                type: 'exam'
            });
        }
    });

    // Sort all activities by time
    return activities.sort((a, b) => 
        new Date(b.time) - new Date(a.time)
    ).slice(0, 10); // Limit to 10 most recent activities
}

async function deleteUser(req, res) {
    try {
        const userId = req.params.id;
        
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        
        // Find the user first to check if it exists
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Delete the user
        await User.destroy({ where: { id: userId } });
        
        // Return success JSON response
        return res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
}

async function getAllMapels(req, res) {
    try {
        const mapels = await mapelService.getAllMapels();
        const mapelsData = mapels.map((mapel) => mapel.toJSON());
        res.render('dashboard/admin/master-soal', {
            user : adminData,
            datas:mapelsData})
    } catch (error) {
        console.error('Error in fetching Mapel records:', error);
        res.status(500).json({ error: 'Failed to fetch Mapel records' });
    }
}

async function addPaketSoal (req, res) {
    try {
        const mapels = await mapelService.getAllMapels();
        const mapelsData = mapels.map((mapel) => mapel.toJSON());
        res.render('dashboard/admin/add-paket-soal', {
            user : adminData,
            datas:mapelsData}
        )} catch (error) {
        console.error('Error in fetching Mapel records:', error);
        res.status(500).json({ error: 'Failed to fetch Mapel records' });
    }
}

const generateKodeKategori = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let kodekategori = '';
    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        kodekategori += characters[randomIndex];
    }
    return kodekategori;
};

const addPaketSoalPost = async (req, res) => {
    try {
        const { kategori, mapel, owner, tanggalMulai, tanggalBerakhir, durasi } = req.body;
        const kodekategori = generateKodeKategori()
        // Validate the required fields
        if (!kategori || !mapel || !owner || !kodekategori || !tanggalMulai || !tanggalBerakhir || !durasi) {
            return res.status(400).json({ error: 'All fields are required.', data:{kategori, mapel, owner, tanggalMulai, tanggalBerakhir, durasi, kodekategori} });
        }

        // Call the service to add the paket soal
        const newPaketSoal = await mapelService.addMapel({
            kategori,
            mapel,
            owner,
            kodekategori,
            tanggalMulai,
            tanggalBerakhir,
            durasi // This should be an array of questions
        });

        // Send success response
        res.redirect('/admin/manajemen-soal/daftar-subtest?message=Berhasil menambah subtes '+mapel);
    } catch (error) {
        console.error('Error adding paket soal:', error);
        res.status(500).json({ error: 'Internal Server Error.' });
    }
};

const deletePaket = async (req, res) => {
    const { kodekategori } = req.params;

    try {
        const result = await mapelService.deleteSubtestByKodeKategori(kodekategori);
        if (result) {
            res.redirect('/admin/manajemen-soal/daftar-subtest?message=Berhasil menghapus subtes '+result);
        } else {
            return res.status(404).json({ success: false, message: 'Subtest not found.' });
        }
    } catch (error) {
        console.error('Error deleting subtest:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error.' });
    }
};

const getContentSoals = async (req, res) => {
    const { kodekategori } = req.params;

    try {
        // Get mapel information
        const mapel = await mapelService.getMapelByKodeKategori(kodekategori);
        
        // Get content soals
        const contentSoals = await mapelService.getContentSoalsByKodeKategori(kodekategori);
        contentSoals.sort((a, b) => a.no - b.no);
        
        // Create kategoriInfo object with name and owner
        const kategoriInfo = {
            name: mapel ? mapel.mapel : 'Unknown',
            owner: mapel ? mapel.owner : 'Unknown'
        };
        
        res.render('dashboard/admin/soal', {
            user: {...adminData},
            datas: contentSoals,
            kodekategori,
            kategoriInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

async function addTokenPage (req, res) {
    res.render('dashboard/admin/add-token', {   
        user : {...adminData},
    })
}

const getTokenPage = async (req, res) => {
    try {
        // Fetch the mapel by kodekategori
        const token = await tokenService.getAllTokens();
        if (!token) {
            return res.status(404).send('Mapel not found');
        }

        // Fetch the specific soal by mapel ID and question number
        // Render the page with the mapel and soal data
        res.render('dashboard/admin/master-token', {
            user : {...adminData},
            datas: token || [], // Pass an empty object if no soal exists yet
        });
    } catch (error) {
        console.error('Error loading input soal page:', error);
        res.status(500).send('Internal Server Error');
    }
};

const getInputSoalPage = async (req, res) => {
    const { kodekategori, no } = req.params;

    try {
        // Fetch the mapel by kodekategori
        const mapel = await mapelService.getMapelByKodeKategori(kodekategori);

        if (!mapel) {
            return res.status(404).send('Mapel not found');
        }

        // Fetch the specific soal by mapel ID and question number
        const soal = await mapelService.getSoalByMapelAndNo(mapel.id, no);

        // Render the page with the mapel and soal data
        res.render('dashboard/admin/input-soal-page', {
            user : {...adminData},
            kategori : mapel.kategori,
            mapel,
            backUrl : "/admin/manajemen-soal/mapel/" + kodekategori,
            paket : mapel.owner,
            nomorSoal : no,
            datas: soal || {}, // Pass an empty object if no soal exists yet
        });
    } catch (error) {
        console.error('Error loading input soal page:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Save or update a soal
const saveSoal = async (req, res) => {
    const { kodekategori, no } = req.params;
    const soalData = req.body;
    try {
        // Fetch the mapel by kodekategori
        const mapel = await mapelService.getMapelByKodeKategori(kodekategori);

        if (!mapel) {
            return res.status(404).send('Mapel not found');
        }
        
        // Save or update the soal
        const result = await mapelService.createOrUpdateSoal(mapel.id, no, soalData);

        res.redirect(`/admin/manajemen-soal/mapel/${kodekategori}/${no}`);
    } catch (error) {
        console.error('Error saving soal:', error);
        res.status(500).send('Internal Server Error');
    }
};

const deleteSoalHandler = async (req, res) => {
    const { kodekategori, no } = req.params;

    try {
        const mapel = await mapelService.getMapelByKodeKategori(kodekategori);
        const result = await mapelService.deleteSoal(mapel.id, no);
        if (result.success) {
            res.status(200).json({ message: `Berhasil hapus soal no ${no}` , no, kodekategori }); 
        } else {
            res.status(404).json({ message: result.message });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
 
async function addTokenHandler (req, res){
    const { namaToken, kuota, kategori, owner, maxSubtest } = req.body;
    try {
        // Call the service to create a token
        const result = await tokenService.createNewToken({ namaToken, kuota, kategori, owner, maxSubtest });

        // Respond with the created token
        res.redirect("/admin/manajemen-token/daftar-token?message=Berhasil tambah token")
    } catch (error) {
        // Handle errors
        res.status(400).json({ error: error.message });
    }
};

async function deleteToken(req, res){
    const { id } = req.params;
    try {
        const result = await tokenService.deleteTokenById(id);
        res.redirect("/admin/manajemen-token/daftar-token?message=Berhasil hapus token")
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

// Edit (update) a token by ID
async function editToken (req, res){
    const { id } = req.params;
    const updates = req.body; // Pass the fields to be updated
    try {
        const result = await tokenService.editTokenById(id, updates);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const adminLogin = (req, res) => {
    const { email, password } = req.body;

    // Check admin credentials
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        // Set admin cookie
        res.cookie('adminToken', process.env.ADMIN_SECRET, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        return res.redirect('/admin/dashboard');
    }

    res.redirect('/admin/login?error=Invalid credentials');
};

const resetSession = (req, res) => {
    // Clear the session or perform any necessary reset logic
    req.session.destroy(err => {
        if (err) {
            console.error('Error resetting session:', err);
            return res.status(500).send('Error resetting session');
        }
        res.redirect('/admin/login'); // Redirect to login or another appropriate page
    });
};

async function resetUserSession(req, res) {
    try {
        const { userId } = req.params;
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Reset the user's session
        await user.update({ activeSessionId: null });
        
        res.json({ success: true, message: 'Session reset successfully' });
    } catch (error) {
        console.error('Error resetting user session:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

async function acceptMember(req, res) {
    try {
        const { userId } = req.params;
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update user to member status
        await user.update({ isMember: true });
        
        res.json({ success: true, message: 'User accepted as member successfully' });
    } catch (error) {
        console.error('Error accepting user as member:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

async function cancelMember(req, res) {
    try {
        const { userId } = req.params;
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update user to non-member status
        await user.update({ isMember: false });
        
        res.json({ success: true, message: 'User membership canceled successfully' });
    } catch (error) {
        console.error('Error cancelling user membership:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

async function getNilai(req, res) {
    try {
        const { kodekategori } = req.params;
        const users = await User.findAll({
            where: {
                answers: {
                    [Op.contains]: [{ kodekategori }]
                }
            }
        });

        const scores = [];
        for (const user of users) {
            const result = await userService.calculateScore(user.id, kodekategori);
            if (result.success) {
                scores.push({
                    nama: user.nama,
                    email: user.email,
                    score: result.data.score
                });
            }
        }
        const mapel = await Mapel.findOne({
            where: { kodekategori }
        });
        res.render('dashboard/admin/nilai', {
            user: adminData,
            scores,
            kodekategori,
            mapel: mapel.mapel,
            owner: mapel.owner
        });
    } catch (error) {
        console.error('Error fetching scores:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function getNilaiByOwner(req, res) {
    try {
        const { owner } = req.params;
        
        // Get all mapels with this owner
        const mapels = await Mapel.findAll({
            where: { owner }
        });

        const allScores = [];
        const users = await User.findAll();

        for (const user of users) {
            const userScores = {
                nama: user.nama,
                email: user.email,
                scores: []
            };

            for (const mapel of mapels) {
                const result = await userService.calculateScore(user.id, mapel.kodekategori);
                userScores.scores.push({
                    mapel: mapel.mapel,
                    kodekategori: mapel.kodekategori,
                    score: result.success ? result.data.score : '-'
                });
            }

            // Only add users who have at least one score
            if (userScores.scores.some(score => score.score !== '-')) {
                allScores.push(userScores);
            }
        }

        res.render('dashboard/admin/nilai-by-owner', {
            user: adminData,
            owner,
            mapels,
            scores: allScores
        });
    } catch (error) {
        console.error('Error fetching scores:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function getEditPaketSoal(req, res) {
    try {
        const { kodekategori } = req.params;
        const mapel = await mapelService.getMapelByKodeKategori(kodekategori);
        
        if (!mapel) {
            return res.status(404).send('Paket soal not found');
        }

        res.render('dashboard/admin/edit-paket-soal', {
            user: adminData,
            data: mapel
        });
    } catch (error) {
        console.error('Error loading edit paket soal page:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function updatePaketSoal(req, res) {
    try {
        const { kodekategori } = req.params;
        const { kategori, mapel, owner, tanggalMulai, tanggalBerakhir, durasi } = req.body;
        
        const result = await mapelService.updateMapel(kodekategori, {
            kategori,
            mapel,
            owner,
            tanggalMulai,
            tanggalBerakhir,
            durasi
        });

        res.redirect('/admin/manajemen-soal/daftar-subtest?message=Berhasil mengubah subtes ' + mapel);
    } catch (error) {
        console.error('Error updating paket soal:', error);
        res.status(500).send('Internal Server Error');
    }
}

// Export soal to CSV
async function exportSoal(req, res) {
    try {
        const { kodekategori } = req.params;
        const mapel = await mapelService.getMapelByKodeKategori(kodekategori);
        
        if (!mapel) {
            return res.status(404).send('Mapel not found');
        }

        const soals = await ContentSoal.findAll({
            where: { mapelId: mapel.id },
            order: [['no', 'ASC']]
        });

        // Create CSV data (now includes pembahasan)
        const csvData = soals.map(soal => ({
            no: soal.no,
            content: soal.content,
            a: soal.a,
            b: soal.b,
            c: soal.c,
            d: soal.d,
            e: soal.e,
            tipeSoal: soal.tipeSoal,
            answer: soal.answer,
            materi: soal.materi,
            pembahasan: soal.pembahasan
        }));

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=soal-${kodekategori}.csv`);

        // Write CSV to response
        csv.write(csvData, { headers: true })
            .pipe(res);

    } catch (error) {
        console.error('Error exporting soal:', error);
        res.status(500).send('Error exporting soal');
    }
}

// Import soal from CSV
async function importSoal(req, res) {
    try {
        const { kodekategori } = req.body;
        const mapel = await mapelService.getMapelByKodeKategori(kodekategori);
        
        if (!mapel) {
            return res.status(404).send('Mapel not found');
        }

        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        const soals = [];
        
        // Read CSV file (now includes pembahasan)
        fs.createReadStream(req.file.path)
            .pipe(csv.parse({ headers: true }))
            .on('data', (row) => {
                soals.push({
                    ...row,
                    mapelId: mapel.id
                });
            })
            .on('end', async () => {
                try {
                    // Delete existing soal
                    await ContentSoal.destroy({
                        where: { mapelId: mapel.id }
                    });

                    // Insert new soal
                    await ContentSoal.bulkCreate(soals);

                    // Delete temporary file
                    fs.unlinkSync(req.file.path);

                    res.redirect(`/admin/manajemen-soal/mapel/${kodekategori}?message=Berhasil import soal`);
                } catch (error) {
                    console.error('Error saving imported soal:', error);
                    res.status(500).send('Error importing soal');
                }
            });

    } catch (error) {
        console.error('Error importing soal:', error);
        res.status(500).send('Error importing soal');
    }
}

// Add this new function
async function resetUserExams(req, res) {
    try {
        const { userId } = req.params;
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Reset the user's exam history
        await user.update({
            examTaken: [],
            examCompleted: [],
            disqualifiedExams: []
        });
        
        res.json({ success: true, message: 'Exam history reset successfully' });
    } catch (error) {
        console.error('Error resetting user exam history:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

async function getDetailedNilai(req, res) {
    try {
        const { kodekategori } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50; // Default 50 users per page
        const offset = (page - 1) * limit;
        
        // Get the mapel details
        const mapel = await Mapel.findOne({
            where: { kodekategori },
            include: [{
                model: ContentSoal,
                as: 'soals',
                separate: true,
                order: [['no', 'ASC']]
            }]
        });

        // Sort the soals after fetching
        if (mapel && mapel.soals) {
            mapel.soals.sort((a, b) => a.no - b.no);
        }

        // Prepare soal data with correct answers
        const soalData = mapel.soals.map(soal => ({
            no: soal.no,
            answer: [soal.answer],
            tipeSoal: soal.tipeSoal
        }));

        // Get total count of users who have answered this test
        const totalUsers = await User.count({
            where: {
                answers: {
                    [Op.contains]: [{ kodekategori }]
                }
            }
        });

        // Get paginated users who have answered this test
        const users = await User.findAll({
            where: {
                answers: {
                    [Op.contains]: [{ kodekategori }]
                }
            },
            limit: limit,
            offset: offset,
            order: [['nama', 'ASC']] // Order by name for consistent pagination
        });

        // Prepare user data with answers
        const userData = [];
        for (const user of users) {
            const userAnswerSet = user.answers.find(ans => ans.kodekategori === kodekategori);
            if (userAnswerSet) {
                // Create an array of length equal to number of questions, filled with 'F'
                const normalizedAnswers = new Array(mapel.soals.length).fill('F');
                
                // Fill in actual answers where they exist
                if (userAnswerSet.answer && Array.isArray(userAnswerSet.answer)) {
                    userAnswerSet.answer.forEach((ans, idx) => {
                        if (idx < normalizedAnswers.length) {
                            normalizedAnswers[idx] = ans || 'F';
                        }
                    });
                }

                userData.push({
                    nama: user.nama,
                    email: user.email,
                    noHp: user.noHp || '-',
                    jawaban: normalizedAnswers,
                    score: userAnswerSet.answer.map((ans, idx) => {
                        const userAns = ans || 'F';
                        const correctAnswer = soalData[idx]?.answer || '';
                        return userAns.toUpperCase() === correctAnswer.toString().toUpperCase() ? 'B' : 'S';
                    })
                });
            }
        }

        // Calculate pagination info
        const totalPages = Math.ceil(totalUsers / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.render('dashboard/admin/fullDetailedNilai', {
            user: adminData,
            mapel,
            userData,
            soalData,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalUsers: totalUsers,
                limit: limit,
                hasNextPage: hasNextPage,
                hasPrevPage: hasPrevPage,
                startIndex: offset + 1,
                endIndex: Math.min(offset + limit, totalUsers)
            }
        });

    } catch (error) {
        console.error('Error fetching detailed scores:', error);
        res.status(500).send('Internal Server Error');
    }
}

// Update the tentor sessions endpoint
async function getTentorSessions(req, res) {
    try {
        const tentorId = req.params.id;
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

        // Get all sessions for this tentor with date filter
        const sessions = await Schedule.findAll({
            where: { 
                tentorId,
                ...dateFilter 
            },
            include: [{
                model: Siswa,
                as: 'siswa',
                attributes: ['id', 'nama', 'fee']  // Explicitly include fee
            }, {
                model: Class,
                as: 'class',
                attributes: ['id', 'name', 'fee'],  // Explicitly include fee
                include: [{
                    model: Siswa,
                    through: 'class_students',
                    as: 'Siswas'
                }]
            }],
            order: [['date', 'DESC']]
        });

        // Add logging to check the loaded data


        // Calculate monthly earnings
        let monthlyEarnings = 0;
        
        // Get unique students and their session details
        const studentMap = new Map();
        const subjectMap = new Map();

        sessions.forEach(session => {
            // Calculate earnings (only for completed sessions)
            if (session.status === 'completed') {
                if (session.type === 'individual' && session.siswa) {
                    monthlyEarnings += session.siswa.fee || 0;
                } else if (session.type === 'class' && session.class) {
                    monthlyEarnings += session.class.fee || 0;
                }
            }

            if (session.type === 'individual' && session.siswa) {
                const studentId = session.siswa.id;
                if (!studentMap.has(studentId)) {
                    // Create new student entry with fee from siswa model
                    studentMap.set(studentId, {
                        nama: session.siswa.nama,
                        totalSessions: 0,
                        completedCount: 0,
                        canceledCount: 0,
                        type: 'individual',
                        sessions: [],
                        fee: session.siswa.fee || 0  // Store fee directly at top level
                    });

       
                }
                
                const studentData = studentMap.get(studentId);
                studentData.totalSessions++;
                if (session.status === 'completed') {
                    studentData.completedCount++;
                } else if (session.status === 'canceled') {
                    studentData.canceledCount++;
                }
                
                studentData.sessions.push({
                    date: session.date,
                    mataPelajaran: session.mataPelajaran,
                    status: session.status
                });
            } else if (session.type === 'class' && session.class) {
                // Handle class students
                const classKey = `class_${session.class.id}`;
                if (!studentMap.has(classKey)) {
                    studentMap.set(classKey, {
                        nama: session.class.name,
                        totalSessions: 0,
                        completedCount: 0,
                        canceledCount: 0,
                        type: 'class',
                        sessions: [],
                        class: {
                            fee: session.class.fee || 0
                        }
                    });
                }
                
                const classData = studentMap.get(classKey);
                classData.totalSessions++;
                if (session.status === 'completed') {
                    classData.completedCount++;
                } else if (session.status === 'canceled') {
                    classData.canceledCount++; // Count canceled sessions
                }
                
                // Add session details
                classData.sessions.push({
                    date: session.date,
                    mataPelajaran: session.mataPelajaran,
                    status: session.status // Will now include 'canceled' status
                });
            }

            // Count subjects (only count non-canceled sessions)
            if (session.status !== 'canceled') {
                const subject = session.mataPelajaran;
                subjectMap.set(subject, (subjectMap.get(subject) || 0) + 1);
            }
        });

        // Format the response
        const students = Array.from(studentMap.values());
        const subjects = Array.from(subjectMap.entries()).map(([name, count]) => ({
            name,
            count
        }));

        res.json({
            monthlyEarnings,
            students,
            subjects
        });
    } catch (error) {
        console.error('Error fetching tentor sessions:', error);
        res.status(500).json({ error: 'Failed to fetch session details' });
    }
}

module.exports = {
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
    editToken,
    adminLogin,
    resetSession,
    resetUserSession,
    getEditPaketSoal,
    updatePaketSoal,
    exportSoal,
    importSoal,
    resetUserExams,
    getDetailedNilai,
    acceptMember,
    cancelMember,
    getNilai,
    getNilaiByOwner,
    getTentorSessions,
    pesertaUjian,
    exportUsersCSV,
    exportUsersBasicCSV,
    importUsersCSV
};