// routes/userRoutes.js
const express = require('express');
const { dashboard, updateUserHandler, topremium, saveAnswers, registerToken, miniTo, addExamCompletedHandler, disqualifyUser, handbook, getPembahasan, changePassword } = require('../controllers/userController');
const ensureAuthenticated = require('../middleware/authMiddleware');
const navUser = require('../middleware/navUser');
const router = express.Router();
router.use(navUser)
router.get('/dashboard', ensureAuthenticated, dashboard); 
// router.get('/dashboard',ensureAuthenticated ,(req, res) => {
//     res.json({ user: req.user });
//   });
router.get('/to-premium/:token',ensureAuthenticated, topremium);
router.get('/dashboard/mini-to',ensureAuthenticated, miniTo);
router.post('/to-premium/input-token',ensureAuthenticated, registerToken);
router.post('/updateUser',ensureAuthenticated, updateUserHandler);
router.post('/save-answers',ensureAuthenticated, saveAnswers);
router.post('/disqualify/:examId', ensureAuthenticated, disqualifyUser);
router.get('/handbook', ensureAuthenticated, handbook);
router.get('/handbook/:type', ensureAuthenticated, handbook);
router.get('/to-premium/:token/:kodekategori/pembahasan', ensureAuthenticated, getPembahasan);

// Password management routes
router.post('/change-password', ensureAuthenticated, changePassword);

module.exports = router;
