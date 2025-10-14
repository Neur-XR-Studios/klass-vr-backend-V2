const httpStatus = require("http-status");
const { Simulation } = require("../models");
const ApiError = require("../utils/ApiError");

/**
 * Create a simulation
 * @param {Object} simulationBody
 * @returns {Promise<Simulation>}
 */
const createSimulation = async (simulationBody) => {
  const simulation = await Simulation.create(simulationBody);
  return simulation;
};

/**
 * Query for simulations
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const querySimulations = async (filter, options) => {
  // Handle title search BEFORE calling paginate
  if (filter.title) {
    const searchRegex = new RegExp(filter.title, "i"); // Case-insensitive search

    // Remove title from filter and add $or condition
    delete filter.title;
    filter.$or = [
      { title: { $regex: searchRegex } }, // Search in model's title field
      { tags: { $regex: searchRegex } }, // Search in comma-separated tags string
      { tags: { $in: [searchRegex] } }, // Search in array elements (for single values)
    ];
  }

  // Now call paginate with the modified filter
  const simulations = await Simulation.paginate(filter, options);
  return simulations;
};
/**
 * Get simulation by id
 * @param {ObjectId} id
 * @returns {Promise<Simulation>}
 */
const getSimulationById = async (id) => {
  return Simulation.findById(id);
};

/**
 * Update simulation by id
 * @param {ObjectId} simulationId
 * @param {Object} updateBody
 * @returns {Promise<Simulation>}
 */
const updateSimulationById = async (simulationId, updateBody) => {
  const simulation = await getSimulationById(simulationId);
  if (!simulation) {
    throw new ApiError(httpStatus.NOT_FOUND, "Simulation not found");
  }
  Object.assign(simulation, updateBody);
  await simulation.save();
  return simulation;
};

/**
 * Delete simulation by id
 * @param {ObjectId} simulationId
 * @returns {Promise<Simulation>}
 */
const deleteSimulationById = async (simulationId) => {
  const simulation = await Simulation.findByIdAndDelete(simulationId);
  if (!simulation) {
    throw new ApiError(httpStatus.NOT_FOUND, "Simulation not found");
  }
  return simulation;
};

module.exports = {
  createSimulation,
  querySimulations,
  getSimulationById,
  updateSimulationById,
  deleteSimulationById,
};
