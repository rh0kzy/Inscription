const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const database = require('../config/database-adapter');
const EmailService = require('../config/email');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// GET /api/admin/inscriptions - Get all inscriptions with filters
router.get('/inscriptions', authenticateToken, async (req, res) => {
  const db = Database.getPool();
  const { status, search, page = 1, limit = 10 } = req.query;
  
  let query = 'SELECT * FROM inscriptions';
  let countQuery = 'SELECT COUNT(*) as total FROM inscriptions';
  let params = [];
  let whereConditions = [];

  // Status filter
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    whereConditions.push(`status = $${params.length + 1}`);
    params.push(status);
  }

  // Search filter
  if (search) {
    whereConditions.push(`(first_name ILIKE $${params.length + 1} OR last_name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1} OR program ILIKE $${params.length + 1})`);
    const searchTerm = `%${search}%`;
    params.push(searchTerm);
  }

  if (whereConditions.length > 0) {
    const whereClause = ' WHERE ' + whereConditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  query += ' ORDER BY created_at DESC';

  // Pagination
  const offset = (page - 1) * limit;
  query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const queryParams = [...params, parseInt(limit), offset];
  
  const client = await db.connect();

  try {
    // Get total count
    const countResult = await client.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get inscriptions
    const result = await client.query(query, queryParams);
    const inscriptions = result.rows;

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        inscriptions,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: total,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error occurred' 
    });
  } finally {
    client.release();
  }
});

// GET /api/admin/inscriptions/:id - Get specific inscription
router.get('/inscriptions/:id', authenticateToken, async (req, res) => {
  const db = Database.getPool();
  const inscriptionId = req.params.id;

  const client = await db.connect();

  try {
    const result = await client.query(
      'SELECT * FROM inscriptions WHERE id = $1',
      [inscriptionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inscription not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error occurred' 
    });
  } finally {
    client.release();
  }
});

// PATCH /api/admin/inscriptions/:id/status - Update inscription status
router.patch('/inscriptions/:id/status', authenticateToken, async (req, res) => {
  const db = Database.getPool();
  const inscriptionId = req.params.id;
  const { status, admin_notes } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Status must be either "approved" or "rejected"' 
    });
  }

  const client = await db.connect();

  try {
    // First, get the current inscription
    const inscriptionResult = await client.query(
      'SELECT * FROM inscriptions WHERE id = $1',
      [inscriptionId]
    );

    if (inscriptionResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inscription not found' 
      });
    }

    const inscription = inscriptionResult.rows[0];

    if (inscription.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending inscriptions can be updated' 
      });
    }

    // Update the inscription
    const updateResult = await client.query(`
      UPDATE inscriptions 
      SET status = $1, admin_notes = $2, processed_by = $3, processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [status, admin_notes || null, req.user.email, inscriptionId]);

    const updatedInscription = updateResult.rows[0];

    // Send decision email
    try {
      await EmailService.sendDecisionNotification(updatedInscription, status, admin_notes);
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: `Inscription ${status} successfully`,
      data: updatedInscription
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update inscription status' 
    });
  } finally {
    client.release();
  }
});

// GET /api/admin/dashboard/stats - Get dashboard statistics
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
  const db = Database.getPool();
  const client = await db.connect();

  try {
    const queries = [
      { key: 'total', query: 'SELECT COUNT(*) as count FROM inscriptions' },
      { key: 'pending', query: 'SELECT COUNT(*) as count FROM inscriptions WHERE status = $1', params: ['pending'] },
      { key: 'approved', query: 'SELECT COUNT(*) as count FROM inscriptions WHERE status = $1', params: ['approved'] },
      { key: 'rejected', query: 'SELECT COUNT(*) as count FROM inscriptions WHERE status = $1', params: ['rejected'] },
      { key: 'today', query: 'SELECT COUNT(*) as count FROM inscriptions WHERE DATE(created_at) = CURRENT_DATE' },
      { key: 'this_week', query: 'SELECT COUNT(*) as count FROM inscriptions WHERE created_at >= CURRENT_DATE - INTERVAL \'7 days\'' }
    ];

    const stats = {};

    // Execute all stat queries
    for (const { key, query, params = [] } of queries) {
      try {
        const result = await client.query(query, params);
        stats[key] = parseInt(result.rows[0].count);
      } catch (err) {
        console.error(`Stats query error for ${key}:`, err);
        stats[key] = 0;
      }
    }

    // Get program distribution
    const programResult = await client.query(
      'SELECT program, COUNT(*) as count FROM inscriptions GROUP BY program ORDER BY count DESC'
    );
    stats.programs = programResult.rows;

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load statistics' 
    });
  } finally {
    client.release();
  }
});

module.exports = router;