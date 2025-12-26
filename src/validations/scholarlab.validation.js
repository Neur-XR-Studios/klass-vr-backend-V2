const Joi = require('joi');

const getSimulations = {
    query: Joi.object().keys({
        grade: Joi.string().required().description('Grade for simulations (e.g., "9", "10")'),
        subject: Joi.string().default('Science').description('Subject for simulations'),
    }),
};

const launchSimulation = {
    body: Joi.object().keys({
        simulationId: Joi.string().required().description('Unique simulation identifier'),
        simulationUrl: Joi.string().uri().required().description('Base WebGL URL for the simulation'),
        grade: Joi.string().required().description('Grade for the simulation'),
        subject: Joi.string().default('Science').description('Subject for the simulation'),
    }),
};

module.exports = {
    getSimulations,
    launchSimulation,
};
