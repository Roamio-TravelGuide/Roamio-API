const tripModel = require('../../models/tripModel');

const getAllTrips = async (req, res) => {
  try {
    const trips = await tripModel.getAllTrips();
    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
};

module.exports = { getAllTrips };