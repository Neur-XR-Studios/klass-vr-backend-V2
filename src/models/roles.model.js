const mongoose = require('mongoose');

const roleSchema = mongoose.Schema({
  role: {
    type: String,
    required: true,
    unique: true,
  },
  permissions: [
    {
      type: String,
      required: true,
    },
  ],
});

/**
 * @typedef role
 */
const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
