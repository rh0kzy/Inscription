const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Database configuration
const { Pool } = require('pg');
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

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
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
  }

  try {
    // Debug: Log environment variables availability (without showing values)
    const envCheck = {
      hasAdminEmail: !!process.env.ADMIN_EMAIL,
      hasAdminPassword: !!process.env.ADMIN_PASSWORD,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    };
    
    console.log('Environment variables check:', envCheck);

    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Email and password are required',
          debug: envCheck
        })
      };
    }

    // Use hardcoded fallback if environment variables are not set
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const jwtSecret = process.env.JWT_SECRET || 'inscription-system-jwt-secret-key-2024';

    console.log('Attempting login for:', email);
    console.log('Comparing with admin email:', adminEmail);

    // Check if this is the default admin
    if (email === adminEmail && password === adminPassword) {
      const token = jwt.sign(
        { 
          email: email,
          role: 'admin',
          name: 'Administrator'
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          token: token,
          user: {
            email: email,
            role: 'admin',
            name: 'Administrator'
          },
          message: 'Login successful'
        })
      };
    }

    // If not admin credentials, try database lookup
    if (process.env.DATABASE_URL) {
      try {
        const db = initializeDatabase();
        const result = await db.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );

        if (result.rows.length > 0) {
          const user = result.rows[0];
          const passwordMatch = await bcrypt.compare(password, user.password_hash);

          if (passwordMatch) {
            const token = jwt.sign(
              { 
                userId: user.id,
                email: user.email,
                role: user.role,
                name: user.name
              },
              jwtSecret,
              { expiresIn: '24h' }
            );

            return {
              statusCode: 200,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                success: true,
                token: token,
                user: {
                  email: user.email,
                  role: user.role,
                  name: user.name
                },
                message: 'Login successful'
              })
            };
          }
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue to invalid credentials response
      }
    }

    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Invalid email or password',
        debug: {
          receivedEmail: email,
          expectedEmail: adminEmail,
          envCheck: envCheck
        }
      })
    };

  } catch (error) {
    console.error('Login error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message,
        debug: {
          hasAdminEmail: !!process.env.ADMIN_EMAIL,
          hasAdminPassword: !!process.env.ADMIN_PASSWORD,
          hasJwtSecret: !!process.env.JWT_SECRET
        }
      })
    };
  }
};