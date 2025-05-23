const httpStatus = require("http-status");
const { Student } = require("../models");
const ApiError = require("../utils/ApiError");
const ExcelJS = require("exceljs");
const XLSX = require("xlsx");

/**
 * Create a student
 * @param {Object} studentBody
 * @returns {Promise<Student>}
 */
const createStudent = async (studentBody, schoolId) => {
  const gradeId = studentBody.gradeId;
  const sectionId = studentBody.sectionId;

  // Get the latest student for the given session, grade, and section
  const latestStudent = await Student.findOne({
    schoolId,
    gradeId,
    sectionId,
  }).sort({ studentId: -1 });

  // Determine the next studentId
  let nextStudentId;
  if (latestStudent) {
    // Extract the current student number and increment it
    const currentStudentNumber = parseInt(
      latestStudent.studentId.split("-").pop(),
      10
    );
    nextStudentId = `${currentStudentNumber + 1}`.padStart(2, "0");
  } else {
    // If no previous student, start from '01'
    nextStudentId = "01";
  }

  const sessionPrefix = "01"; // Assuming session starts from '01'
  const studentId = `${nextStudentId}`;

  const studentData = {
    ...studentBody,
    schoolId,
    studentId,
  };

  return await Student.create(studentData);
};

/**
 * Query for students
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryStudents = async (filter, options, schoolId) => {
  filter.schoolId = schoolId;

  const students = await Student.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: "grades",
        localField: "gradeId",
        foreignField: "_id",
        as: "grade",
      },
    },
    {
      $lookup: {
        from: "sections",
        localField: "sectionId",
        foreignField: "_id",
        as: "section",
      },
    },
    { $unwind: "$grade" },
    { $unwind: "$section" },
  ]);

  return students;
};

/**
 * Get student by id
 * @param {ObjectId} id
 * @returns {Promise<Student>}
 */
const getStudentById = async (id) => {
  return Student.findById(id);
};

/**
 * Update student by id
 * @param {ObjectId} studentId
 * @param {Object} updateBody
 * @returns {Promise<Student>}
 */
const updateStudentById = async (studentId, updateBody) => {
  const student = await getStudentById(studentId);
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
  }
  Object.assign(student, updateBody);
  await student.save();
  return student;
};

/**
 * Delete student by id
 * @param {ObjectId} studentId
 * @returns {Promise<Student>}
 */
const deleteStudentById = async (studentId) => {
  const student = await Student.findByIdAndDelete(studentId);
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
  }
};

/**
 * Export students' ID and name to Excel
 * @param {string} userId - ID of the authenticated user
 * @param {Array} userRoles - Roles of the authenticated user
 * @param {string} gradeId - ID of the grade
 * @param {string} sectionId - ID of the section
 * @param {string} schoolId - ID of the school
 * @returns {Buffer} - Excel file as a buffer
 */
const exportStudentsToExcel = async (gradeId, sectionId, schoolId) => {
  const filter = { gradeId, sectionId, schoolId };

  const studentsData = await Student.find(filter);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Students");

  worksheet.addRow(["Student ID", "Name"]);

  studentsData.forEach((student) => {
    worksheet.addRow([student.studentId, student.name]);
  });

  const fileBuffer = await workbook.xlsx.writeBuffer();

  const base64 = fileBuffer.toString("base64");

  return base64;
};

/**
 * Import students' names from Excel and add them to the specified grade and section
 * @param {string} gradeId - ID of the grade
 * @param {string} sectionId - ID of the section
 * @param {Buffer} fileBuffer - Excel file as a Buffer
 * @returns {Promise<void>}
 */
const importStudentsFromExcel = async (
  gradeId,
  sectionId,
  fileBuffer,
  schoolId
) => {
  const studentsData = [];

  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  let latestStudentNumber = 0;

  const latestStudent = await Student.findOne({ gradeId, sectionId }).sort({
    studentId: -1,
  });
  if (latestStudent) {
    latestStudentNumber = parseInt(
      latestStudent.studentId.split("-").pop(),
      10
    );
  }

  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  for (let rowNum = range.s.r + 1; rowNum <= range.e.r; rowNum++) {
    const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: 0 });
    const cell = worksheet[cellAddress];
    if (cell && cell.v) {
      const name = cell.v.toString();
      const studentNumber = latestStudentNumber + rowNum - range.s.r;
      const studentId = `${studentNumber}`.padStart(2, "0");
      studentsData.push({ name, gradeId, sectionId, studentId, schoolId });
    }
  }

  await Student.insertMany(studentsData);
};

/**
 * Search for students by sectionId and gradeId
 * @param {string} sectionId - The ID of the section
 * @param {string} gradeId - The ID of the grade
 * @returns {Promise<Array>} An array of student objects matching the search criteria
 */
const searchStudentsBySectionAndGrade = async (
  sectionId,
  gradeId,
  schoolId
) => {
  try {
    const students = await Student.find({ sectionId, gradeId, schoolId })
      .populate("sectionId")
      .populate("gradeId");

    const formattedStudents = students.map((student) => ({
      ...student.toObject(),
      section: student.sectionId,
      grade: student.gradeId,
    }));

    return formattedStudents;
  } catch (error) {
    throw new Error("Error searching students: " + error.message);
  }
};

module.exports = {
  createStudent,
  queryStudents,
  getStudentById,
  updateStudentById,
  deleteStudentById,
  exportStudentsToExcel,
  importStudentsFromExcel,
  searchStudentsBySectionAndGrade,
};
