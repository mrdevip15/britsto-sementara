// routes/authRoutes.js
const express = require('express');
const passport = require('passport');
const { signup, logout, login, forgotPassword } = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgot-password', forgotPassword);

// Google OAuth routes
router.get('/auth/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      // Store user data temporarily
      const userData = { ...req.user.get() };
      
      // Regenerate session ID to prevent session fixation attacks
      req.session.regenerate(async (err) => {
        if (err) {
          console.error("Error regenerating session:", err);
          return res.redirect('/login?message=Login error occurred');
        }
        
        // Re-authenticate the user after session regeneration
        req.login(userData, async (loginErr) => {
          if (loginErr) {
            console.error("Error re-authenticating after session regeneration:", loginErr);
            return res.redirect('/login?message=Login error occurred');
          }
          
          // Update the user's active session to the current session
          const User = require('../models/User');
          await User.update(
            { activeSessionId: req.sessionID },
            { where: { id: userData.id } }
          );
          
          // Set the session verification cookie
          res.cookie('session_verify', req.sessionID, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
          });
          
          // Check if user needs to complete profile
          const requiredFields = ['nama_ortu', 'no_hp_ortu', 'asal_sekolah', 'phone'];
          const missingFields = requiredFields.filter(field => !userData[field]);
          
          if (missingFields.length > 0) {
            // Redirect to profile completion page
            return res.redirect('/signup-complete');
          }
          
          // Redirect to dashboard if profile is complete
          res.redirect('/user/dashboard');
        });
      });
    } catch (error) {
      console.error('Error in Google OAuth callback:', error);
      res.redirect('/login?message=Login error occurred');
    }
  }
);

module.exports = router 