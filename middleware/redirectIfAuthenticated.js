function redirectIfAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/user/dashboard'); // Redirect to the dashboard if logged in
    }
    next(); // Continue to the requested route if not logged in
  }

  module.exports = redirectIfAuthenticated
  // add comment just to pull