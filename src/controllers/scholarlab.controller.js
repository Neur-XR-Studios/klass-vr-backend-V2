const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { scholarlabService } = require('../services');
const ApiError = require('../utils/ApiError');

/**
 * Get available simulations for the authenticated user
 * Requires grade and optionally subject as query params
 */
const getSimulations = catchAsync(async (req, res) => {
    const { grade, subject } = req.query;

    if (!grade) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Grade is required');
    }

    const simulations = await scholarlabService.getSimulations(req.user, grade, subject || 'Science');

    res.send({
        success: true,
        simulations,
    });
});

/**
 * Launch a simulation and get the encrypted launch URL
 * Requires simulationId, simulationUrl, grade in body
 */
const launchSimulation = catchAsync(async (req, res) => {
    const { simulationId, simulationUrl, grade, subject } = req.body;

    if (!simulationId || !simulationUrl || !grade) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'simulationId, simulationUrl, and grade are required');
    }

    const result = await scholarlabService.launchSimulation(
        req.user,
        simulationId,
        simulationUrl,
        grade,
        subject || 'Science'
    );

    res.send({
        success: true,
        launchUrl: result.launchUrl,
        session: result.session,
    });
});

module.exports = {
    getSimulations,
    launchSimulation,
};
