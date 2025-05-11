const express = require('express');
const router = express.Router({ mergeParams: true });
const { getPatientAppointments } = require('../controllers/appointmentController');
const { protect } = require('../middlewares/authMiddleware');

// All routes are protected
router.use(protect);

// Route: /api/patients/:patientId/appointments
router.route('/')
  .get(getPatientAppointments);

module.exports = router;