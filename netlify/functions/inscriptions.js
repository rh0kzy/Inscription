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

async function sendConfirmationEmail(inscription) {
  const transporter = initializeEmail();
  if (!transporter) return;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: inscription.email,
    subject: 'Inscription Received - Confirmation',
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
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .status-pending { color: #ff9800; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🎓 Inscription Received</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${inscription.first_name} ${inscription.last_name}</strong>,</p>
            
            <p>Thank you for your inscription! We have successfully received your application.</p>
            
            <div class="info-box">
              <h3>📋 Application Details</h3>
              <p><strong>Program:</strong> ${inscription.program}</p>
              <p><strong>Email:</strong> ${inscription.email}</p>
              <p><strong>Status:</strong> <span class="status-pending">Pending Review</span></p>
              <p><strong>Submitted:</strong> ${new Date(inscription.created_at).toLocaleDateString()}</p>
            </div>
            
            <p>Your application is currently under review by our admissions team. You will receive an email notification once a decision has been made.</p>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
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
    console.log('📧 Confirmation email sent to:', inscription.email);
  } catch (error) {
    console.error('❌ Failed to send confirmation email:', error.message);
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  const db = initializeDatabase();

  try {
    if (event.httpMethod === 'GET') {
      // Get all inscriptions (for admin)
      const result = await db.query(`
        SELECT 
          id, first_name, last_name, email, phone, birth_date,
          address, city, postal_code, country, program, motivation,
          status, created_at, updated_at, admin_notes, processed_by, processed_at
        FROM inscriptions 
        ORDER BY created_at DESC
        LIMIT 100
      `);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          data: result.rows
        })
      };

    } else if (event.httpMethod === 'POST') {
      // Create new inscription
      const {
        firstName,
        lastName,
        email,
        phone,
        birthDate,
        address,
        city,
        postalCode,
        country,
        program,
        motivation
      } = JSON.parse(event.body);

      // Validation
      if (!firstName || !lastName || !email || !program) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Missing required fields: firstName, lastName, email, program'
          })
        };
      }

      // Check if email already exists
      const existingResult = await db.query('SELECT id FROM inscriptions WHERE email = $1', [email]);
      
      if (existingResult.rows.length > 0) {
        return {
          statusCode: 409,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'An inscription with this email address already exists'
          })
        };
      }

      // Insert new inscription
      const insertResult = await db.query(`
        INSERT INTO inscriptions (
          first_name, last_name, email, phone, birth_date,
          address, city, postal_code, country, program,
          motivation, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `, [
        firstName, lastName, email, phone, birthDate,
        address, city, postalCode, country, program,
        motivation, 'pending'
      ]);

      const newInscription = insertResult.rows[0];

      // Send confirmation email
      await sendConfirmationEmail(newInscription);

      return {
        statusCode: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'Inscription submitted successfully! Confirmation email sent.',
          data: {
            id: newInscription.id,
            email: newInscription.email,
            status: newInscription.status,
            created_at: newInscription.created_at
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
    console.error('Inscriptions error:', error);
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