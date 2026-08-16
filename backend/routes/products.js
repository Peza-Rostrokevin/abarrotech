const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/upload');

router.get('/', getAllProducts);
router.get('/mine', protect, getMyProducts);
router.post('/', protect, upload.single('image'), createProduct);
router.put('/:id', protect, upload.single('image'), updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
