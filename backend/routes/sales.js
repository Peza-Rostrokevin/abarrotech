const express = require('express');
const router = express.Router();
const {
  createSale,
  getMySales,
  getPendingCustomers,
  payCustomer,
  deletePendingSale
} = require('../controllers/saleController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createSale);
router.get('/', getMySales);
router.get('/pending', getPendingCustomers);
router.post('/pay', payCustomer);
router.delete('/:id', deletePendingSale);

module.exports = router;
