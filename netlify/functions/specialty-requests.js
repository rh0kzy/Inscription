const database = require('../../config/database-adapter');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Initialize database if not already done
    if (!database.getDbType()) {
      await database.init();
    }

    if (event.httpMethod === 'POST') {
      // Create a new specialty change request
      const {
        matricule,
        currentSpecialty,
        requestedSpecialty,
        motivation,
        priority = 'normal'
      } = JSON.parse(event.body);

      // Validation
      if (!matricule || !currentSpecialty || !requestedSpecialty || !motivation) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Tous les champs sont requis'
          })
        };
      }

      if (currentSpecialty === requestedSpecialty) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Vous ne pouvez pas demander un changement vers votre spécialité actuelle'
          })
        };
      }

      if (motivation.trim().length < 100) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'La motivation doit contenir au moins 100 caractères'
          })
        };
      }

      // Check if student exists
      const studentResult = await database.query(
        'SELECT id FROM students WHERE matricule = ?',
        [matricule]
      );

      if (!studentResult.rows || studentResult.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Étudiant non trouvé'
          })
        };
      }

      // Check if student already has a pending request
      const existingRequestResult = await database.query(
        'SELECT id FROM specialty_change_requests WHERE student_matricule = ? AND status = ?',
        [matricule, 'pending']
      );

      if (existingRequestResult.rows && existingRequestResult.rows.length > 0) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Vous avez déjà une demande en cours. Veuillez attendre la réponse avant de soumettre une nouvelle demande.'
          })
        };
      }

      // Create the request
      const result = await database.query(
        `INSERT INTO specialty_change_requests 
         (student_matricule, current_specialty, requested_specialty, motivation, priority, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [matricule, currentSpecialty, requestedSpecialty, motivation.trim(), priority, 'pending']
      );

      let requestId;
      if (database.getDbType() === 'postgresql') {
        requestId = result.rows[0].id;
      } else {
        requestId = result.insertId;
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Demande de changement de spécialité soumise avec succès',
          requestId: requestId
        })
      };

    } else if (event.httpMethod === 'GET') {
      // Get all requests (admin function)
      const queryParams = event.queryStringParameters || {};
      const { status, specialty, page = 1, limit = 10 } = queryParams;
      
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

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          requests: result.rows || []
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed'
      })
    };

  } catch (error) {
    console.error('Error in specialty requests:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Erreur interne du serveur'
      })
    };
  }
};