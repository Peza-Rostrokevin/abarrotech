const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok = allowed.test(file.mimetype) || allowed.test(file.originalname);
    cb(ok ? null : new Error('Solo se permiten imágenes (jpg, png, gif, webp)'), ok);
  }
});

module.exports = { upload };
