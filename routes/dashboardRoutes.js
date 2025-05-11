const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAppointmentsOverview,
  getRevenueChart,
  getPatientAnalytics,
} = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

// All routes are protected
router.use(protect);

// Route: /api/dashboard/stats
router.get('/stats', getDashboardStats);

// Route: /api/dashboard/appointments-overview
router.get('/appointments-overview', getAppointmentsOverview);

// Route: /api/dashboard/revenue-chart
router.get('/revenue-chart', getRevenueChart);

// Route: /api/dashboard/patient-analytics
router.get('/patient-analytics', getPatientAnalytics);

module.exports = router;