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
      // Search for student
      const { matricule } = JSON.parse(event.body);

      if (!matricule || !matricule.trim()) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Le numéro de matricule est requis'
          })
        };
      }

      const result = await database.query(
        'SELECT * FROM students WHERE matricule = ?',
        [matricule.trim()]
      );

      if (!result.rows || result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Aucun étudiant trouvé avec ce numéro de matricule'
          })
        };
      }

      const student = result.rows[0];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
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
    console.error('Error in students search:', error);
    
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