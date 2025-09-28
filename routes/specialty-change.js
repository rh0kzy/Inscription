const database = require('../config/database-adapter');

class SpecialtyChangeController {
  // Search for a student by matricule
  async searchStudent(req, res) {
    try {
      const { matricule } = req.body;

      if (!matricule || !matricule.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Le numéro de matricule est requis'
        });
      }

      const result = await database.query(
        'SELECT * FROM students WHERE matricule = ?',
        [matricule.trim()]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Aucun étudiant trouvé avec ce numéro de matricule'
        });
      }

      const student = result.rows[0];

      res.json({
        success: true,
        student: {
          id: student.id,
          matricule: student.matricule,
          first_name: student.first_name,
          last_name: student.last_name,
          current_specialty: student.current_specialty,
          palier: student.palier,
          section: student.section,
          etat: student.etat
        }
      });

    } catch (error) {
      console.error('Error searching student:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Create a new specialty change request
  async createRequest(req, res) {
    try {
      const {
        matricule,
        currentSpecialty,
        requestedSpecialty,
        motivation,
        priority = 'normal'
      } = req.body;

      // Validation
      if (!matricule || !currentSpecialty || !requestedSpecialty || !motivation) {
        return res.status(400).json({
          success: false,
          message: 'Tous les champs sont requis'
        });
      }

      if (currentSpecialty === requestedSpecialty) {
        return res.status(400).json({
          success: false,
          message: 'Vous ne pouvez pas demander un changement vers votre spécialité actuelle'
        });
      }

      if (motivation.trim().length < 100) {
        return res.status(400).json({
          success: false,
          message: 'La motivation doit contenir au moins 100 caractères'
        });
      }

      // Check if student exists
      const studentResult = await database.query(
        'SELECT id FROM students WHERE matricule = ?',
        [matricule]
      );

      if (!studentResult.rows || studentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Étudiant non trouvé'
        });
      }

      // Check if student already has a pending request
      const existingRequestResult = await database.query(
        'SELECT id FROM specialty_change_requests WHERE student_matricule = ? AND status = ?',
        [matricule, 'pending']
      );

      if (existingRequestResult.rows && existingRequestResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Vous avez déjà une demande en cours. Veuillez attendre la réponse avant de soumettre une nouvelle demande.'
        });
      }

      // Create the request
      let query, params;
      if (database.getDbType() === 'postgresql') {
        query = `INSERT INTO specialty_change_requests 
                 (student_matricule, current_specialty, requested_specialty, motivation, priority, status)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`;
        params = [matricule, currentSpecialty, requestedSpecialty, motivation.trim(), priority, 'pending'];
      } else {
        query = `INSERT INTO specialty_change_requests 
                 (student_matricule, current_specialty, requested_specialty, motivation, priority, status)
                 VALUES (?, ?, ?, ?, ?, ?)`;
        params = [matricule, currentSpecialty, requestedSpecialty, motivation.trim(), priority, 'pending'];
      }

      const result = await database.query(query, params);

      let requestId;
      if (database.getDbType() === 'postgresql') {
        requestId = result.rows[0].id;
      } else {
        requestId = result.insertId || Date.now(); // Fallback to timestamp if insertId not available
      }

      res.status(201).json({
        success: true,
        message: 'Demande de changement de spécialité soumise avec succès',
        requestId: requestId
      });

    } catch (error) {
      console.error('Error creating request:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Get all specialty change requests (for admin)
  async getAllRequests(req, res) {
    try {
      const { status, specialty, page = 1, limit = 10 } = req.query;
      
      let query = `
        SELECT 
          scr.id,
          scr.student_matricule,
          s.first_name,
          s.last_name,
          scr.current_specialty,
          scr.requested_specialty,
          scr.motivation,
          scr.status,
          scr.priority,
          scr.created_at,
          scr.admin_notes,
          scr.processed_by,
          scr.processed_at
        FROM specialty_change_requests scr
        JOIN students s ON scr.student_matricule = s.matricule
      `;
      
      const conditions = [];
      const params = [];

      if (status) {
        conditions.push('scr.status = ?');
        params.push(status);
      }

      if (specialty) {
        conditions.push('scr.requested_specialty = ?');
        params.push(specialty);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY scr.created_at DESC';

      if (limit && limit !== 'all') {
        const offset = (page - 1) * limit;
        if (database.getDbType() === 'postgresql') {
          query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
          params.push(parseInt(limit), offset);
        } else {
          query += ' LIMIT ? OFFSET ?';
          params.push(parseInt(limit), offset);
        }
      }

      const result = await database.query(query, params);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM specialty_change_requests scr
        JOIN students s ON scr.student_matricule = s.matricule
      `;
      
      if (conditions.length > 0) {
        countQuery += ' WHERE ' + conditions.join(' AND ');
      }

      const countResult = await database.query(countQuery, params.slice(0, conditions.length));
      const total = countResult.rows[0].total;

      res.json({
        success: true,
        requests: result.rows || [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: limit === 'all' ? 1 : Math.ceil(total / limit),
          totalRequests: parseInt(total),
          limit: limit === 'all' ? total : parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error getting requests:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Update request status (for admin)
  async updateRequestStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, adminNotes, processedBy } = req.body;

      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Statut invalide'
        });
      }

      let query, params;
      
      if (database.getDbType() === 'postgresql') {
        query = `
          UPDATE specialty_change_requests 
          SET status = $1, admin_notes = $2, processed_by = $3, processed_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `;
        params = [status, adminNotes || null, processedBy || null, id];
      } else {
        query = `
          UPDATE specialty_change_requests 
          SET status = ?, admin_notes = ?, processed_by = ?, processed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        params = [status, adminNotes || null, processedBy || null, id];
      }

      const result = await database.query(query, params);

      if (result.rowCount === 0 && result.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Demande non trouvée'
        });
      }

      res.json({
        success: true,
        message: 'Statut de la demande mis à jour avec succès'
      });

    } catch (error) {
      console.error('Error updating request status:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Get statistics (for admin dashboard)
  async getStatistics(req, res) {
    try {
      // Total requests by status
      const statusStatsResult = await database.query(`
        SELECT status, COUNT(*) as count
        FROM specialty_change_requests
        GROUP BY status
      `);

      // Requests by requested specialty
      const specialtyStatsResult = await database.query(`
        SELECT requested_specialty, COUNT(*) as count
        FROM specialty_change_requests
        GROUP BY requested_specialty
      `);

      // Students by current specialty
      const currentSpecialtyStatsResult = await database.query(`
        SELECT current_specialty, COUNT(*) as count
        FROM students
        GROUP BY current_specialty
      `);

      // Recent requests (last 7 days)
      let recentQuery;
      if (database.getDbType() === 'postgresql') {
        recentQuery = `
          SELECT COUNT(*) as count
          FROM specialty_change_requests
          WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        `;
      } else {
        recentQuery = `
          SELECT COUNT(*) as count
          FROM specialty_change_requests
          WHERE created_at >= datetime('now', '-7 days')
        `;
      }
      
      const recentRequestsResult = await database.query(recentQuery);

      res.json({
        success: true,
        statistics: {
          requestsByStatus: statusStatsResult.rows || [],
          requestsBySpecialty: specialtyStatsResult.rows || [],
          studentsByCurrentSpecialty: currentSpecialtyStatsResult.rows || [],
          recentRequestsCount: recentRequestsResult.rows[0]?.count || 0
        }
      });

    } catch (error) {
      console.error('Error getting statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = new SpecialtyChangeController();