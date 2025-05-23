const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const image360Schema = new mongoose.Schema({
  imageURL: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  format: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  tags: {
    type: [String],
  },
  userRole: {
    type: String,
  },
});

image360Schema.plugin(toJSON);
image360Schema.plugin(paginate);

const Image360 = mongoose.model("Image360", image360Schema);

module.exports = Image360;
