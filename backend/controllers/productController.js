const Product = require('../models/Product');
const { uploadImage } = require('../config/cloudinary');

const imageUrlOf = async (req) => {
  if (req.file) {
    return await uploadImage(req.file.buffer);
  }
  return (req.body.imageUrl || '').trim();
};

const toBool = (value) => value === true || value === 'true';

const applyAvailabilityRules = (data) => {
  if (data.type === 'producto' && !data.isMadeToOrder) {
    data.isAvailable = data.stock > 0;
  }
  return data;
};

const getAllProducts = async (req, res) => {
  try {
    const { q, categoryId, sellerId, sortBy, order } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    if (categoryId) {
      filter.categoryId = categoryId;
    }
    if (sellerId) {
      filter.sellerId = sellerId;
    }

    const sortOptions = {
      likes: { likes: order === 'asc' ? 1 : -1 },
      price: { price: order === 'desc' ? -1 : 1 },
      name: { name: order === 'desc' ? -1 : 1 },
      createdAt: { createdAt: -1 }
    };
    const sort = sortOptions[sortBy] || sortOptions.createdAt;

    const products = await Product.find(filter)
      .sort(sort)
      .populate('sellerId', 'name')
      .populate('categoryId', 'name');
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
    const { name, price, location, description, type, stock, isAvailable, isMadeToOrder, categoryId } = req.body;

    const productType = type === 'servicio' ? 'servicio' : 'producto';

    if (!name || !location) {
      return res.status(400).json({ message: 'Nombre y ubicación son obligatorios' });
    }

    if (productType === 'producto' && (price === undefined || price === null || price === '')) {
      return res.status(400).json({ message: 'El precio es obligatorio para productos' });
    }

    const data = {
      name,
      price: productType === 'servicio' && (price === undefined || price === null || price === '')
        ? null
        : Number(price),
      imageUrl: await imageUrlOf(req),
      location,
      description: description || '',
      sellerId: req.user._id,
      type: productType,
      stock: productType === 'producto' ? Number(stock) || 0 : 0,
      isMadeToOrder: productType === 'producto' && toBool(isMadeToOrder),
      isAvailable: toBool(isAvailable),
      categoryId: categoryId || null
    };

    applyAvailabilityRules(data);

    const product = await Product.create(data);

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

    const { name, price, location, description, type, stock, isAvailable, isMadeToOrder, categoryId } = req.body;

    if (type !== undefined) {
      product.type = type === 'servicio' ? 'servicio' : 'producto';
      if (product.type === 'servicio') {
        product.isMadeToOrder = false;
        product.stock = 0;
      }
    }

    if (price !== undefined) {
      if (product.type === 'producto' && (price === null || price === '')) {
        return res.status(400).json({ message: 'El precio es obligatorio para productos' });
      }
      product.price = price === null || price === '' ? null : Number(price);
    }

    if (product.type === 'producto' && stock !== undefined) {
      product.stock = Math.max(0, Number(stock) || 0);
    }

    if (product.type === 'producto' && isMadeToOrder !== undefined) {
      product.isMadeToOrder = toBool(isMadeToOrder);
    }

    if (isAvailable !== undefined) {
      product.isAvailable = toBool(isAvailable);
    }

    if (categoryId !== undefined) {
      product.categoryId = categoryId || null;
    }

    product.name = name ?? product.name;
    if (req.file) {
      product.imageUrl = await imageUrlOf(req);
    } else if (req.body.imageUrl !== undefined) {
      product.imageUrl = req.body.imageUrl.trim();
    }
    product.location = location ?? product.location;
    product.description = description ?? product.description;

    applyAvailabilityRules(product);

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

const toggleLikeProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const action = req.body.action === 'unlike' ? 'unlike' : 'like';

    if (action === 'like') {
      product.likes = (product.likes ?? 0) + 1;
    } else {
      product.likes = Math.max(0, (product.likes ?? 0) - 1);
    }

    const updated = await product.save();
    res.json({ likes: updated.likes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar likes', error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getMyProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleLikeProduct
};
