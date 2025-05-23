const mongoose = require('mongoose');

const LoginDetailSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ip_address: {
      type: String,
    },
    user_agent: {
      type: String,
    },
    longitude: {
      type: Number,
    },
    latitude: {
      type: Number,
    },
    isSuspicious: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * @typedef LoginDetail
 */
const LoginDetail = mongoose.model('LoginDetail', LoginDetailSchema);

module.exports = LoginDetail;
