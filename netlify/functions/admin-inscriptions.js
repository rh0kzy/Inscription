const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

// Database configuration
let pool;

function initializeDatabase() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

// Email configuration
let emailTransporter;

function initializeEmail() {
  if (!emailTransporter && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    emailTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return emailTransporter;
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

async function sendDecisionNotification(inscription, decision, adminNotes = '') {
  const transporter = initializeEmail();
  if (!transporter) {
    console.log(`📧 Email not configured - would send ${decision} notification to:`, inscription.email);
    return;
  }

  const isApproved = decision === 'approved';
  const subject = isApproved ? 'Congratulations! Your inscription has been approved' : 'Update on your inscription application';
  const statusColor = isApproved ? '#4caf50' : '#f44336';
  const statusText = isApproved ? 'Approved ✅' : 'Rejected ❌';
  const headerText = isApproved ? '🎉 Congratulations!' : '📋 Application Update';

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: inscription.email,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .email-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .status-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid ${statusColor}; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .status { color: ${statusColor}; font-weight: bold; font-size: 18px; }
          .notes { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>${headerText}</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${inscription.first_name} ${inscription.last_name}</strong>,</p>
            
            ${isApproved ? 
              '<p>We are pleased to inform you that your inscription has been <strong>approved</strong>! Welcome to our program.</p>' :
              '<p>Thank you for your interest in our program. After careful review, we regret to inform you that your application has not been approved at this time.</p>'
            }
            
            <div class="status-box">
              <h3>📋 Application Status</h3>
              <p><strong>Program:</strong> ${inscription.program}</p>
              <p><strong>Status:</strong> <span class="status">${statusText}</span></p>
              <p><strong>Decision Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            ${adminNotes ? `
              <div class="info-box">
                <h3>📝 Additional Notes</h3>
                <div class="notes">${adminNotes}</div>
              </div>
            ` : ''}
            
            ${isApproved ? 
              '<p>You will receive further instructions regarding the next steps in your enrollment process within the next few days.</p>' :
              '<p>We encourage you to apply again in the future. If you have any questions about this decision, please feel free to contact us.</p>'
            }
            
            <p>Thank you for your interest in our program.</p>
            
            <p>Best regards,<br>The Admissions Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 ${decision} notification sent to:`, inscription.email);
  } catch (error) {
    console.error(`❌ Failed to send ${decision} notification:`, error.message);
  }
}

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
      }
    };
  }

  // Check authorization
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Access token required'
      })
    };
  }

  const user = verifyToken(token);
  if (!user) {
    return {
      statusCode: 403,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Invalid or expired token'
      })
    };
  }

  const db = initializeDatabase();

  try {
    if (event.httpMethod === 'GET') {
      // Get all inscriptions with pagination
      const {
        status = 'all',
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = event.queryStringParameters || {};

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
      const countResult = await db.query(countQuery, params);
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
      const result = await db.query(query, queryParams);

      const totalPages = Math.ceil(totalRecords / parseInt(limit));

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          data: {
            inscriptions: result.rows,
            pagination: {
              current_page: parseInt(page),
              total_pages: totalPages,
              total_records: totalRecords,
              limit: parseInt(limit),
              has_next: parseInt(page) < totalPages,
              has_prev: parseInt(page) > 1
            }
          }
        })
      };

    } else if (event.httpMethod === 'PATCH') {
      // Update inscription status
      const pathSegments = event.path.split('/');
      const inscriptionId = pathSegments[pathSegments.length - 2]; // Get ID from path
      const { status, admin_notes } = JSON.parse(event.body);

      if (!inscriptionId) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Inscription ID is required'
          })
        };
      }

      if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Valid status is required (pending, approved, rejected)'
          })
        };
      }

      // Get current inscription
      const inscriptionResult = await db.query('SELECT * FROM inscriptions WHERE id = $1', [inscriptionId]);
      
      if (inscriptionResult.rows.length === 0) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Inscription not found'
          })
        };
      }

      const inscription = inscriptionResult.rows[0];

      // Update inscription
      const updateResult = await db.query(`
        UPDATE inscriptions 
        SET 
          status = $1,
          admin_notes = $2,
          processed_by = $3,
          processed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `, [status, admin_notes || null, user.email, inscriptionId]);

      const updatedInscription = updateResult.rows[0];

      // Send email notification if status changed to approved or rejected
      if ((status === 'approved' || status === 'rejected') && inscription.status !== status) {
        try {
          await sendDecisionNotification(inscription, status, admin_notes || '');
          console.log(`📧 ${status} email sent successfully to ${inscription.email}`);
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
          // Continue without failing the status update
        }
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: `Inscription ${status} successfully! ${(status === 'approved' || status === 'rejected') ? 'Email notification sent.' : ''}`,
          data: updatedInscription
        })
      };

    } else if (event.httpMethod === 'DELETE') {
      // Delete inscription
      const pathSegments = event.path.split('/');
      const inscriptionId = pathSegments[pathSegments.length - 1]; // Get ID from path

      if (!inscriptionId) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Inscription ID is required'
          })
        };
      }

      // Get inscription details before deleting (for logging)
      const inscriptionResult = await db.query('SELECT * FROM inscriptions WHERE id = $1', [inscriptionId]);
      
      if (inscriptionResult.rows.length === 0) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Inscription not found'
          })
        };
      }

      const inscription = inscriptionResult.rows[0];

      // Delete the inscription
      await db.query('DELETE FROM inscriptions WHERE id = $1', [inscriptionId]);

      console.log(`🗑️ Inscription deleted by admin: ID ${inscriptionId}, Email: ${inscription.email}, Name: ${inscription.full_name}`);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'Inscription deleted successfully',
          data: {
            deleted_id: inscriptionId,
            deleted_email: inscription.email,
            deleted_name: inscription.full_name
          }
        })
      };
    }

    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed'
      })
    };

  } catch (error) {
    console.error('Admin error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error'
      })
    };
  }
};