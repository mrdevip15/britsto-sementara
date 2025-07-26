const User = require('../models/User');

async function checkActiveSession(req, res, next) {
  // Skip session check for authentication-related routes
  const skipRoutes = [
    '/auth/google/callback', 
    '/signup-complete', 
    '/login', 
    '/auth/login', 
    '/signup', 
    '/auth/signup', 
    '/logout',
    '/auth/google'
  ];
  
  // Also skip if the path starts with any of these prefixes
  const skipPrefixes = ['/auth/'];
  
  if (skipRoutes.includes(req.path) || skipPrefixes.some(prefix => req.path.startsWith(prefix))) {
    return next();
  }
  
  if (req.isAuthenticated() && req.user) {
    try {
      const user = await User.findByPk(req.user.id);

      // If no active session is set, set this session as active
      if (!user.activeSessionId) {
        user.activeSessionId = req.sessionID;
        await user.save();
        
        // Set the session ID in a cookie for browser verification
        res.cookie('session_verify', req.sessionID, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
      }

      // Check if this session matches the active session in database
      if (user.activeSessionId !== req.sessionID) {
        // Force logout as session IDs don't match
        req.logout((err) => {
          if (err) {
            console.error('Logout error:', err);
          }
          res.clearCookie('session_verify');
          return res.redirect('/login?message=Sesi anda telah berakhir, silahkan login kembali');
        });
        return;
      }

      // Check if browser cookie session ID matches current session ID
      const browserSessionId = req.cookies.session_verify;
      if (!browserSessionId || browserSessionId !== req.sessionID) {
        // Force logout as session IDs don't match
        req.logout((err) => {
          if (err) {
            console.error('Logout error:', err);
          }
          res.clearCookie('session_verify');
          return res.redirect('/login?message=Sesi anda telah berakhir, silahkan login kembali');
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