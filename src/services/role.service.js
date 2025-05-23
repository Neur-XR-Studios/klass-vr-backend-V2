const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Role } = require('../models');

const getAllRoles = async () => {
  const roles = await Role.find();
  return roles;
};

const updateRolePermissions = async (roleId, permissions) => {
  const role = await Role.findById(roleId);
  if (!role) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
  }
  role.permissions = permissions;
  await role.save();
  return role;
};

module.exports = {
  getAllRoles,
  updateRolePermissions,
};
