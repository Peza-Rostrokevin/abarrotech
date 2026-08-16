const express = require('express');
const router = express.Router();
const { getUsers, getAllProducts, deleteUser } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.use(protect, authorize('admin'));

router.get('/users', getUsers);
router.get('/products', getAllProducts);
router.delete('/users/:id', deleteUser);

module.exports = router;
