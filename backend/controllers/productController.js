const Product = require('../models/Product');
const { uploadImage } = require('../config/cloudinary');

const imageUrlOf = async (req) => {
  if (req.file) {
    return await uploadImage(req.file.buffer);
  }
  return (req.body.imageUrl || '').trim();
};

const getAllProducts = async (req, res) => {
  try {
    const { q } = req.query;
    const filter = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    const products = await Product.find(filter).sort({ createdAt: -1 }).populate('sellerId', 'name');
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener tus productos', error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('sellerId', 'name email phone');
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el producto', error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, price, location, description } = req.body;

    if (!name || price === undefined || !location) {
      return res.status(400).json({ message: 'Nombre, precio y ubicación son obligatorios' });
    }

    const product = await Product.create({
      name,
      price,
      imageUrl: await imageUrlOf(req),
      location,
      description: description || '',
      sellerId: req.user._id
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear producto', error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const isOwner = product.sellerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Solo puedes editar tus propios productos' });
    }

    const { name, price, location, description } = req.body;
    product.name = name ?? product.name;
    product.price = price ?? product.price;
    if (req.file) {
      product.imageUrl = await imageUrlOf(req);
    } else if (req.body.imageUrl !== undefined) {
      product.imageUrl = req.body.imageUrl.trim();
    }
    product.location = location ?? product.location;
    product.description = description ?? product.description;

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar producto', error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const isOwner = product.sellerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Solo puedes eliminar tus propios productos' });
    }

    await product.deleteOne();
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar producto', error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getMyProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
