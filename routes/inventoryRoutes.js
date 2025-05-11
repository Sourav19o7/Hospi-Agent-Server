const express = require('express');
const router = express.Router();
const {
  getInventoryItems,
  getInventoryItemById,
  getInventoryAlerts,
  createInventoryItem,
  updateInventoryItem,
  updateInventoryStock,
  deleteInventoryItem,
} = require('../controllers/inventoryController');
const { protect } = require('../middlewares/authMiddleware');

// All routes are protected
router.use(protect);

// Route: /api/inventory
router.route('/')
  .get(getInventoryItems)
  .post(createInventoryItem);

// Route: /api/inventory/alerts
router.get('/alerts', getInventoryAlerts);

// Route: /api/inventory/:id
router.route('/:id')
  .get(getInventoryItemById)
  .put(updateInventoryItem)
  .delete(deleteInventoryItem);

// Route: /api/inventory/:id/stock
router.put('/:id/stock', updateInventoryStock);

module.exports = router;