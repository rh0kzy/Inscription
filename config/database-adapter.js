const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

class DatabaseAdapter {
  constructor() {
    this.pool = null;
    this.db = null;
    this.dbType = null;
    this.initialized = false;
  }

  async init() {
    // First, try to connect to PostgreSQL (Supabase)
    try {
      console.log('🔗 Attempting to connect to PostgreSQL (Supabase)...');
      await this.initPostgreSQL();
      console.log('✅ Connected to PostgreSQL database (Supabase)');
      this.initialized = true;
      return this.dbType;
    } catch (pgError) {
      console.log('⚠️  PostgreSQL connection failed, falling back to SQLite...');
      console.log('📝 Error:', pgError.message);
      this.initSQLite();
      this.initialized = true;
      return this.dbType;
    }
  }

  async initPostgreSQL() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'db.sqzfbwybvqmsdmgrctfe.supabase.co',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'Covid-19',
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    });

    // Test connection by attempting to connect
    const client = await this.pool.connect();
    client.release();
    
    this.dbType = 'postgresql';
    await this.createPostgreSQLTables();
    await this.createDefaultAdmin();
  }

  initSQLite() {
    const dbPath = path.join(__dirname, '..', 'database', 'inscriptions.db');
    const dbDir = path.dirname(dbPath);
    
    const fs = require('fs');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        throw new Error(`SQLite connection failed: ${err.message}`);
      }
      this.dbType = 'sqlite';
      console.log('✅ Connected to SQLite database (local fallback)');
      this.createSQLiteTables();
    });
  }

  async createPostgreSQLTables() {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS inscriptions (
          id SERIAL PRIMARY KEY,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(50) NOT NULL,
          birth_date DATE NOT NULL,
          address TEXT NOT NULL,
          city TEXT NOT NULL,
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

      await client.query(`CREATE INDEX IF NOT EXISTS idx_inscriptions_status ON inscriptions(status)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_inscriptions_created_at ON inscriptions(created_at)`);

      console.log('✅ PostgreSQL tables created successfully');
    } finally {
      client.release();
    }
  }

  createSQLiteTables() {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS inscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT NOT NULL,
          birth_date TEXT NOT NULL,
          address TEXT NOT NULL,
          city TEXT NOT NULL,
          postal_code TEXT NOT NULL,
          country TEXT NOT NULL,
          program TEXT NOT NULL,
          motivation TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          admin_notes TEXT,
          processed_by TEXT,
          processed_at DATETIME
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT DEFAULT 'admin',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        )
      `, (err) => {
        if (!err) {
          console.log('✅ SQLite tables created successfully');
          this.createDefaultAdmin();
        }
      });
    });
  }

  async createDefaultAdmin() {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    
    try {
      if (this.dbType === 'postgresql') {
        const client = await this.pool.connect();
        try {
          const result = await client.query('SELECT id FROM admin_users WHERE email = $1', [adminEmail]);
          
          if (result.rows.length === 0) {
            const hashedPassword = await bcrypt.hash(adminPassword, 12);
            await client.query(
              'INSERT INTO admin_users (email, password_hash, name) VALUES ($1, $2, $3)',
              [adminEmail, hashedPassword, 'Administrator']
            );
            this.logAdminCreated(adminEmail, adminPassword);
          }
        } finally {
          client.release();
        }
      } else {
        // SQLite
        this.db.get('SELECT id FROM admin_users WHERE email = ?', [adminEmail], async (err, row) => {
          if (err) return;
          
          if (!row) {
            const hashedPassword = await bcrypt.hash(adminPassword, 12);
            this.db.run(
              'INSERT INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)',
              [adminEmail, hashedPassword, 'Administrator'],
              (err) => {
                if (!err) {
                  this.logAdminCreated(adminEmail, adminPassword);
                }
              }
            );
          }
        });
      }
    } catch (error) {
      console.error('Error creating admin:', error.message);
    }
  }

  logAdminCreated(email, password) {
    console.log('\n👨‍💼 Default admin user created:');
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Password: ${password}`);
    console.log('   ⚠️  Please change the password after first login!\n');
  }

  // Unified query interface
  async query(text, params = []) {
    if (!this.initialized) {
      throw new Error('Database not initialized. Call init() first.');
    }

    if (this.dbType === 'postgresql') {
      const client = await this.pool.connect();
      try {
        // Convert SQLite-style parameters (?, ?, ?) to PostgreSQL-style ($1, $2, $3)
        let pgQuery = text;
        let paramIndex = 1;
        pgQuery = pgQuery.replace(/\?/g, () => `$${paramIndex++}`);
        
        const result = await client.query(pgQuery, params);
        return result;
      } finally {
        client.release();
      }
    } else {
      // For SQLite, convert PostgreSQL-style parameters ($1, $2) to SQLite-style (?, ?)
      const sqliteQuery = text.replace(/\$\d+/g, '?');
      
      return new Promise((resolve, reject) => {
        const isSelect = text.toLowerCase().trim().startsWith('select');
        
        if (isSelect) {
          const isGetOne = text.toLowerCase().includes('limit 1') || 
                          (text.toLowerCase().includes('where') && text.toLowerCase().includes('id ='));
          
          if (isGetOne) {
            this.db.get(sqliteQuery, params, (err, row) => {
              if (err) reject(err);
              else resolve({ rows: row ? [row] : [] });
            });
          } else {
            this.db.all(sqliteQuery, params, (err, rows) => {
              if (err) reject(err);
              else resolve({ rows: rows || [] });
            });
          }
        } else {
          this.db.run(sqliteQuery, params, function(err) {
            if (err) reject(err);
            else {
              resolve({ 
                rows: [{ id: this.lastID }], 
                rowCount: this.changes,
                insertId: this.lastID 
              });
            }
          });
        }
      });
    }
  }

  getDbType() {
    return this.dbType;
  }

  async close() {
    if (this.dbType === 'postgresql' && this.pool) {
      await this.pool.end();
    } else if (this.dbType === 'sqlite' && this.db) {
      this.db.close();
    }
  }
}

module.exports = new DatabaseAdapter();