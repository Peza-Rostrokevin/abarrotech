const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true
    },
    price: {
      type: Number,
      min: [0, 'El precio no puede ser negativo'],
      default: null
    },
    type: {
      type: String,
      enum: ['producto', 'servicio'],
      default: 'producto'
    },
    stock: {
      type: Number,
      min: [0, 'El stock no puede ser negativo'],
      default: 0
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    isMadeToOrder: {
      type: Boolean,
      default: false
    },
    likes: {
      type: Number,
      default: 0,
      min: [0, 'Los likes no pueden ser negativos']
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    imageUrl: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      required: [true, 'La ubicacion es obligatoria'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Product', productSchema);
