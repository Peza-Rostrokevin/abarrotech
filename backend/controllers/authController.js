const User = require('../models/User');
const Invite = require('../models/Invite');
const { generateToken } = require('../utils/jwt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { name, email, password, phone, location, inviteToken } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Nombre, email, contraseña y teléfono son obligatorios' });
    }

    if (!inviteToken) {
      return res.status(403).json({ message: 'El registro solo está disponible mediante invitación del administrador' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let invited;
    try {
      invited = jwt.verify(inviteToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(403).json({ message: 'Invitación inválida o expirada' });
    }

    if (invited.type !== 'invite') {
      return res.status(403).json({ message: 'Invitación inválida' });
    }

    const invite = await Invite.findOne({ token: inviteToken });
    if (!invite) {
      return res.status(403).json({ message: 'Invitación inválida o expirada' });
    }
    if (invite.used) {
      return res.status(403).json({ message: 'Esta invitación ya fue utilizada' });
    }
    if (invite.expiresAt < new Date()) {
      return res.status(403).json({ message: 'Invitación inválida o expirada' });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'Ya existe un usuario con ese email' });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone,
      location: location || '',
      role: 'vendedor'
    });

    invite.used = true;
    invite.usedBy = user._id;
    invite.usedAt = new Date();
    await invite.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      location: user.location,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ya existe un usuario con ese email' });
    }
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
      location: user.location,
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
    phone: req.user.phone,
    location: req.user.location
  });
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, location } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Nombre, email y WhatsApp son obligatorios' });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'El WhatsApp debe tener exactamente 10 dígitos' });
    }

    if (email !== req.user.email) {
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: 'Ya existe un usuario con ese email' });
      }
    }

    if (req.body.location !== undefined) {
      req.user.location = req.body.location.trim();
    }
    req.user.name = name;
    req.user.email = email;
    req.user.phone = phone;
    await req.user.save();

    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      location: req.user.location
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar perfil', error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Contraseña actual y nueva son obligatorias' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al cambiar contraseña', error: error.message });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
