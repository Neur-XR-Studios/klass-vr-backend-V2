const { Role } = require("../models");
const logger = require("../config/logger");

// Define the data to be inserted
const roleData = [
  {
    role: "systemadmin",
    permissions: ["commonPermission", "manageRoles", "manageSubscriptions"],
  },
  {
    role: "superadmin",
    permissions: ["commonPermission"],
  },
  {
    role: "admin",
    permissions: [
      "getUsers",
      "manageUsers",
      "getTeachers",
      "manageTeachers",
      "commonPermission",
    ],
  },
  {
    role: "teacher",
    permissions: [
      "getStudents",
      "manageStudents",
      "manageSession",
      "manageAssessment",
      "viewAssessment",
      "commonPermission",
      "manageSession",
      "manageContent",
      "manageVideos",
      "manageImages",
      "getSimulations",
    ],
  },
  {
    role: "repoManager",
    permissions: [
      "commonPermission",
      "manageSession",
      "manageContent",
      "manageVideos",
      "manageModels",
      "manageImages",
      "manageSimulations",
      "getSimulations",
    ],
  },
  {
    role: "user",
    permissions: ["commonPermission"],
  },
];

// Function to seed roles
const seedRole = async () => {
  try {
    for (const role of roleData) {
      // Check if role already exists
      const existingRole = await Role.findOne({ role: role.role });
      // If role doesn't exist, insert it
      if (!existingRole) {
        await Role.create(role);
        logger.info(`Role '${role.role}' seeded successfully!`);
      } else {
        return false;
      }
    }
  } catch (error) {
    console.error(`Error seeding roles: ${error}`);
  }
};

module.exports = {
  seedRole,
};
