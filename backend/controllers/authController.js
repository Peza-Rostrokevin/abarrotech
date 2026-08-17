const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

const register = async (req, res) => {
  try {
    const { name, email, password, phone, inviteToken } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Nombre, email, contraseña y teléfono son obligatorios' });
    }

    if (!inviteToken) {
      return res.status(403).json({ message: 'El registro solo está disponible mediante invitación del administrador' });
    }

    let invited;
    try {
      const jwt = require('jsonwebtoken');
      invited = jwt.verify(inviteToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(403).json({ message: 'Invitación inválida o expirada' });
    }

    if (invited.type !== 'invite') {
      return res.status(403).json({ message: 'Invitación inválida' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Ya existe un usuario con ese email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'vendedor'
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
};

const getMe = async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    phone: req.user.phone
  });
};

module.exports = { register, login, getMe };
