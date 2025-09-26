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

// GET /api/admin/inscriptions - Get all inscriptions with filtering and pagination
router.get('/inscriptions', authenticateToken, async (req, res) => {
  try {
    const {
      status = 'all',
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let whereConditions = [];
    let paramIndex = 1;

    // Build WHERE conditions based on filters
    if (status !== 'all') {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.toLowerCase()}%`;
      whereConditions.push(`(
        LOWER(first_name) LIKE $${paramIndex} OR 
        LOWER(last_name) LIKE $${paramIndex + 1} OR 
        LOWER(email) LIKE $${paramIndex + 2} OR 
        LOWER(program) LIKE $${paramIndex + 3}
      )`);
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      paramIndex += 4;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count total records
    const countQuery = `SELECT COUNT(*) FROM inscriptions ${whereClause}`;
    const countResult = await database.query(countQuery, params);
    const totalRecords = parseInt(countResult.rows[0].count);

    // Get inscriptions
    const query = `
      SELECT 
        id, first_name, last_name, email, phone, birth_date,
        address, city, postal_code, country, program, motivation,
        status, created_at, updated_at, admin_notes, processed_by, processed_at
      FROM inscriptions 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const queryParams = [...params, parseInt(limit), offset];
    const result = await database.query(query, queryParams);

    const totalPages = Math.ceil(totalRecords / parseInt(limit));

    res.json({
      success: true,
      data: {
        inscriptions: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords,
          limit: parseInt(limit),
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching inscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inscriptions'
    });
  }
});

// GET /api/admin/inscriptions/:id - Get single inscription
router.get('/inscriptions/:id', authenticateToken, async (req, res) => {
  const inscriptionId = req.params.id;

  try {
    const result = await database.query(
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
    console.error('Error fetching inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inscription details'
    });
  }
});

// PATCH /api/admin/inscriptions/:id - Update inscription status
router.patch('/inscriptions/:id', authenticateToken, async (req, res) => {
  const inscriptionId = req.params.id;
  const { status, admin_notes } = req.body;

  // Validate status
  if (!['pending', 'approved', 'rejected', 'under_review'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value'
    });
  }

  try {
    // First check if inscription exists
    const inscriptionResult = await database.query(
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

    // Update inscription
    const updateResult = await database.query(`
      UPDATE inscriptions 
      SET 
        status = $1,
        admin_notes = $2,
        processed_by = $3,
        processed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [status, admin_notes || null, req.user.email, inscriptionId]);

    const updatedInscription = updateResult.rows[0];

    // Send email notification if status changed to approved or rejected
    if ((status === 'approved' || status === 'rejected') && inscription.status !== status) {
      try {
        // Use the comprehensive sendDecisionNotification method
        await EmailService.sendDecisionNotification(inscription, status, admin_notes || '');
        console.log(`📧 ${status} email sent successfully to ${inscription.email}`);
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Continue without failing the status update
      }
    }

    res.json({
      success: true,
      message: `Inscription ${status} successfully! ${(status === 'approved' || status === 'rejected') ? 'Email notification sent.' : ''}`,
      data: updatedInscription
    });

  } catch (error) {
    console.error('Error updating inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inscription'
    });
  }
});

// PATCH /api/admin/inscriptions/:id/status - Alternative route for status updates
router.patch('/inscriptions/:id/status', authenticateToken, async (req, res) => {
  const inscriptionId = req.params.id;
  const { status, admin_notes } = req.body;

  // Validate status
  if (!['pending', 'approved', 'rejected', 'under_review'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value'
    });
  }

  try {
    // First check if inscription exists
    const inscriptionResult = await database.query(
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

    // Update inscription
    const updateResult = await database.query(`
      UPDATE inscriptions 
      SET 
        status = $1,
        admin_notes = $2,
        processed_by = $3,
        processed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [status, admin_notes || null, req.user.email, inscriptionId]);

    const updatedInscription = updateResult.rows[0];

    // Send email notification if status changed to approved or rejected
    if ((status === 'approved' || status === 'rejected') && inscription.status !== status) {
      try {
        // Use the comprehensive sendDecisionNotification method
        await EmailService.sendDecisionNotification(inscription, status, admin_notes || '');
        console.log(`📧 ${status} email sent successfully to ${inscription.email}`);
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Continue without failing the status update
      }
    }

    res.json({
      success: true,
      message: `Inscription ${status} successfully! ${(status === 'approved' || status === 'rejected') ? 'Email notification sent.' : ''}`,
      data: updatedInscription
    });

  } catch (error) {
    console.error('Error updating inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inscription'
    });
  }
});

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get basic stats using parallel queries
    const queries = [
      'SELECT COUNT(*) FROM inscriptions WHERE status = $1',
      'SELECT COUNT(*) FROM inscriptions WHERE status = $2',
      'SELECT COUNT(*) FROM inscriptions WHERE status = $3',
      'SELECT COUNT(*) FROM inscriptions WHERE status = $4'
    ];
    
    const params = [
      ['pending'],
      ['approved'], 
      ['rejected'],
      ['under_review']
    ];

    // Execute all queries in parallel
    const [pendingResult, approvedResult, rejectedResult, reviewResult] = await Promise.all(
      queries.map((query, index) => database.query(query, params[index]))
    );

    // Get program distribution
    const programResult = await database.query(
      'SELECT program, COUNT(*) as count FROM inscriptions GROUP BY program ORDER BY count DESC'
    );

    res.json({
      success: true,
      data: {
        totalPending: parseInt(pendingResult.rows[0].count),
        totalApproved: parseInt(approvedResult.rows[0].count),
        totalRejected: parseInt(rejectedResult.rows[0].count),
        totalUnderReview: parseInt(reviewResult.rows[0].count),
        programDistribution: programResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

module.exports = router;