// app.js
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const RedisStore = require('connect-redis').default;
const { createClient: createRedisClient } = require('redis');
const pinoHttp = require('pino-http');
const promClient = require('prom-client');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mainRoutes = require('./routes/mainRoutes');
const toRoutes = require('./routes/toRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const checkActiveSession = require('./middleware/sessionMiddleware');
const maintenanceMode = require('./middleware/maintenanceMode');
const sequelize = require('./config/sequelize');

const app = express();

// Trust proxy for correct IPs and secure cookies behind a proxy/load balancer
app.set('trust proxy', 1);

// Middleware to set hostname
function setHostname(req, res, next) {
  res.locals.hostname = process.env.NODE_ENV === 'production' 
    ? "https://britseducenter.com/"
    : "http://localhost:3972/";
  next();
}

// Set EJS as the view engine for rendering HTML
app.set('view engine', 'ejs');

// Structured request logging
app.use(pinoHttp({
  redact: ['req.headers.authorization', 'req.headers.cookie'],
}));

// Serve static files first (enable long cache in production). Prefer Nginx/CDN in production.
const staticOptions = process.env.NODE_ENV === 'production'
  ? { maxAge: '7d', etag: true, immutable: false }
  : {};
app.use(express.static('public', staticOptions));

// Custom middleware
app.use(setHostname);
// Parse cookies before maintenance so admin bypass works
app.use(cookieParser());
// Security headers
app.use(helmet());
// Maintenance mode (before heavy middlewares and routes, after static + cookies)
app.use(maintenanceMode);

// Parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // This will log all environment variables
// Compression for responses
app.use(compression());

// Global basic rate limiter (tune as needed)
const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Session store - use Redis in production, memory store in development
let sessionStore;
if (process.env.NODE_ENV === 'production') {
  // Redis session store for production
  const redisUrl = process.env.REDIS_URL || `redis://localhost:6379`;
  const redisClient = createRedisClient({ url: redisUrl });
  redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
  });
  redisClient.connect().catch(() => {});
  sessionStore = new RedisStore({ client: redisClient, prefix: 'session:' });
} else {
  // Memory store for development
  sessionStore = undefined;
}

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
}));

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Set up Passport configuration
require('./config/passport')(passport);

// Cookies already parsed above

// Add after passport middleware and before routes
app.use(checkActiveSession);

// Prometheus metrics
const registry = new promClient.Registry();
promClient.collectDefaultMetrics({ register: registry });
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});
registry.registerMetric(httpRequestDuration);

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path;
    end({ method: req.method, route, status_code: res.statusCode });
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
});

// Health check (DB + Redis)
app.get('/healthz', async (req, res) => {
  try {
    await sequelize.authenticate();
    await redisClient.ping();
    return res.json({ status: 'ok' });
  } catch (err) {
    return res.status(503).json({ status: 'error', message: err.message });
  }
});

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
