const User = require('../models/User');

async function checkActiveSession(req, res, next) {
  if (!req.isAuthenticated() || !req.user) return next();

  try {
    // Rely on req.user (populated by Passport) without an extra DB read here.
    // Enforce single-session on login flow (see authController) instead of per request.
    if (req.user.activeSessionId && req.user.activeSessionId !== req.sessionID) {
      req.logout((err) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error('Logout error:', err);
        }
        return res.redirect('/login?message=Ada sesi lain yang aktif');
      });
      return;
    }

    if (req.session) req.session.touch();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Session check error:', error);
  }
  next();
}

module.exports = checkActiveSession;