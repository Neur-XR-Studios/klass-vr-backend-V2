const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { sectionService, gradeService } = require("../services");
const pick = require("../utils/pick");

const createSection = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const section = await sectionService.createSection(req.body, schoolId);
  res.status(httpStatus.CREATED).send(section);
});

const getSections = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const filter = pick(req.query, ["name"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const sections = await sectionService.querySections(
    filter,
    options,
    schoolId
  );
  res.send(sections);
});

const getSection = catchAsync(async (req, res) => {
  const section = await sectionService.getSectionById(req.params.sectionId);
  if (!section) {
    res.status(httpStatus.NOT_FOUND).send({ message: "Section not found" });
  } else {
    res.send(section);
  }
});

const updateSection = catchAsync(async (req, res) => {
  const section = await sectionService.updateSectionById(
    req.params.sectionId,
    req.body
  );
  res.send(section);
});

const deleteSection = catchAsync(async (req, res) => {
  await sectionService.deleteSectionById(req.params.sectionId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getSectionByGrade = catchAsync(async (req, res) => {
  const grade = await sectionService.getSectionByGradeId(req.params.gradeId);
  if (!grade) {
    res.status(httpStatus.NOT_FOUND).send({ message: "Grade not found" });
  } else {
    res.send(grade);
  }
});

module.exports = {
  createSection,
  getSections,
  getSection,
  updateSection,
  deleteSection,
  getSectionByGrade,
};
