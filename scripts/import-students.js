const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const database = require('../config/database-adapter');

class StudentImporter {
  constructor() {
    this.csvFiles = [
      {
        file: 'ING3 IA A (Liste Affichage) - ING3 IA A.csv',
        specialty: 'IA' // Artificial Intelligence
      },
      {
        file: 'ING3 Sécurité A (Liste Affichage) - ING3 SECU A.csv',
        specialty: 'SECU' // Cybersecurity
      },
      {
        file: 'ING3 Software Engineering A (Liste Affichage) - ING3 GL A.csv',
        specialty: 'GL' // Software Engineering (Génie Logiciel)
      }
    ];
    this.students = [];
  }

  async createStudentsTable() {
    try {
      if (database.getDbType() === 'postgresql') {
        await database.query(`
          CREATE TABLE IF NOT EXISTS students (
            id SERIAL PRIMARY KEY,
            matricule VARCHAR(50) UNIQUE NOT NULL,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            current_specialty VARCHAR(10) NOT NULL,
            palier VARCHAR(10) NOT NULL,
            section VARCHAR(10) NOT NULL,
            etat VARCHAR(10) NOT NULL,
            groupe_td VARCHAR(10),
            groupe_tp VARCHAR(10),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await database.query(`
          CREATE TABLE IF NOT EXISTS specialty_change_requests (
            id SERIAL PRIMARY KEY,
            student_matricule VARCHAR(50) NOT NULL,
            current_specialty VARCHAR(10) NOT NULL,
            requested_specialty VARCHAR(10) NOT NULL,
            motivation TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            priority VARCHAR(10) DEFAULT 'normal',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            admin_notes TEXT,
            processed_by VARCHAR(255),
            processed_at TIMESTAMP
          )
        `);

        // Create indexes
        await database.query(`CREATE INDEX IF NOT EXISTS idx_students_matricule ON students(matricule)`);
        await database.query(`CREATE INDEX IF NOT EXISTS idx_students_specialty ON students(current_specialty)`);
        await database.query(`CREATE INDEX IF NOT EXISTS idx_specialty_requests_status ON specialty_change_requests(status)`);
        await database.query(`CREATE INDEX IF NOT EXISTS idx_specialty_requests_matricule ON specialty_change_requests(student_matricule)`);

      } else {
        // SQLite
        await database.query(`
          CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            matricule TEXT UNIQUE NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            current_specialty TEXT NOT NULL,
            palier TEXT NOT NULL,
            section TEXT NOT NULL,
            etat TEXT NOT NULL,
            groupe_td TEXT,
            groupe_tp TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await database.query(`
          CREATE TABLE IF NOT EXISTS specialty_change_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_matricule TEXT NOT NULL,
            current_specialty TEXT NOT NULL,
            requested_specialty TEXT NOT NULL,
            motivation TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            priority TEXT DEFAULT 'normal',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            admin_notes TEXT,
            processed_by TEXT,
            processed_at DATETIME
          )
        `);
      }

      console.log('✅ Students table created successfully');
    } catch (error) {
      console.error('❌ Error creating students table:', error.message);
      throw error;
    }
  }

  parseCSVLine(line) {
    // CSV format: N°,Palier,Spécialité,Section,Matricule,Nom,Prénom,Etat,Groupe TD,Groupe TP,...
    const parts = line.split(',');
    
    if (parts.length < 10) return null;
    
    const numero = parts[0]?.trim();
    const palier = parts[1]?.trim();
    const specialite = parts[2]?.trim();
    const section = parts[3]?.trim();
    const matricule = parts[4]?.trim();
    const nom = parts[5]?.trim();
    const prenom = parts[6]?.trim();
    const etat = parts[7]?.trim();
    const groupeTD = parts[8]?.trim();
    const groupeTP = parts[9]?.trim();

    // Skip header rows and empty rows
    if (!numero || !matricule || numero === 'N°' || !nom || !prenom) {
      return null;
    }

    return {
      numero,
      palier,
      specialite,
      section,
      matricule,
      nom,
      prenom,
      etat,
      groupeTD,
      groupeTP
    };
  }

  async importStudentsFromFile(filePath, specialty) {
    return new Promise((resolve, reject) => {
      const students = [];
      const fullPath = path.join(__dirname, '..', 'database', filePath);
      
      console.log(`📁 Reading file: ${fullPath}`);
      
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const lines = fileContent.split('\n');
      
      console.log(`📄 Total lines in file: ${lines.length}`);
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const student = this.parseCSVLine(line);
        if (student && student.matricule && student.nom && student.prenom) {
          students.push({
            matricule: student.matricule,
            firstName: student.prenom,
            lastName: student.nom,
            specialty: specialty,
            palier: student.palier,
            section: student.section,
            etat: student.etat,
            groupeTD: student.groupeTD || null,
            groupeTP: student.groupeTP || null
          });
        }
      }
      
      console.log(`✅ Parsed ${students.length} students from ${filePath}`);
      resolve(students);
    });
  }

  async importAllStudents() {
    console.log('🚀 Starting student import process...');
    
    try {
      // Initialize database
      if (!database.getDbType()) {
        await database.init();
      }

      // Create students table
      await this.createStudentsTable();
      
      // Clear existing students
      await database.query('DELETE FROM students');
      console.log('🗑️ Cleared existing students data');

      // Import from each CSV file
      for (const csvFile of this.csvFiles) {
        const students = await this.importStudentsFromFile(csvFile.file, csvFile.specialty);
        
        // Insert students into database
        for (const student of students) {
          try {
            if (database.getDbType() === 'postgresql') {
              await database.query(`
                INSERT INTO students (matricule, first_name, last_name, current_specialty, palier, section, etat, groupe_td, groupe_tp)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (matricule) DO UPDATE SET
                  first_name = EXCLUDED.first_name,
                  last_name = EXCLUDED.last_name,
                  current_specialty = EXCLUDED.current_specialty,
                  palier = EXCLUDED.palier,
                  section = EXCLUDED.section,
                  etat = EXCLUDED.etat,
                  groupe_td = EXCLUDED.groupe_td,
                  groupe_tp = EXCLUDED.groupe_tp,
                  updated_at = CURRENT_TIMESTAMP
              `, [
                student.matricule,
                student.firstName,
                student.lastName,
                student.specialty,
                student.palier,
                student.section,
                student.etat,
                student.groupeTD,
                student.groupeTP
              ]);
            } else {
              // SQLite - use INSERT OR REPLACE
              await database.query(`
                INSERT OR REPLACE INTO students (matricule, first_name, last_name, current_specialty, palier, section, etat, groupe_td, groupe_tp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `, [
                student.matricule,
                student.firstName,
                student.lastName,
                student.specialty,
                student.palier,
                student.section,
                student.etat,
                student.groupeTD,
                student.groupeTP
              ]);
            }
          } catch (error) {
            console.error(`❌ Error inserting student ${student.matricule}:`, error.message);
          }
        }
        
        console.log(`✅ Imported ${students.length} students from ${csvFile.specialty} specialty`);
      }

      // Get final count
      const result = await database.query('SELECT COUNT(*) as count FROM students');
      const totalStudents = result.rows[0].count;
      
      console.log(`🎉 Successfully imported ${totalStudents} students total!`);
      
      // Show breakdown by specialty
      const breakdown = await database.query(`
        SELECT current_specialty, COUNT(*) as count 
        FROM students 
        GROUP BY current_specialty 
        ORDER BY current_specialty
      `);
      
      console.log('\n📊 Students by specialty:');
      breakdown.rows.forEach(row => {
        const specialtyName = {
          'IA': 'Artificial Intelligence',
          'SECU': 'Cybersecurity',
          'GL': 'Software Engineering'
        }[row.current_specialty] || row.current_specialty;
        
        console.log(`   ${specialtyName} (${row.current_specialty}): ${row.count} students`);
      });

    } catch (error) {
      console.error('❌ Import failed:', error.message);
      throw error;
    }
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  const importer = new StudentImporter();
  importer.importAllStudents()
    .then(() => {
      console.log('✅ Import completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

module.exports = StudentImporter;