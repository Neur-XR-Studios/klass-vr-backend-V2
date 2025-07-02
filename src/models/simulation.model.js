const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const simulationSchema = new mongoose.Schema({
  simulationURL: {
    type: String,
    required: true,
  },
  thumbnailURL: {
    type: String,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  displayTime: {
    type: String,
  },
  subject: {
    type: String,
  },
});

simulationSchema.plugin(toJSON);
simulationSchema.plugin(paginate);

const simulation = mongoose.model("simulation", simulationSchema);

module.exports = simulation;
