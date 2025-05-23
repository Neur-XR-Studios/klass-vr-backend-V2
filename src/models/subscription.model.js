const mongoose = require('mongoose');

const subscriptionSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    term: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);
/**
 * @typedef Subscription
 */
const Subscription = mongoose.model('subscritpion', subscriptionSchema);

module.exports = Subscription;
