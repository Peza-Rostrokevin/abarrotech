const User = require('../models/User');
const Product = require('../models/Product');
const Invite = require('../models/Invite');
const jwt = require('jsonwebtoken');

const generateInvite = async (req, res) => {
  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const token = jwt.sign({ type: 'invite', by: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    await Invite.create({ token, createdBy: req.user._id, expiresAt });

    res.json({ token, expiresInHours: 24 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar invitación', error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'vendedor' }).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener vendedores', error: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { sellerId } = req.query;
    const filter = {};
    if (sellerId) filter.sellerId = sellerId;

    const products = await Product.find(filter).sort({ createdAt: -1 }).populate('sellerId', 'name email location');
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'No se puede eliminar a otro administrador' });
    }

    await Product.deleteMany({ sellerId: user._id });
    await user.deleteOne();
    res.json({ message: 'Vendedor y sus productos eliminados' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

module.exports = { getUsers, getAllProducts, deleteUser, generateInvite };
