const mongoose = require("mongoose");
const validator = require("validator");
const { toJSON, paginate } = require("./plugins");

const schoolSchema = mongoose.Schema(
  {
    schoolName: {
      type: String,
      unique: true,
      required: true,
    },
    schoolAddress: {
      type: String,
      required: true,
    },
    schoolType: {
      type: String,
      required: true,
    },
    gradeLevelsServed: {
      type: String,
      required: true,
    },
    schoolDistrict: {
      type: String,
      required: true,
    },
    schoolIdentificationNumber: {
      type: String,
      unique: true,
      required: true,
    },
    schoolEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: "Invalid email",
      },
    },
    schoolPhoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subscription",
    },
    isSubscribed: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subscriptionRemainingDays: {
      type: Number,
    },
    vrDeviceRegisterSecret: {
      type: String,
      unique: true,
    },
    maxAllowedDevice: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

schoolSchema.plugin(toJSON);
schoolSchema.plugin(paginate);

const School = mongoose.model("School", schoolSchema);

module.exports = School;
