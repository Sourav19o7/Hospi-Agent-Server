const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus,
  getPaymentAnalytics,
} = require('../controllers/billingController');
const { protect } = require('../middlewares/authMiddleware');

// All routes are protected
router.use(protect);

// Route: /api/billing/invoices
router.route('/invoices')
  .get(getInvoices)
  .post(createInvoice);

// Route: /api/billing/invoices/:id
router.route('/invoices/:id')
  .get(getInvoiceById);

// Route: /api/billing/invoices/:id/status
router.put('/invoices/:id/status', updateInvoiceStatus);

// Route: /api/billing/analytics
router.get('/analytics', getPaymentAnalytics);

module.exports = router;