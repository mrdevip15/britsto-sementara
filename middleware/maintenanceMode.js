// middleware/maintenanceMode.js
const fs = require('fs');
const path = require('path');

const MAINTENANCE_LOCK_FILE = path.join(__dirname, '..', 'temp', 'maintenance.lock');

function isMaintenanceEnabled() {
  const envEnabled = String(process.env.MAINTENANCE_MODE || '').toLowerCase() === 'true';
  let fileEnabled = false;
  try {
    fileEnabled = fs.existsSync(MAINTENANCE_LOCK_FILE);
  } catch (_) {
    fileEnabled = false;
  }
  return envEnabled || fileEnabled;
}

function shouldBypass(req) {
  // Always allow health checks and ACME challenges
  const allowedPrefixes = [
    '/healthz',
    '/.well-known',
    '/favicon',
    '/robots.txt',
    '/sitemap.xml',
    // Static assets to render the maintenance page properly
    '/assets',
    '/dashboard',
  ];

  if (allowedPrefixes.some((p) => req.path.startsWith(p))) return true;

  return false;
}

module.exports = function maintenanceMode(req, res, next) {
  if (!isMaintenanceEnabled()) return next();
  if (shouldBypass(req)) return next();

  res.set('Retry-After', '3600');
  // Serve HTML for browsers, JSON for API-like requests
  const wantsHtml = (req.headers.accept || '').includes('text/html');
  if (wantsHtml) {
    return res.status(503).render('maintenance', {
      hostname: res.locals.hostname,
      message:
        process.env.MAINTENANCE_MESSAGE || 'Website sedang dalam perawatan. Silakan kembali beberapa saat lagi.',
    });
  }
  return res.status(503).json({
    status: 503,
    error: 'Service Unavailable',
    message:
      process.env.MAINTENANCE_MESSAGE || 'Website sedang dalam perawatan. Silakan kembali beberapa saat lagi.',
  });
};

module.exports.MAINTENANCE_LOCK_FILE = MAINTENANCE_LOCK_FILE;
