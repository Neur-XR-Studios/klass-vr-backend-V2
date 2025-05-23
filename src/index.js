const mongoose = require('mongoose');
const { app } = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const { userSeeder, roleSeeder, subscriptionSeeder } = require('./seeders');

require('./sockets/socketHandler');

let server;

mongoose
  .connect(config.mongoose.url, config.mongoose.options)
  .then(async () => {
    logger.info('Connected to MongoDB');

    try {
      const userseedingResult = await userSeeder.seedUsers();
      const roleseedingResult = await roleSeeder.seedRole();
      const subscriptionseedingResult = await subscriptionSeeder.seedPlans();

      if (userseedingResult && roleseedingResult && subscriptionseedingResult) {
        logger.info('Seeding successful');
      } else {
        logger.info('DB synced with seeders');
      }

      server = app.listen(config.port, config.host, () => {
        logger.info(`Listening to port ${config.port}`);
      });
    } catch (error) {
      logger.error(`Error during seeding: ${error}`);
    }
  })
  .catch((error) => {
    logger.error(`Error connecting to MongoDB: ${error}`);
  });

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
