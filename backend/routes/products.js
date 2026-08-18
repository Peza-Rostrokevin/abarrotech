const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getMyProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleLikeProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/upload');

router.get('/', getAllProducts);
router.get('/mine', protect, getMyProducts);
router.get('/:id', getProductById);
router.post('/:id/like', toggleLikeProduct);
router.post('/', protect, upload.single('image'), createProduct);
router.put('/:id', protect, upload.single('image'), updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
