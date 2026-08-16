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
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo']
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
