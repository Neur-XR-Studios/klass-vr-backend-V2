const { User } = require('../models');
const logger = require('../config/logger');

const userData = [
  {
    name: 'System Admin',
    email: 'systemadmin@example.com',
    password: 'systemadmin123',
    isEmailVerified: true,
    role: 'systemadmin',
  },
  {
    name: 'repoManager',
    email: 'repomanager@example.com',
    password: 'repomanager123',
    isEmailVerified: true,
    role: 'repoManager',
  },
];

// Function to seed users
const seedUsers = async () => {
  try {
    for (const user of userData) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: user.email });

      // If user doesn't exist, insert it
      if (!existingUser) {
        await User.create(user);
        logger.info(`User '${user.name}' seeded successfully!`);
      } else {
        return false;
      }
    }
  } catch (error) {
    console.error(`Error seeding users: ${error}`);
  }
};

module.exports = {
  seedUsers,
};
