// routes/insightRoutes.js
const express = require('express');
const router = express.Router();
const {
  getInsights,
  getInsightById,
  getInsightStats,
  applyInsight,
  dismissInsight,
  generateInsights,
} = require('../controllers/insightController');
const { protect } = require('../middlewares/authMiddleware');

// All routes are protected
router.use(protect);

// Routes for insights
router.route('/')
  .get(getInsights);

router.route('/stats')
  .get(getInsightStats);

router.route('/generate')
  .post(generateInsights);

router.route('/:id')
  .get(getInsightById);

router.route('/:id/apply')
  .post(applyInsight);

router.route('/:id/dismiss')
  .post(dismissInsight);

module.exports = router;