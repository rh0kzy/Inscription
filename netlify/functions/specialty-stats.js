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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed'
      })
    };
  }

  try {
    // Initialize database if not already done
    if (!database.getDbType()) {
      await database.init();
    }

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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        statistics: {
          requestsByStatus: statusStatsResult.rows || [],
          requestsBySpecialty: specialtyStatsResult.rows || [],
          studentsByCurrentSpecialty: currentSpecialtyStatsResult.rows || [],
          recentRequestsCount: recentRequestsResult.rows[0]?.count || 0
        }
      })
    };

  } catch (error) {
    console.error('Error getting statistics:', error);
    
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