function adminAuth(req, res, next) {
    const adminToken = req.cookies.adminToken;
    
    // Check if admin token exists and matches
    if (!adminToken || adminToken !== process.env.ADMIN_SECRET) {
        return res.redirect('/admin/login');
    }
    
    next();
}

module.exports = adminAuth; 