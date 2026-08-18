const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    used: {
      type: Boolean,
      default: false
    },
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    usedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Invite', inviteSchema);
