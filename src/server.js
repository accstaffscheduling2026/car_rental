require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const pino = require('pino');
const pinoHttp = require('pino-http');

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// ---------- Trust proxy (behind Nginx) ----------
app.set('trust proxy', 1);

// ---------- Logging ----------
app.use(pinoHttp({ logger, serializers: {
  req(req) { return { method: req.method, url: req.url }; }, // no PII in logs
} }));

// ---------- Security headers ----------
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// ---------- CORS ----------
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true,
}));

// ---------- Stripe webhook — MUST be before express.json() ----------
// Stripe signature verification requires the raw unparsed request body.
// express.json() would parse it into an object first, breaking the signature check.
app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), require('./routes/webhook'));

// ---------- Body parsing (all other routes) ----------
app.use(express.json({ limit: '100kb' }));

// ---------- Session (admin only) ----------
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.BASE_URL?.startsWith('https://') ?? false,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  },
}));

// ---------- Rate limiting ----------
const bookingLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max:      parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
const paymentLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

// ---------- Routes ----------
const healthRouter      = require('./routes/health');
const { router: vehiclesRouter } = require('./routes/vehicles');
const availabilityRouter = require('./routes/availability');
const reservationsRouter = require('./routes/reservations');
const paymentsRouter    = require('./routes/payments');
const adminRouter       = require('./routes/admin');
const employeesRouter   = require('./routes/employees');
const codesRouter       = require('./routes/codes');
const promoRouter       = require('./routes/promo');
const publicRouter      = require('./routes/public');
const authRouter        = require('./routes/auth');
const myBookingsRouter  = require('./routes/myBookings');

app.use('/api/v1/health',              healthRouter);
app.use('/api/v1/vehicles',            vehiclesRouter);
app.use('/api/v1/availability',        availabilityRouter);
app.use('/api/v1/reservations',        bookingLimiter, reservationsRouter);
app.use('/api/v1/payments',            paymentLimiter, paymentsRouter);
app.use('/api/v1/admin',               adminRouter);
app.use('/api/v1/admin/employees',     employeesRouter);
app.use('/api/v1/codes',               codesRouter);
app.use('/api/v1/promo',               bookingLimiter, promoRouter);
app.use('/api/v1/public',              publicRouter);
app.use('/api/v1/auth',               authRouter);
app.use('/api/v1/my-bookings',        myBookingsRouter);

// ---------- Serve React build in production ----------
const distPath = path.join(__dirname, '../frontend/dist');
if (require('fs').existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req, res) => res.json({ message: 'API running. Build frontend to serve UI.' }));
}

// ---------- 404 fallback for API ----------
app.use('/api/*', (req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- Global error handler ----------
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = parseInt(process.env.PORT || '8080', 10);
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

module.exports = app;
