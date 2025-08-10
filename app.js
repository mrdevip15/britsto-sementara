// app.js
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mainRoutes = require('./routes/mainRoutes');
const toRoutes = require('./routes/toRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const cookieParser = require('cookie-parser');
const checkActiveSession = require('./middleware/sessionMiddleware');
const maintenanceMode = require('./middleware/maintenanceMode');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const Session = require('./models/Session'); // Adjust the path as necessary

const app = express();

// Middleware to set hostname
function setHostname(req, res, next) {
  res.locals.hostname = process.env.NODE_ENV === 'production' 
    ? "https://britseducenter.com/"
    : "http://localhost:3972/";
  next();
}

// Set EJS as the view engine for rendering HTML
app.set('view engine', 'ejs');

// Serve static files first
app.use(express.static('public'));

// Custom middleware
app.use(setHostname);
// Parse cookies before maintenance so admin bypass works
app.use(cookieParser());
// Maintenance mode (before heavy middlewares and routes, after static + cookies)
app.use(maintenanceMode);

// Parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // This will log all environment variables
// Create PostgreSQL pool using your existing database configuration

// Session configuration (add before passport middleware)
const pool = new Pool({
  user: process.env.NODE_ENV === 'production' ? process.env.PROD_DB_USERNAME : process.env.DB_USERNAME,
  host: process.env.NODE_ENV === 'production' ? process.env.PROD_DB_HOST : process.env.DB_HOST,
  database: process.env.NODE_ENV === 'production' ? process.env.PROD_DB_NAME : process.env.DB_NAME,
  password: process.env.NODE_ENV === 'production' ? process.env.PROD_DB_PASSWORD : process.env.DB_PASSWORD,
  port: process.env.NODE_ENV === 'production' ? process.env.PROD_DB_PORT : process.env.DB_PORT,
});
// Trigger push
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session', // This is the default table name
    createTableIfMissing: true, // Automatically create the table if it doesn't exist
  }),
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: false
  }
}));

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Set up Passport configuration
require('./config/passport')(passport);

// Cookies already parsed above

// Add after passport middleware and before routes
app.use(checkActiveSession);

// Define Routes
app.use('/', authRoutes);
app.use('/', mainRoutes);
app.use('/', uploadRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/', toRoutes);
app.use((req, res) => {// Fallback to '/' if no referer
  res.status(404).render('404', {
      message: "Oops, halaman ini sepertinya tidak ada",
      link: "/",
      action: "Kembali ke halaman beranda"
  });
});

// After your sequelize initialization and before using any models
require('./models/associations');

module.exports = app;
