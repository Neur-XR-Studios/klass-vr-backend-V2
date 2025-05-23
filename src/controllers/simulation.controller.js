const httpStatus = require("http-status");
const pick = require("../utils/pick");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { simulationService } = require("../services");

const createSimulation = catchAsync(async (req, res) => {
  const simulation = await simulationService.createSimulation(req.body);
  res.status(httpStatus.CREATED).send(simulation);
});

const getSimulations = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["title", "subject", "tags"]);
  const options = pick(req.query, ["sortBy", "page"]);
  options.limit = 1000;
  const result = await simulationService.querySimulations(filter, options);
  res.send(result);
});

const getSimulation = catchAsync(async (req, res) => {
  const simulation = await simulationService.getSimulationById(
    req.params.simulationId
  );
  if (!simulation) {
    throw new ApiError(httpStatus.NOT_FOUND, "Simulation not found");
  }
  res.send(simulation);
});

const updateSimulation = catchAsync(async (req, res) => {
  const simulation = await simulationService.updateSimulationById(
    req.params.simulationId,
    req.body
  );
  res.send(simulation);
});

const deleteSimulation = catchAsync(async (req, res) => {
  await simulationService.deleteSimulationById(req.params.simulationId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createSimulation,
  getSimulations,
  getSimulation,
  updateSimulation,
  deleteSimulation,
};
