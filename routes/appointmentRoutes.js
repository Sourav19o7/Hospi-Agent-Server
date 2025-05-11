const express = require('express');
const router = express.Router();
const {
  getAppointments,
  getTodayAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointmentController');
const { protect } = require('../middlewares/authMiddleware');

// All routes are protected
router.use(protect);

// Route: /api/appointments
router.route('/')
  .get(getAppointments)
  .post(createAppointment);

// Route: /api/appointments/today
router.get('/today', getTodayAppointments);

// Route: /api/appointments/:id
router.route('/:id')
  .get(getAppointmentById)
  .put(updateAppointment)
  .delete(deleteAppointment);

module.exports = router;