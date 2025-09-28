const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const Database = require('./config/database-adapter');
const inscriptionRoutes = require('./routes/inscriptions');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const specialtyChangeRoutes = require('./routes/specialty-change');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"]
    }
  }
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database first, then setup routes and start server
async function startServer() {
  try {
    // Initialize database
    const dbType = await Database.init();
    console.log(`📊 Using ${dbType} database`);
    
    // Setup routes after database is initialized
    app.use('/api/inscriptions', inscriptionRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/auth', authRoutes);
    
    // New specialty change routes
    app.post('/api/students/search', specialtyChangeRoutes.searchStudent);
    app.post('/api/specialty-requests', specialtyChangeRoutes.createRequest);
    app.get('/api/specialty-requests', specialtyChangeRoutes.getAllRequests);
    app.get('/api/specialty-requests/statistics', specialtyChangeRoutes.getStatistics);
    app.put('/api/specialty-requests/:id/status', specialtyChangeRoutes.updateRequestStatus);

    // Serve main pages
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index-new.html'));
    });
    
    app.get('/specialty-change', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'specialty-change.html'));
    });

    app.get('/admin', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'specialty-admin.html'));
    });

    app.get('/admin/login', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
      });
    });

    // Start the server only after everything is initialized
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Registration form: http://localhost:${PORT}`);
      console.log(`👨‍💼 Admin dashboard: http://localhost:${PORT}/admin`);
    });

  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    process.exit(1);
  }
}

// Start the server
startServer();