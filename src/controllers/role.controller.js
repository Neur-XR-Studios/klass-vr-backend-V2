const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { roleService } = require('../services');

const getAllRoles = catchAsync(async (req, res) => {
  const roles = await roleService.getAllRoles();
  res.status(httpStatus.OK).send(roles);
});

const updateRolePermissions = catchAsync(async (req, res) => {
  const { roleId } = req.params;
  const { permissions } = req.body;
  const role = await roleService.updateRolePermissions(roleId, permissions);
  res.status(httpStatus.OK).send(role);
});

module.exports = {
  getAllRoles,
  updateRolePermissions,
};
