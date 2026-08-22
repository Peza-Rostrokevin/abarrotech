const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    variantName: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paidAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: {
      type: [saleItemSchema],
      required: true
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['efectivo', 'tarjeta', 'pendiente'],
      required: true
    },
    customerName: {
      type: String,
      trim: true,
      default: ''
    },
    paid: {
      type: Number,
      default: 0,
      min: 0
    },
    payments: {
      type: [paymentSchema],
      default: []
    },
    status: {
      type: String,
      enum: ['pagado', 'pendiente', 'parcial'],
      default: 'pagado'
    }
  },
  {
    timestamps: true
  }
);

saleSchema.pre('save', function (next) {
  if (this.paymentMethod === 'pendiente') {
    if (this.paid >= this.total && this.total > 0) {
      this.status = 'pagado';
    } else if (this.paid > 0) {
      this.status = 'parcial';
    } else {
      this.status = 'pendiente';
    }
  } else {
    this.status = 'pagado';
  }
  next();
});

module.exports = mongoose.model('Sale', saleSchema);
