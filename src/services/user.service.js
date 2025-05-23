const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const emailService = require('./email.service');
const { uploadToS3, deleteFileFromS3 } = require("../utils/multer");
const bcrypt = require("bcryptjs");
const path = require('path');
const ExcelJS = require("exceljs");
const XLSX = require("xlsx");

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody, schoolId) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (schoolId) {
    userBody.schoolId = schoolId;
  }
  const user = await User.create(userBody);
  await emailService.sendUserCredentialsEmailForTeacher(user.email, userBody.password);
  return user;
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options, schoolId) => {
  filter.schoolId = schoolId;
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  return user;
};

/**
 * Update user profile (username and/or profile picture)
 * @param {Object} req - The request object, containing user data and file.
 * @returns {Promise<User>}
 */
const updateUserProfile = async (req) => {
  const userId = req.user._id;
  const { username } = req.body;
  const profilePictureFile =
    req.file || (req.files && req.files.find((file) => file.fieldname === "profilePicture"));

  // Fetch the user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // Handle profile picture upload
  if (profilePictureFile) {
    // Delete old profile picture from S3, if it exists
    if (user.profilePictureURL) {
      await deleteFileFromS3("profilePictures", user.profilePictureURL);
    }

    // Upload new profile picture to S3
    const uploadedUrl = await uploadToS3(
      {
        ...profilePictureFile,
        format: path.extname(profilePictureFile.originalname),
      },
      "profilePictures"
    );

    // Update the user's profile picture URL
    user.profilePictureURL = uploadedUrl;
  }

  // Update username if provided
  if (username) {
    user.name = username;
  }

  // Save the updated user
  await user.save();
  return user;
};



const importTeachersFromExcel = async (fileBuffer, schoolId, userId) => {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  if (!jsonData.length) {
    throw new Error("Uploaded file is empty.");
  }

  const teachersData = [];
  const existingUsers = [];

  for (const row of jsonData) {
    console.log(row);
    const { Name, Email } = row;

    if (!Name || !Email) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Name and Email are required for each teacher.');
    }

    // Check if teacher already exists
    const existingUser = await User.findOne({ email: Email });
    if (existingUser) {
      existingUsers.push(Email); // Store the email if the user already exists
      continue; // Skip this teacher
    }

    const hashedPassword = await bcrypt.hash("defaultPassword123", 8);

    teachersData.push({
      name: Name,
      email: Email.toLowerCase(),
      password: hashedPassword,
      role: "teacher",
      schoolId: schoolId,
      createdBy: userId, // Store the user who uploaded the data
      isEmailVerified: false,
    });
  }

  // If any existing users, throw error with their emails
  if (existingUsers.length > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, `The following emails already exist: ${existingUsers.join(', ')}`);
  }

  // Insert new teachers in bulk
  if (teachersData.length) {
    await User.insertMany(teachersData);
  }

  return {
    message: `${teachersData.length} teachers imported successfully.`,
    existingUsers,
  };
};

const exportTeacherToExcel = async (schoolId) => {

  const teacherData = await User.find({ schoolId, role: 'teacher' });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Students");

  worksheet.addRow(["SI", "Name", "email"]);

  let siCounter = 1;

  teacherData.forEach((teacher) => {
    worksheet.addRow([siCounter++, teacher.name, teacher.email]);
  });

  const fileBuffer = await workbook.xlsx.writeBuffer();

  const base64 = fileBuffer.toString("base64");

  return base64;
};


module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  updateUserProfile,
  importTeachersFromExcel,
  exportTeacherToExcel,
};
