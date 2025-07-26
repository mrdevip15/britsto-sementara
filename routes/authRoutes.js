// routes/authRoutes.js
const express = require('express');
const passport = require('passport');
const { signup, logout, login, forgotPassword } = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);

router.post('/login', login);
router.get('/logout', logout);
router.post('/forgot-password', forgotPassword);

module.exports = router 