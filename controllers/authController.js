// controllers/authController.js
const bcrypt = require('bcrypt');
const userService = require('../services/userService');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { generatePasswordResetEmail } = require('../utilities/emailTemplates');

// Sign-up function
async function signup(req, res) {
  const { email, password, cpass, nama_ortu, no_hp_ortu, nama, asal_sekolah, paket, jenjang, program, phone } = req.body;

  // Validate required fields
  if (!email || !password || !cpass || !nama || !asal_sekolah || !paket || !jenjang || !program || !phone) {
    return res.status(400).json({ message: "Please fill in all required fields." });
  }
  if (password !== cpass) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  try {
    // Check if a user with this email already exists
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    // Hash the password and save the new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = new Date();
    const newUser = await userService.saveUser({
      email,
      password: hashedPassword,
      nama_ortu,
      no_hp_ortu,
      nama,
      asal_sekolah,
      paket,
      jenjang,
      program,
      phone,
      createdAt
    });

    // Automatically log in the user after successful signup
    req.login(newUser, (err) => {
      if (err) {
        console.error("Error during automatic login after signup:", err);
        return res.status(500).json({ message: "An error occurred during login." });
      }
      // Redirect to the user dashboard or another page
      return res.redirect('/user/dashboard');
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "An error occurred during sign-up." });
  }
}


// Logout function
async function logout(req, res) {
  if (req.user) {
    try {
      await User.update(
        { activeSessionId: null },
        { where: { id: req.user.id } }
      );
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }
  
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
}

// Login function
async function login(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.redirect("/login?message=Email atau password salah");
  }

  try {
    // Find the user by email in the database
    const user = await userService.findUserByEmail(email);
    if (!user) {
      return res.redirect("/login?message=Email atau password salah");
    }

    // Check if the password matches the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.redirect("/login?message=Email atau password salah");
    }

    // Clear any existing session
    if (user.activeSessionId) {
      // You might want to destroy the previous session here
      await User.update(
        { activeSessionId: null },
        { where: { id: user.id } }
      );
    }

    // Use Passport to handle login
    req.login(user, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "An error occurred during login." });
      }

      // Set the new session
      await User.update(
        { activeSessionId: req.sessionID },
        { where: { id: user.id } }
      );

      return res.redirect('/user/dashboard');
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred during login." });
  }
}

// Forgot password function
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.json({ 
                success: false, 
                message: 'Email address is required' 
            });
        }
        
        // Find user by email
        const user = await userService.findUserByEmail(email);
        if (!user) {
            return res.json({ 
                success: false, 
                message: 'No account found with this email address' 
            });
        }
        
        // Generate a random password
        const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
        
        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password in database
        await userService.updateUser(user.id, { password: hashedNewPassword });
        
        // Send email with the new password
        try {
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
            
            // Verify transporter configuration
            try {
                await transporter.verify();
                console.log('Email transporter verification successful');
            } catch (verifyError) {
                console.error('Email configuration error:', verifyError.message);
                return res.json({ 
                    success: false, 
                    message: 'Email service is currently unavailable. Please try again later.' 
                });
            }
            
            // Get hostname for email links
            const hostname = req.get('host').includes('localhost') ? 
                `http://${req.get('host')}` : 
                `https://${req.get('host')}`;
            
            const emailContent = generatePasswordResetEmail(
                user.nama || 'User', 
                newPassword, 
                hostname
            );
            
            const mailOptions = {
                from: {
                    name: 'BritsEdu Support',
                    address: process.env.EMAIL_USER
                },
                to: user.email,
                subject: '🔐 Password Reset - BritsEdu',
                html: emailContent
            };
            
            await transporter.sendMail(mailOptions);
            
            return res.json({ 
                success: true, 
                message: `Password reset successfully! A new password has been sent to ${email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}` 
            });
            
        } catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
            
            // Even if email fails, password was changed, so let user know
            return res.json({ 
                success: true, 
                message: 'Password has been reset, but email could not be sent. Please contact support for your new password.'
            });
        }
        
    } catch (error) {
        console.error('Error in forgot password:', error);
        return res.json({ 
            success: false, 
            message: 'An error occurred while processing your request' 
        });
    }
}

module.exports = { signup, logout, login, forgotPassword };