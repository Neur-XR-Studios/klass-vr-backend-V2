const httpStatus = require("http-status");
const { Section } = require("../models");
const ApiError = require("../utils/ApiError");

const createSection = async (sectionBody, schoolId) => {
  sectionBody.schoolId = schoolId;
  return Section.create(sectionBody);
};

const querySections = async (filter, options, schoolId) => {
  filter.schoolId = schoolId;
  const sections = await Section.find(filter);
  await Section.populate(sections, { path: "gradeId" });
  return sections;
};

const getSectionById = async (id) => {
  return Section.findById(id);
};

const getSectionByGradeId = async (gradeId) => {
  return Section.find({ gradeId });
};

const updateSectionById = async (sectionId, updateBody) => {
  const section = await getSectionById(sectionId);
  if (!section) {
    throw new ApiError(httpStatus.NOT_FOUND, "Section not found");
  }
  Object.assign(section, updateBody);
  await section.save();
  return section;
};

const deleteSectionById = async (sectionId) => {
  const section = await Section.findByIdAndDelete(sectionId);
  if (!section) {
    throw new ApiError(httpStatus.NOT_FOUND, "Section not found");
  }
};

module.exports = {
  createSection,
  querySections,
  getSectionById,
  updateSectionById,
  deleteSectionById,
  getSectionByGradeId,
};
