const User = require('../models/User');

async function checkActiveSession(req, res, next) {
  if (req.isAuthenticated() && req.user) {
    try {
      const user = await User.findByPk(req.user.id);


      // If no active session is set, set this session as active
      if (!user.activeSessionId) {
        user.activeSessionId = req.sessionID;
        await user.save();
      }

      // If this session doesn't match the active session, logout
     
      if (user.activeSessionId !== req.sessionID) {
        req.logout((err) => {
          if (err) {
            console.error('Logout error:', err);
          }
          return res.redirect('/login?message=Ada sesi lain yang aktif');
        });
        return;
      }

      // Update session expiry
      if (req.session) {
        req.session.touch();
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }
  next();
}

module.exports = checkActiveSession; 