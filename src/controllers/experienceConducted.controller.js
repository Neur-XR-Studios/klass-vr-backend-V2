const httpStatus = require("http-status");
const { experienceConductedService } = require("../services");
const pick = require("../utils/pick");

/**
 * Create a new experience conducted
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const createExperienceConducted = async (req, res) => {
  const teacherId = req.user._id;
  const schoolId = req.user.schoolId;
  const experienceConducted =
    await experienceConductedService.createExperienceConducted(
      req.body,
      teacherId,
      schoolId
    );
  res.status(httpStatus.CREATED).send(experienceConducted);
};

/**
 * Get an experience conducted by ID
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getExperienceConductedById = async (req, res) => {
  const experienceID = req.params.experienceId;
  const experienceConducted =
    await experienceConductedService.getDetailedExperienceConductedById(
      experienceID
    );
  res.send(experienceConducted);
};

const updateExperienceConductedById = async (req, res) => {
  const { experienceId } = req.params;
  const { user } = req;
  const updatedExperience =
    await experienceConductedService.updateExperienceConductedById(
      experienceId,
      req.body,
      user
    );
  res.send(updatedExperience);
};

/**
 * Get all experience conducted
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getAllExperienceConducted = async (req, res) => {
  const schoolId = req.user.schoolId;
  const filter = pick(req.query, ["deviceID", "schoolID"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  options.sortBy = options.sortBy || "createdAt:desc";
  const result = await experienceConductedService.getAllExperienceConducted(
    filter,
    options,
    schoolId
  );
  res.send(result);
};

/**
 * Delete an experience conducted by ID
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const deleteExperienceConductedById = async (req, res) => {
  await experienceConductedService.deleteExperienceConductedById(
    req.params.experienceId
  );
  res.status(httpStatus.NO_CONTENT).send();
};

const generatePerformanceReport = async (req, res) => {
  try {
    const experience_conducted_id = req.params.experience_conducted_id;
    const { excelBuffer, fileName } =
      await experienceConductedService.getPerformanceReportAsExcel(
        experience_conducted_id
      );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.status(httpStatus.OK).send(excelBuffer);
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error.message);
  }
};

module.exports = {
  createExperienceConducted,
  getExperienceConductedById,
  updateExperienceConductedById,
  getAllExperienceConducted,
  deleteExperienceConductedById,
  generatePerformanceReport,
};
