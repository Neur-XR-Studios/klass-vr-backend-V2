// const allRoles = {
//   admin: ['getUsers', 'manageUsers', 'getTeachers', 'manageTeachers', 'commonPermission'],
// teacher: [
//   'getStudents',
//   'manageStudents',
//   'manageSession',
//   'manageAssessment',
//   'viewAssessment',
//   'commonPermission',
//   'manageSession',
//   'manageContent',
// ],
//   superadmin: ['commonPermission'],
//   systemadmin: ['commonPermission'.'manageRoles'],
//   student: ['viewAssessment', 'commonPermission'],
// };

// const roles = Object.keys(allRoles);
// const roleRights = new Map(Object.entries(allRoles));

// module.exports = {
//   roles,
//   roleRights,
// };

const { Role } = require('../models');

// Middleware function to check permissions
async function checkPermissions(roleName, permissionName) {
  console.log(roleName, 'roleName');
  console.log(permissionName, 'permissionName');
  try {
    const role = await Role.findOne({ role: roleName }).lean();

    if (role && role.permissions.includes(permissionName)) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

function authorize(permissionName) {
  return async (req, res, next) => {
    const roleName = req.user.role;
    const hasPermission = await checkPermissions(roleName, permissionName);
    if (hasPermission) {
      next();
    } else {
      res.status(403).send('Forbidden');
    }
  };
}

const roles = async () => {
  try {
    const roles = await Role.find({}, 'role');
    console.error('Error fetching role names:', roles);
    return roles.map((role) => role.role);
  } catch (error) {
    console.error('Error fetching role names:', error);
    throw error;
  }
};
module.exports = {
  authorize,
  roles,
};
