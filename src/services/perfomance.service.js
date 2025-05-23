const { Perfomance, Device } = require("../models");
// const ApiError = require('../utils/ApiError');
// const ExcelJS = require('exceljs');
// const XLSX = require('xlsx');

/**
 * Create a student
 * @param {Object} studentBody
 * @returns {Promise<Student>}
 */
const createPerfomance = async (perfomanceData) => {
  console.log("perfomanceData :", perfomanceData);
  const studentId = await Device.findOne({
    deviceID: perfomanceData.studentID,
  });
  perfomanceData.studentID = studentId.uniqueID;
  return await Perfomance.create(perfomanceData);
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
    const students = await Perfomance.find({ sectionId, gradeId, schoolId })
      .populate("experienceConductedID")
      .populate("schoolId")
      .populate("sectionID")
      .populate("gradeID");
    return students;
  } catch (error) {
    throw new Error("Error searching students: " + error.message);
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
// const exportStudentsToExcel = async (gradeId, sectionId, schoolId) => {
//   const filter = { gradeId, sectionId, schoolId };
//   const studentsData = await Student.find(filter);
//   const workbook = new ExcelJS.Workbook();
//   const worksheet = workbook.addWorksheet('Students');
//   worksheet.addRow(['Student ID', 'Name']);
//   studentsData.forEach((student) => {
//     worksheet.addRow([student.studentId, student.name]);
//   });
//   const fileBuffer = await workbook.xlsx.writeBuffer();
//   const base64 = fileBuffer.toString('base64');
//   return base64;
// };

module.exports = {
  createPerfomance,
  searchStudentsBySectionAndGrade,
};
