const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

class Database {
  constructor() {
    this.pool = null;
  }

  init() {
    // Use individual connection parameters for better compatibility
    this.pool = new Pool({
      host: process.env.DB_HOST || 'db.pssxppgtoliwdvyhiftx.supabase.co',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'test123',
      ssl: {
        rejectUnauthorized: false // For Supabase
      },
      max: 20, // Maximum number of connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('connect', () => {
      console.log('📁 Connected to PostgreSQL database (Supabase)');
    });

    this.pool.on('error', (err) => {
      console.error('Database connection error:', err);
    });

    // Test connection and create tables
    this.testConnection();
  }

  async testConnection() {
    try {
      const client = await this.pool.connect();
      console.log('✅ Database connection successful');
      client.release();
      await this.createTables();
      await this.createDefaultAdmin();
    } catch (err) {
      console.error('❌ Database connection failed:', err.message);
    }
  }

  async createTables() {
    const client = await this.pool.connect();
    
    try {
      // Create inscriptions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS inscriptions (
          id SERIAL PRIMARY KEY,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(50) NOT NULL,
          birth_date DATE NOT NULL,
          address TEXT NOT NULL,
          city VARCHAR(255) NOT NULL,
          postal_code VARCHAR(20) NOT NULL,
          country VARCHAR(255) NOT NULL,
          program VARCHAR(255) NOT NULL,
          motivation TEXT NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          admin_notes TEXT,
          processed_by VARCHAR(255),
          processed_at TIMESTAMP
        )
      `);

      // Create admin users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'admin',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP
        )
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_inscriptions_status ON inscriptions(status);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_inscriptions_created_at ON inscriptions(created_at);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_inscriptions_email ON inscriptions(email);
      `);

      console.log('✅ Database tables and indexes created successfully');
    } catch (err) {
      console.error('❌ Error creating tables:', err.message);
    } finally {
      client.release();
    }
  }

  async createDefaultAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const client = await this.pool.connect();
    
    try {
      // Check if admin exists
      const result = await client.query(
        'SELECT id FROM admin_users WHERE email = $1',
        [adminEmail]
      );
      
      if (result.rows.length === 0) {
        // Create default admin
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        await client.query(
          'INSERT INTO admin_users (email, password_hash, name) VALUES ($1, $2, $3)',
          [adminEmail, hashedPassword, 'Administrator']
        );
        
        console.log('👨‍💼 Default admin created:');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log('   ⚠️  Please change the password after first login!');
      }
    } catch (err) {
      console.error('❌ Error creating admin:', err.message);
    } finally {
      client.release();
    }
  }

  getPool() {
    return this.pool;
  }

  async query(text, params) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('Database connection closed');
    }
  }
}

module.exports = new Database();