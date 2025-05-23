const { School, User, Subscription } = require("../models");
const { ObjectId } = require("mongoose").Types;
const { emailService } = require("../services");

/**
 * Create a new school
 * @param {Object} schoolBody
 * @returns {Promise<School>}
 */
const createSchool = async (schoolBody) => {
  try {
    const { subscriptionId } = schoolBody;
    const subscription = await Subscription.findOne({ _id: subscriptionId });
    const existingEmails = await User.distinct("email", {
      email: { $in: schoolBody.users.map((user) => user.email) },
    });
    if (existingEmails.length > 0) {
      return {
        code: 409,
        message: `Email already exists for user(s): ${existingEmails.join(
          ", "
        )}`,
      };
    }

    // Function to generate a unique 6-digit random number
    const generateUniqueRandomNumber = async () => {
      let uniqueRandomNumber;
      do {
        uniqueRandomNumber = Math.floor(
          100000 + Math.random() * 900000
        ).toString();
      } while (
        await School.exists({ vrDeviceRegisterSecret: uniqueRandomNumber })
      );
      return uniqueRandomNumber;
    };

    const vrDeviceRegisterSecret = await generateUniqueRandomNumber();

    const school = await School.create({
      ...schoolBody,
      subscriptionId: subscriptionId,
      subscriptionRemainingDays: subscription.term,
      vrDeviceRegisterSecret,
    });

    const userRoles = {
      superadmin: 1,
      admin: 3,
    };

    const userCount = {};
    for (const userData of schoolBody.users) {
      const { name, email, password, role } = userData;
      if (userCount[role] >= userRoles[role]) {
        throw new Error(`Maximum limit reached for role: ${role}`);
      }
      const newUser = new User({
        name,
        email,
        password,
        role,
        schoolId: school._id,
      });
      await newUser.save();
      await emailService.sendUserCredentialsEmail(
        email,
        password,
        vrDeviceRegisterSecret
      );
      userCount[role] = (userCount[role] || 0) + 1;
    }

    return school;
  } catch (error) {
    console.error("Error in createSchool:", error);

    if (
      error.message.includes("duplicate key error collection") &&
      error.message.includes("schoolEmail")
    ) {
      return { code: 409, message: "School email already exists." };
    } else if (
      error.message.includes("duplicate key error collection") &&
      error.message.includes("schoolName")
    ) {
      return { code: 409, message: "School Name already exists." };
    } else if (
      error.message.includes("duplicate key error collection") &&
      error.message.includes("schoolIdentificationNumber")
    ) {
      return {
        code: 409,
        message: "School Identification Number already exists.",
      };
    } else if (
      error.message.includes("duplicate key error collection") &&
      error.message.includes("schoolPhoneNumber") &&
      error.message.includes("schoolPhoneNumber_1")
    ) {
      return { code: 409, message: "School Phone Number already exists." };
    }

    return { code: 500, message: "Internal server error" };
  }
};

/**
 * Query for schools
 * @returns {Promise<QueryResult>}
 */
const querySchools = async () => {
  const schools = await School.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "schoolId",
        as: "users",
      },
    },
    {
      $lookup: {
        from: "subscritpions",
        localField: "subscriptionId",
        foreignField: "_id",
        as: "subscritpions",
      },
    },
  ]);

  return schools;
};

/**
 * Get school by id
 * @param {ObjectId} id
 * @returns {Promise<School>}
 */
const getSchoolById = async (id) => {
  const schools = await School.aggregate([
    {
      $match: {
        _id: new ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "schoolId",
        as: "users",
      },
    },
    {
      $lookup: {
        from: "subscritpions",
        localField: "subscriptionId",
        foreignField: "_id",
        as: "subscritpions",
      },
    },
  ]);
  return schools;
};

/**
 * Update school by id
 * @param {ObjectId} schoolId
 * @param {Object} updateBody
 * @returns {Promise<School>}
 */
const updateSchoolById = async (schoolId, updateBody) => {
  try {
    const { subscriptionId, users, ...restOfUpdate } = updateBody;

    // Check for duplicate fields
    if (restOfUpdate.schoolEmail) {
      const emailExists = await School.findOne({
        _id: { $ne: schoolId },
        schoolEmail: restOfUpdate.schoolEmail,
      });
      if (emailExists) {
        return { code: 409, message: "School email already exists." };
      }
    }

    if (restOfUpdate.schoolName) {
      const nameExists = await School.findOne({
        _id: { $ne: schoolId },
        schoolName: restOfUpdate.schoolName,
      });
      if (nameExists) {
        return { code: 409, message: "School Name already exists." };
      }
    }

    if (restOfUpdate.schoolIdentificationNumber) {
      const idNumberExists = await School.findOne({
        _id: { $ne: schoolId },
        schoolIdentificationNumber: restOfUpdate.schoolIdentificationNumber,
      });
      if (idNumberExists) {
        return {
          code: 409,
          message: "School Identification Number already exists.",
        };
      }
    }

    if (restOfUpdate.schoolPhoneNumber) {
      const phoneNumberExists = await School.findOne({
        _id: { $ne: schoolId },
        schoolPhoneNumber: restOfUpdate.schoolPhoneNumber,
      });
      if (phoneNumberExists) {
        return { code: 409, message: "School Phone Number already exists." };
      }
    }

    // Update subscription if provided
    if (subscriptionId) {
      const subscription = await Subscription.findOne({ _id: subscriptionId });
      if (!subscription) {
        throw new Error("Subscription not found");
      }
      restOfUpdate.subscriptionId = subscriptionId;
      restOfUpdate.subscriptionRemainingDays = subscription.term;
      restOfUpdate.isSubscribed = true;
    }

    // Update the school document
    const updatedSchool = await School.findByIdAndUpdate(
      schoolId,
      { $set: restOfUpdate },
      { new: true }
    );

    if (!updatedSchool) {
      throw new Error("School not found");
    }

    // Handle updating users if provided
    if (users) {
      for (const userData of users) {
        const { name, email, password, role } = userData;
        let user = await User.findOne({ email, schoolId });

        if (!user) {
          user = new User({
            name,
            email,
            password,
            role,
            schoolId: updatedSchool._id,
          });
        } else {
          user.name = name;
          user.password = password;
          user.role = role;
        }

        await user.save();
        await emailService.sendUserCredentialsEmail(
          email,
          password,
          updatedSchool.vrDeviceRegisterSecret
        );
      }
    }

    return updatedSchool;
  } catch (error) {
    console.error("Error in updateSchoolById:", error);

    if (
      error.message.includes("duplicate key error collection") &&
      error.message.includes("schoolEmail")
    ) {
      return { code: 409, message: "School email already exists." };
    } else if (
      error.message.includes("duplicate key error collection") &&
      error.message.includes("schoolName")
    ) {
      return { code: 409, message: "School Name already exists." };
    } else if (
      error.message.includes("duplicate key error collection") &&
      error.message.includes("schoolIdentificationNumber")
    ) {
      return {
        code: 409,
        message: "School Identification Number already exists.",
      };
    } else if (
      error.message.includes("duplicate key error collection") &&
      error.message.includes("schoolPhoneNumber") &&
      error.message.includes("schoolPhoneNumber_1")
    ) {
      return { code: 409, message: "School Phone Number already exists." };
    }

    return { code: 500, message: "Internal server error" };
  }
};

/**
 * Delete school by id
 * @param {ObjectId} schoolId
 * @returns {Promise<School>}
 */
const deleteSchoolById = async (schoolId) => {
  await User.deleteMany({ schoolId });
  const school = await getSchoolById(schoolId);
  await School.findByIdAndDelete(schoolId);
  if (!school) {
    throw new Error("School not found");
  }
};

module.exports = {
  createSchool,
  querySchools,
  getSchoolById,
  updateSchoolById,
  deleteSchoolById,
};
