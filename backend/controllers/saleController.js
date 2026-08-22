const Sale = require('../models/Sale');
const Product = require('../models/Product');

// Normaliza un nombre para comparación: minúsculas, sin acentos, sin espacios extra
const normalizeName = (name) => {
  return (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

// Minúsculas sin espacios extra (se guarda así en la base de datos)
const toLowerCaseName = (name) => {
  return (name || '').replace(/\s+/g, ' ').trim().toLowerCase();
};

// Primera letra de cada palabra en mayúscula (para mostrar)
const toTitleCase = (name) => {
  return (name || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const createSale = async (req, res) => {
  try {
    const { items, paymentMethod, customerName } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'La venta debe incluir al menos un producto' });
    }

    const method = ['efectivo', 'tarjeta', 'pendiente'].includes(paymentMethod)
      ? paymentMethod
      : 'efectivo';

    if (method === 'pendiente' && !(customerName || '').trim()) {
      return res.status(400).json({ message: 'Las ventas pendientes requieren el nombre del cliente' });
    }

    let total = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Producto no encontrado: ${item.productId}` });
      }

      if (product.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: `No puedes vender "${product.name}": no es tu producto` });
      }

      const quantity = Math.max(1, Number(item.quantity) || 1);

      // Con variantes: buscar la variante y usar su precio/stock
      let variant = null;
      if (product.variants && product.variants.length > 0) {
        const wanted = (item.variantName || '').trim();
        variant = product.variants.find(
          (v) => (v.name || '').toLowerCase() === wanted.toLowerCase()
        );
        if (!variant) {
          return res.status(400).json({
            message: `Debes elegir una variante válida de "${product.name}"`
          });
        }
      }

      const price = Number(item.price) || (variant?.price ?? product.price) || 0;

      if (product.type === 'producto' && !product.isMadeToOrder) {
        const availableStock = variant ? variant.stock : product.stock;
        if (availableStock < quantity) {
          return res.status(400).json({
            message: variant
              ? `Stock insuficiente de "${product.name} (${variant.name})": solo hay ${availableStock}`
              : `Stock insuficiente de "${product.name}": solo hay ${availableStock}`
          });
        }
      }

      total += price * quantity;
      saleItems.push({
        productId: product._id,
        name: variant ? `${product.name} - ${variant.name}` : product.name,
        price,
        quantity,
        variantName: variant ? variant.name : null
      });
    }

    const paid = method === 'pendiente' ? 0 : total;

    const sale = await Sale.create({
      sellerId: req.user._id,
      items: saleItems,
      total,
      paymentMethod: method,
      // Se guarda en minúsculas para que todos los clientes se comparen igual
      customerName: method === 'pendiente' ? toLowerCaseName(customerName) : '',
      paid,
      payments: paid > 0 ? [{ amount: paid }] : []
    });

    for (const item of saleItems) {
      const product = await Product.findById(item.productId);
      if (product.type === 'producto' && !product.isMadeToOrder) {
        if (item.variantName) {
          // Decrementa el stock de la variante específica (re-buscar por nombre,
          // porque la referencia del item apunta al documento anterior)
          const variant = product.variants.find(
            (v) => (v.name || '').toLowerCase() === item.variantName.toLowerCase()
          );
          if (variant) {
            variant.stock = Math.max(0, variant.stock - item.quantity);
          }
          // Disponibilidad: al menos una variante con stock
          product.isAvailable = product.variants.some((v) => v.stock > 0);
        } else {
          product.stock = Math.max(0, product.stock - item.quantity);
          product.isAvailable = product.stock > 0;
        }
        await product.save();
      }
    }

    res.status(201).json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar la venta', error: error.message });
  }
};

// Convierte la fecha recibida (ISO UTC de medianoche local del usuario)
// a un Date real respetando el instante
const parseDate = (s) => {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const getMySales = async (req, res) => {
  try {
    const { from, to, status } = req.query;
    const filter = { sellerId: req.user._id };

    if (from || to) {
      const fromDate = from ? parseDate(from) : null;
      const toDate = to ? parseDate(to) : null;

      if ((from && !fromDate) || (to && !toDate)) {
        return res.status(400).json({ message: 'Las fechas del reporte no son válidas' });
      }

      // Solo agrega createdAt al filtro si hay al menos una fecha válida,
      // para nunca enviarle a Mongoose un valor no parseable
      if (fromDate || toDate) {
        filter.createdAt = {};
        if (fromDate) filter.createdAt.$gte = fromDate;
        if (toDate) {
          const toEnd = new Date(toDate.getTime());
          // +1 día en UTC porque "to" ya viene como medianoche local del usuario
          toEnd.setUTCDate(toEnd.getUTCDate() + 1);
          filter.createdAt.$lt = toEnd;
        }
      }
    }
    if (status && ['pagado', 'pendiente', 'parcial'].includes(status)) {
      filter.status = status;
    }

    const sales = await Sale.find(filter).sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener ventas', error: error.message });
  }
};

const getPendingCustomers = async (req, res) => {
  try {
    const sales = await Sale.find({
      sellerId: req.user._id,
      status: { $in: ['pendiente', 'parcial'] }
    }).sort({ createdAt: 1 });

    const byCustomer = new Map();

    for (const sale of sales) {
      const key = normalizeName(sale.customerName);
      if (!byCustomer.has(key)) {
        byCustomer.set(key, {
          customerName: toTitleCase(sale.customerName),
          totalDebt: 0,
          sales: []
        });
      }
      const entry = byCustomer.get(key);
      const remaining = sale.total - sale.paid;
      entry.totalDebt += remaining;
      entry.sales.push({
        _id: sale._id,
        createdAt: sale.createdAt,
        total: sale.total,
        paid: sale.paid,
        remaining,
        status: sale.status,
        items: sale.items
      });
    }

    const result = Array.from(byCustomer.values()).sort((a, b) =>
      a.customerName.localeCompare(b.customerName)
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener clientes pendientes', error: error.message });
  }
};

const payCustomer = async (req, res) => {
  try {
    const { customerName, amount } = req.body;

    const name = normalizeName(customerName);
    if (!name) {
      return res.status(400).json({ message: 'El nombre del cliente es obligatorio' });
    }

    const payment = Math.max(0, Number(amount) || 0);
    if (payment <= 0) {
      return res.status(400).json({ message: 'El abono debe ser mayor a 0' });
    }

    const pending = await Sale.find({
      sellerId: req.user._id,
      status: { $in: ['pendiente', 'parcial'] }
    })
      .sort({ createdAt: 1 })
      .select('+payments');

    const salesOfCustomer = pending.filter(
      (s) => normalizeName(s.customerName) === name
    );

    if (salesOfCustomer.length === 0) {
      return res.status(404).json({ message: 'No hay deudas pendientes para ese cliente' });
    }

    const totalDebt = salesOfCustomer.reduce((sum, s) => sum + (s.total - s.paid), 0);
    if (payment > totalDebt) {
      return res.status(400).json({ message: `El abono excede el saldo pendiente del cliente ($${totalDebt.toFixed(2)})` });
    }

    let remainingToApply = payment;

    for (const sale of salesOfCustomer) {
      if (remainingToApply <= 0) break;
      const saleRemaining = sale.total - sale.paid;
      if (saleRemaining <= 0) continue;

      const toApply = Math.min(saleRemaining, remainingToApply);
      sale.paid += toApply;
      sale.payments.push({ amount: toApply });
      await sale.save();
      remainingToApply -= toApply;
    }

    res.json({ message: `Abono de $${payment.toFixed(2)} aplicado a "${toTitleCase(name)}"` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar el abono', error: error.message });
  }
};

const deletePendingSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    if (sale.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Solo puedes eliminar tus propias ventas' });
    }

    if (sale.paymentMethod !== 'pendiente' || sale.status === 'pagado') {
      return res.status(400).json({ message: 'Solo se pueden eliminar deudas pendientes' });
    }

    const remaining = sale.total - sale.paid;
    if (remaining <= 0) {
      return res.status(400).json({ message: 'Esta deuda ya está saldada' });
    }

    await sale.deleteOne();
    res.json({ message: 'Deuda eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar la deuda', error: error.message });
  }
};

module.exports = { createSale, getMySales, getPendingCustomers, payCustomer, deletePendingSale };
