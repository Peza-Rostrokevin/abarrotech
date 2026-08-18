const Category = require('../models/Category');
const Product = require('../models/Product');

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener categorías', error: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'El nombre de la categoría es obligatorio' });
    }

    const exists = await Category.findOne({ name: name.trim() });
    if (exists) {
      return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
    }

    const category = await Category.create({ name: name.trim(), createdBy: req.user._id });
    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
    }
    res.status(500).json({ message: 'Error al crear categoría', error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'El nombre de la categoría es obligatorio' });
    }

    const exists = await Category.findOne({ name: name.trim(), _id: { $ne: category._id } });
    if (exists) {
      return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
    }

    category.name = name.trim();
    const updated = await category.save();
    res.json(updated);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
    }
    res.status(500).json({ message: 'Error al actualizar categoría', error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    const productsInCategory = await Product.countDocuments({ categoryId: category._id });
    if (productsInCategory > 0) {
      return res.status(400).json({
        message: `No se puede eliminar: esta categoría tiene ${productsInCategory} producto(s) asignado(s)`
      });
    }

    await category.deleteOne();
    res.json({ message: 'Categoría eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar categoría', error: error.message });
  }
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };
