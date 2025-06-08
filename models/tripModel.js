const pool = require('../config/db');

const getAllTrips = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM trip');
    return result.rows;
  } finally {
    client.release();
  }
};

module.exports = { getAllTrips };