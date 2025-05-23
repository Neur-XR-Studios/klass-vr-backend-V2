const httpStatus = require("http-status");
const { ExperienceConducted, Perfomance, Student } = require("../models");
const ApiError = require("../utils/ApiError");
const XLSX = require("xlsx");
const XLSXStyle = require("xlsx-style");

/**
 * Create an experience conducted
 * @param {Object} experienceConductedBody
 * @returns {Promise<ExperienceConducted>}
 */
const createExperienceConducted = async (
  experienceConductedBody,
  teacherId,
  schoolId
) => {
  experienceConductedBody.schoolID = schoolId;
  experienceConductedBody.teacherID = teacherId;
  const experienceConducted = await ExperienceConducted.create(
    experienceConductedBody
  );
  return experienceConducted;
};

/**
 * Get experience conducted by id
 * @param {ObjectId} experienceIds
 * @returns {Promise<ExperienceConducted>}
 */
const getExperienceConductedById = async (experienceId) => {
  const experienceConducted = await ExperienceConducted.findById(experienceId);
  if (!experienceConducted) {
    throw new ApiError(httpStatus.NOT_FOUND, "Experience conducted not found");
  }
  return experienceConducted;
};

/**
 * Get experience conducted by id with all belongs to
 * @param {ObjectId} experienceId
 * @returns {Promise<ExperienceConducted>}
 */
const getDetailedExperienceConductedById = async (experienceId) => {
  const experienceConducted = await ExperienceConducted.findById(experienceId)
    .populate("sessionID")
    .populate("teacherID")
    .populate("schoolID")
    .populate("sectionID")
    .populate("gradeID");

  if (!experienceConducted) {
    throw new ApiError(httpStatus.NOT_FOUND, "Experience conducted not found");
  }
  return experienceConducted;
};

/**
 * Get all experience conducted
 * @returns {Promise<Array<ExperienceConducted>>}
 */
const getAllExperienceConducted = async (filter, options, schoolId) => {
  filter.schoolID = schoolId;
  const experienceConductedList = await ExperienceConducted.paginate(
    filter,
    options
  );

  await ExperienceConducted.populate(experienceConductedList.results, [
    { path: "sessionID", model: "Session" },
    { path: "teacherID" },
    { path: "schoolID" },
    { path: "gradeID", model: "Grade" },
    { path: "sectionID", model: "Section" },
  ]);

  return experienceConductedList;
};

/**
 * Delete experience conducted by id
 * @param {ObjectId} experienceConductedId
 * @returns {Promise<ExperienceConducted>}
 */
const deleteExperienceConductedById = async (experienceConductedId) => {
  const experienceConducted = await ExperienceConducted.findByIdAndDelete(
    experienceConductedId
  );
  if (!experienceConducted) {
    throw new ApiError(httpStatus.NOT_FOUND, "Experience conducted not found");
  }
  return experienceConducted;
};

const updateExperienceConductedById = async (
  experienceId,
  updateBody,
  user
) => {
  const { _id: userId, schoolId } = user;

  const experienceConducted = await ExperienceConducted.findById(experienceId);
  if (!experienceConducted) {
    throw new ApiError(httpStatus.NOT_FOUND, "Experience conducted not found");
  }

  // Check if the user has permission to update this experience
  if (
    !experienceConducted.teacherID.equals(userId) &&
    !schoolId.equals(experienceConducted.schoolID)
  ) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You do not have permission to update this experience"
    );
  }

  Object.assign(experienceConducted, updateBody);
  await experienceConducted.save();

  return experienceConducted;
};

const getPerformanceByExperienceId = async (experienceConductedID) => {
  const performances = await Perfomance.find({ experienceConductedID })
    .populate("schoolId", "name")
    .populate("sectionID", "name")
    .populate("gradeID", "name");

  if (!performances) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "No performance data found for the given experienceConductedID"
    );
  }

  return performances;
};

const generateExcelSheet = (data, metaData) => {
  const ws = XLSX.utils.json_to_sheet([]);

  // Function to add cell with styling
  const addCellWithStyle = (ws, cell, value, style) => {
    ws[cell] = { t: "s", v: value };
    if (style) {
      ws[cell].s = style;
    }
  };

  // Add meta data to the sheet with bold headers
  const boldStyle = { font: { bold: true } };

  addCellWithStyle(
    ws,
    "A1",
    `Teacher Name: ${metaData.teacherName}`,
    boldStyle
  );
  addCellWithStyle(ws, "A2", `Section: ${metaData.sectionName}`, boldStyle);
  addCellWithStyle(ws, "A3", `Grade: ${metaData.gradeName}`, boldStyle);

  // Add an empty row for spacing after metadata
  XLSX.utils.sheet_add_aoa(ws, [[]], { origin: -1 });

  // Set column widths (e.g., A for studentName)
  ws["!cols"] = [
    { wch: 30 }, // Width of column A (studentName)
    { wch: 10 }, // Width of column B (score) - example width
  ];

  // Add bold headers for "Student Name" and "Score"
  addCellWithStyle(ws, "A5", "Student Name", boldStyle);
  addCellWithStyle(ws, "B5", "Score", boldStyle);

  // Add the data starting from A6
  XLSX.utils.sheet_add_json(ws, data, {
    origin: "A6", // Start data from row 6
    skipHeader: true, // Skip adding the headers, as we added them manually
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Performances");

  const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return excelBuffer;
};

const getPerformanceReportAsExcel = async (experienceConductedID) => {
  const performances = await Perfomance.find({
    experienceConductedID: experienceConductedID,
  })
    .populate("schoolId", "name")
    .populate("sectionID", "name")
    .populate("gradeID", "name");

  const experienceConducted = await ExperienceConducted.findById(
    experienceConductedID
  )
    .populate("teacherID", "name")
    .populate("sectionID", "name")
    .populate("gradeID", "name");

  if (!experienceConducted) {
    throw new ApiError(httpStatus.NOT_FOUND, "Experience conducted not found");
  }

  const metaData = {
    teacherName: experienceConducted.teacherID.name,
    sectionName: experienceConducted.sectionID.name,
    gradeName: experienceConducted.gradeID.name,
  };

  const performanceData = await Promise.all(
    performances.map(async (performance) => {
      const student = await Student.findOne({
        studentId: performance.studentID,
      });

      return {
        studentName: student ? student.name : performance.studentID,
        score: performance.score,
      };
    })
  );

  const excelBuffer = generateExcelSheet(performanceData, metaData);

  // Extract date from createdAt timestamp
  const createdDate = new Date(experienceConducted.createdAt)
    .toISOString()
    .split("T")[0]; // Get date in YYYY-MM-DD format
  const fileName = `${metaData.gradeName}_${metaData.sectionName}_experience_${createdDate}.xlsx`;

  return { excelBuffer, fileName };
};

module.exports = {
  createExperienceConducted,
  getExperienceConductedById,
  getAllExperienceConducted,
  deleteExperienceConductedById,
  getDetailedExperienceConductedById,
  updateExperienceConductedById,
  getPerformanceByExperienceId,
  getPerformanceReportAsExcel,
};
