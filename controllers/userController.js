const userService = require('../services/userService');
const mapelService = require('../services/mapelService');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { generatePasswordResetEmail } = require('../utilities/emailTemplates');

// controllers/userController.js
async function dashboard(req, res) {
  // Get fresh user data from database to ensure we have the latest information
  const User = require('../models/User');
  const user = await User.findByPk(req.user.id);

  // Check if any of the required fields are missing or null
  const requiredFields = ['nama_ortu', 'no_hp_ortu', 'nama', 'asal_sekolah', 'phone'];
  const missingFields = requiredFields.filter(field => !user[field] || user[field].trim() === '');

  if (missingFields.length > 0) {
    // If any required field is missing, render the signup view
    return res.render('signup-complete', { 
      user, 
      hostname: process.env.NODE_ENV === 'production' 
        ? "https://geniusgate.id/" 
        : "http://localhost:3972/",
      message: "Please complete your profile by filling in all required fields." 
    });
  }
  // Get tokens data for the user
  let tokens = [];
  if (user.tokens && user.tokens.length > 0) {
    for (const tokenValue of user.tokens) {
      const tokenData = await userService.findTokenByValue(tokenValue);
     
      if (tokenData && tokenData.token) {
        tokens.push({
          nama: tokenData.namaToken,
          token: tokenValue
        });
      }
    }
  }
  // If all required fields are present, render the dashboard
  res.render('dashboard/user/index', { user, tokens, currentRoute: req.originalUrl });
}

async function topremium(req, res) {
  try {
    const { token } = req.params;
    const mapelsToken = await mapelService.getMapelByTokenValue(token);
    const examTaken = await userService.getExamTaken(req.user.id, token);
    let examCompleted = await userService.getExamCompleted(req.user.id, token);
    
    // Fetch disqualified exams
    const disqualifiedExams = req.user.disqualifiedExams || [];

    // Convert examCompleted to array if it's a single object
    examCompleted = examCompleted ? [examCompleted] : [];

    // Check which subtests the user has answered
    const userAnswers = req.user.answers || [];
    const answeredSubtests = userAnswers.map(answer => answer.kodekategori);

    if (mapelsToken.length === 0) {
      return res.status(404).json({ message: 'No Mapel found for this token or the token does not exist' });
    }

    // Render an EJS page with the fetched data
    return res.render('dashboard/user/to-premium', {
      user: req.user,
      examTaken,     // Pass examTaken data
      examCompleted, // Pass examCompleted as array
      disqualifiedExams, // Pass disqualified exams
      answeredSubtests, // Pass list of subtests user has answered
      ...mapelsToken
    });

  } catch (error) {
    console.error('Error in getMapelByToken:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
}
async function miniTo(req, res) {
    try {
        // Render the mini-to view
        res.render('dashboard/user/mini-to', {
          user : req.user
        }); // Ensure the view file is named mini-to.ejs
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
async function updateUserHandler(req, res) {
    try {
      // Extract user ID from req.user (assumes user is logged in and authenticated)
      const userId = req.user.id;
  
      // Get the update data from the request body
      const userData = req.body;
      const createdAt = new Date();
      userData.createdAt = createdAt
  
      // Call updateUser with userId and the provided userData
      const updatedUser = await userService.updateUser(userId, userData);
  
      res.redirect('/user/dashboard')
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred while updating the user' });
    }
}

async function saveAnswers (req, res){
  try {
    const userId = req.user.id; // Get user ID from authenticated session

    const input = req.body; // Input from client { kodekategori, no, answer }
    const userData = {answers : input};
    // Update the answer
    const updatedUser = await userService.updateAnswer(userId, input, userData);

    // Respond with the updated answers
    res.json({ message: 'Answer updated successfully', answers: updatedUser.answers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update answer', error: error.message });
  }
};
async function registerToken(req, res) {
  try {
    const { token } = req.body; // Only get the token value from the request
    const userId = req.user.id; // Assuming user ID is available in req.user

    // Check if the token already exists
    const existingToken = await userService.findTokenByValue(token);
    if (!existingToken) {
      return res.status(404).json({ message: 'Token tidak ada.' });
    }

    // Attempt to add the token to the user
    await userService.addTokenToUser(userId, token);
    return res.status(200).json({ message: 'Berhasil tambah paket soal' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function addExamCompletedHandler(req, res) {
  try {
    const { token, kodekategori } = req.params;
    
    // Calculate score first
    const scoreResult = await userService.calculateScore(req.user.id, kodekategori);
    
    if (!scoreResult.success) {
      return res.status(404).render('404', {
        message: scoreResult.message,
        link: `/user/to-premium/${token}`,
        action: "Kembali ke daftar subtes"
      });
    }

    // Add to examCompleted with score
    const result = await userService.addExamCompleted(
      req.user.id, 
      kodekategori, 
      token, 
      scoreResult.data.score
    );

    if (!result.success) {
      return res.status(404).render('404', {

        message: result.message,
        link: `/user/to-premium/${token}`,
        action: "Kembali ke daftar subtes"
      });
    }

    // Redirect back to the TO Premium page
    res.redirect(`/user/to-premium/${token}`);

  } catch (error) {
    console.error('Error adding exam completed:', error);
    res.status(500).render('404', {
      message: "Terjadi kesalahan pada server",
      link: "/user/dashboard",
      action: "Kembali ke dashboard"
    });
  }
}

async function disqualifyUser(req, res) {
    const { examId } = req.params;
    const userId = req.user.id;

    try {
        // Update the user's disqualifiedExams
        const result = await userService.addDisqualifiedExam(userId, examId);
        
        if (result.success) {
            return res.status(200).json({ message: 'User disqualified successfully.' });
        } else {
            return res.status(400).json({ message: 'Failed to disqualify user.' });
        }
    } catch (error) {
        console.error('Error disqualifying user:', error);
        return res.status(500).json({ message: 'Failed to disqualify user.' });
    }
}

async function handbook(req, res) {
    try {
        // Check if the user is a member
        if (!req.user.isMember) {
            return res.render('dashboard/user/not-member', {
                user: req.user
            });
        }

        const { type } = req.params;
        
        // Define handbook links mapping
        const handbookLinks = {
            'bahasa-indonesia': 'https://drive.google.com/file/d/13h-6Cv1ibd66e-dLLY8vaWVCVHZCGAxu/preview',
            'bahasa-inggris': 'https://drive.google.com/file/d/13gkujdkkQeGespKsbKdYqhMTOCbaeHSJ/preview',
            'matematika': 'https://drive.google.com/file/d/13gUbU8ny2twqWSf-hxjmgjcuDrlUpyJg/preview',
            'lbe': 'https://drive.google.com/file/d/13dejBcMSFyi-5IfEwXRO1nrjVYdYBxc8/preview',
            'lbi': 'https://drive.google.com/file/d/13bxcpxejCAyM5TxFj6AdHZz_hwHLtlPn/preview',
            'pbm': 'https://drive.google.com/file/d/13_x_iaBVg7gqoE5c8f9YVT0CaWp7TJ2U/preview',
            'pk': 'https://drive.google.com/file/d/13_Es0GEo0d40EaWUO4vUTb7o3mNsD8Bb/preview',
            'pm': 'https://drive.google.com/file/d/13kPqNJiH5U7iuypmTdFvcRzLzwsDgZNJ/preview',
            'ppu': 'https://drive.google.com/file/d/13k-x-C_zQ-5-Q_K2mDPyUdD5FhBtxlUR/preview',
            'pu': 'https://drive.google.com/file/d/13hYH4rTOtHwx5ElAoHUJA30sIhlXokkx/preview'
        };

        // Get handbook link based on type, default to bahasa-indonesia if no type specified
        const handbookLink = handbookLinks[type] || handbookLinks['bahasa-indonesia'];
        
        // Render the handbook view if the user is a member
        res.render('dashboard/user/handbook', { 
            user: req.user,
            handbookLink,
            handbookLinks,
            currentRoute: req.originalUrl
        });
    } catch (error) {
        console.error('Error loading handbook:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

async function getPembahasan(req, res) {
    try {
        const { token, kodekategori } = req.params;
        const userId = req.user.id;

        // Get the mapel data with its soals
        const mapel = await mapelService.getMapelByKodeKategori(kodekategori);
        if (!mapel) {
            return res.status(404).render('404', {
                message: "Subtes tidak ditemukan",
                link: `/user/to-premium/${token}`,
                action: "Kembali ke daftar subtes"
            });
        }

        // Get user's answers for this test
        const user = await userService.findUserById(userId);
        const userAnswerSet = user.answers.find(ans => ans.kodekategori === kodekategori);
        
        // Get all soals with their answers and explanations
        let soalData = await mapelService.getContentSoalsByKodeKategori(kodekategori);

        // Sort soalData by question number
        soalData = soalData.sort((a, b) => {
            // Convert string numbers to integers for proper numerical sorting
            const numA = parseInt(a.no);
            const numB = parseInt(b.no);
            return numA - numB;
        });

        // Prepare data for rendering
        const userData = {
            nama: user.nama,
            email: user.email,
            jawaban: userAnswerSet ? userAnswerSet.answer : []
        };

        res.render('dashboard/user/pembahasan', {
            user: req.user,
            mapel,
            soalData,
            userData,
            token
        });

    } catch (error) {
        console.error('Error getting pembahasan:', error);
        res.status(500).render('404', {
            message: "Terjadi kesalahan pada server",
            link: "/user/dashboard",
            action: "Kembali ke dashboard"
        });
    }
}

// Password change functionality
async function changePassword(req, res) {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.json({ 
                success: false, 
                message: 'All password fields are required' 
            });
        }

        if (newPassword !== confirmPassword) {
            return res.json({ 
                success: false, 
                message: 'New password and confirm password do not match' 
            });
        }

        if (newPassword.length < 6) {
            return res.json({ 
                success: false, 
                message: 'New password must be at least 6 characters long' 
            });
        }

        // Get current user
        const user = await userService.findUserById(userId);
        if (!user) {
            return res.json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        await userService.updateUser(userId, { password: hashedNewPassword });

        return res.json({ 
            success: true, 
            message: 'Password changed successfully' 
        });

    } catch (error) {
        console.error('Error changing password:', error);
        return res.json({ 
            success: false, 
            message: 'An error occurred while changing password' 
        });
    }
}

module.exports = {
  dashboard,
  updateUserHandler,
  topremium,
  saveAnswers,
  registerToken,
  miniTo,
  addExamCompletedHandler,
  disqualifyUser,
  handbook,
  getPembahasan,
  changePassword
};