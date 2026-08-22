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
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    // Variantes del producto (ej. sabores). Si el array está vacío,
    // el producto se maneja como hoy (precio/stock/imagen directos)
    variants: {
      type: [
        {
          name: {
            type: String,
            required: [true, 'El nombre de la variante es obligatorio'],
            trim: true
          },
          price: {
            type: Number,
            min: [0, 'El precio no puede ser negativo'],
            default: null
          },
          stock: {
            type: Number,
            min: [0, 'El stock no puede ser negativo'],
            default: 0
          },
          imageUrl: {
            type: String,
            default: ''
          }
        }
      ],
      default: []
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
