const {
  User,
  School,
  Model3D,
  Video,
  Device,
  ExperienceConducted,
  Perfomance,
  Session,
  Assessment,
  Simulation,
  Image360,
} = require("../models");
const mongoose = require("mongoose");
const moment = require("moment");

const getSystemAdminDashboardData = async (req, res) => {
  try {
    const totalNoOfSchools = await School.countDocuments();
    const expiredLicensingInOrder = await User.find({
      subscriptionRemainingDays: { $ne: null, $gte: 0 },
    })
      .sort({ subscriptionRemainingDays: 1 })
      .limit(5);

    const clientSchoolPerfomance = await Perfomance.aggregate([
      {
        $group: {
          _id: "$schoolId",
          averageScore: { $avg: "$score" },
        },
      },
      {
        $lookup: {
          from: "schools",
          localField: "_id",
          foreignField: "_id",
          as: "school",
        },
      },
      {
        $unwind: "$school",
      },
      {
        $project: {
          _id: 0,
          schoolName: "$school.schoolName",
          averageScore: { $ifNull: ["$averageScore", 0] }, // Handle cases where averageScore is null
        },
      },
      {
        $sort: { schoolName: 1 },
      },
    ]);

    const formattedClientSchoolPerformance = formatClientSchoolPerfomance(
      clientSchoolPerfomance
    );

    const totalNoOf3dModels = await Model3D.countDocuments({
      userRole: "repoManager",
    });
    const totalNoOf360Videos = await Video.countDocuments({
      userRole: "repoManager",
    });
    const totalNoOfSimulation = await Simulation.countDocuments();
    const totalNoOfImage360 = await Image360.countDocuments({
      userRole: "repoManager",
    });

    const totalNoOfUsersWithRole = {
      totalNoOfTeacher: await User.countDocuments({ role: "teacher" }),
      totalNoOfAdmin: await User.countDocuments({ role: "admin" }),
      totalNoOfSuperAdmin: await User.countDocuments({ role: "superadmin" }),
      totalNoOfRepoTeam: await User.countDocuments({ role: "repoManager" }),
    };
    const totalNoOfVrDevice = await Device.countDocuments();
    const totalNoOfExperienceCreated = await Session.countDocuments();
    const activeSchoolCount = await School.countDocuments({ isActive: true });
    const inactiveSchoolCount = await School.countDocuments({
      isActive: false,
    });
    const activeSchoolStatus = { activeSchoolCount, inactiveSchoolCount };

    const dashboardData = {
      totalNoOfSchools,
      expiredLicensingInOrder,
      clientSchoolPerfomance: formattedClientSchoolPerformance,
      totalNoOf3dModels,
      totalNoOf360Videos,
      totalNoOfImage360,
      totalNoOfSimulation,
      totalNoOfUsersWithRole,
      totalNoOfVrDevice,
      totalNoOfExperienceCreated,
      activeSchoolStatus,
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const formatClientSchoolPerfomance = (data) => {
  const formattedData = {};

  data.forEach((item) => {
    const schoolName = item.schoolName;
    const averageScore = item.averageScore || 0;

    if (!formattedData[schoolName]) {
      formattedData[schoolName] = {
        schoolName: schoolName,
        averageScore: averageScore,
      };
    }
  });

  return Object.values(formattedData);
};

const getClassAssessmentPerformance = async (gradeId, sectionId, schoolId) => {
  try {
    const aggregationPipeline = [];

    if (gradeId && sectionId) {
      aggregationPipeline.push({
        $match: {
          gradeID: new mongoose.Types.ObjectId(gradeId),
          sectionID: new mongoose.Types.ObjectId(sectionId),
          schoolId: new mongoose.Types.ObjectId(schoolId),
        },
      });
    } else if (gradeId && !sectionId) {
      aggregationPipeline.push({
        $match: {
          gradeID: new mongoose.Types.ObjectId(gradeId),
          schoolId: new mongoose.Types.ObjectId(schoolId),
        },
      });
    } else if (schoolId) {
      aggregationPipeline.push({
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId),
        },
      });
    }

    aggregationPipeline.push(
      {
        $group: {
          _id: "$studentID",
          averageScore: { $avg: "$score" },
          totalStudents: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          studentID: "$_id",
          averageScore: { $round: ["$averageScore", 1] }, // Round to 1 decimal place
        },
      }
    );

    const classPerformance = await Perfomance.aggregate(aggregationPipeline);

    return classPerformance;
  } catch (error) {
    throw new Error("Error while fetching class assessment performance");
  }
};


const getGradeSectionAssessmentPerformance = async (req, res) => {
  const schoolId = req.user.schoolId;
  const teacherId = req.user.id;
  try {
    const aggregationPipeline = [
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId),
        },
      },
      {
        $group: {
          _id: { gradeID: "$gradeID", sectionID: "$sectionID" },
          totalScore: { $sum: "$score" },
          totalStudents: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "grades",
          localField: "_id.gradeID",
          foreignField: "_id",
          as: "grade",
        },
      },
      {
        $unwind: "$grade",
      },
      {
        $lookup: {
          from: "sections",
          localField: "_id.sectionID",
          foreignField: "_id",
          as: "section",
        },
      },
      {
        $unwind: "$section",
      },
      {
        $addFields: {
          name: {
            $concat: ["$grade.name", " - ", "$section.name"],
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          score: "$totalScore",
          students: "$totalStudents",
          gradeID: "$_id.gradeID",
          sectionID: "$_id.sectionID",
          gradeName: "$grade.name",
          sectionName: "$section.name",
        },
      },
    ];
    const gradeSectionPerformance = await Perfomance.aggregate(
      aggregationPipeline
    );

    res.json(gradeSectionPerformance);




  } catch (error) {
    console.error(error);
    res.status(500).json({
      message:
        "Error while fetching grade and section assessment performance",
    });
  }
};

const getTeacherDashboardDataNumbers = async (req, res) => {
  const schoolId = req.user.schoolId;
  const teacherId = req.user.id;
  const myExperience = await Session.find({ schoolId: schoolId, teacherId: teacherId });
  const totalNoOfExperience = await Session.find({ schoolId: schoolId });
  const activeDeviceCount = await Device.find({ schoolID: schoolId, isActive: true }).countDocuments();
  // Add the counts to the response
  const response = {
    myExperienceCount: myExperience.length,
    totalNoOfExperienceCount: totalNoOfExperience.length,
    activeDeviceCount: activeDeviceCount
  };
  res.json(response);
}


const getTeacherDashboardData = async (req, res) => {
  const { id, schoolId } = req.user;
  const { gradeId, sectionId } = req.query;
  try {
    const totalNoOf3dModels = await Model3D.countDocuments({
      createdBy: new mongoose.Types.ObjectId(id),
    });
    const totalNoOf360Videos = await Video.countDocuments({
      createdBy: new mongoose.Types.ObjectId(id),
    });

    let classPerformance;
    if (!gradeId && !sectionId) {
      classPerformance = await getClassAssessmentPerformance();
    } else {
      classPerformance = await getClassAssessmentPerformance(
        gradeId,
        sectionId,
        schoolId
      );
    }
    const dashboardData = {
      clientSchoolPerfomance: classPerformance,
      totalNoOf3dModels,
      totalNoOf360Videos,
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getSuperAdminDashboardData = async (req, res) => {
  const { id, schoolId } = req.user;
  const { teacherId } = req.query;
  try {
    const totalNoOfExperience = await Session.countDocuments({
      schoolId,
    });
    const totalNoOfExperienceConducted =
      await ExperienceConducted.countDocuments({
        schoolID: schoolId,
      });
    const totalNoOfAssessment = await Assessment.countDocuments({
      schoolId,
    });
    const totalNoOfExperienceCreatedByTeacher = await Session.countDocuments({
      teacherId: new mongoose.Types.ObjectId(teacherId),
    });
    const totalNoOfExperienceDeployedTeacher =
      await ExperienceConducted.countDocuments({
        teacherID: new mongoose.Types.ObjectId(teacherId),
      });
    const overallExperienceDeployedByTeacher =
      await ExperienceConducted.countDocuments({
        schoolID: new mongoose.Types.ObjectId(schoolId),
      });
    const totalNoOfAssessmentCreatedByTeacher = await Assessment.countDocuments(
      {
        createdBy: new mongoose.Types.ObjectId(teacherId),
      }
    );

    const totalNoOfExperienceCreatedByTeacherChartData =
      await Session.aggregate([
        {
          $match: { teacherId: new mongoose.Types.ObjectId(teacherId) },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

    const totalNoOfExperienceDeployedTeacherChartData =
      await ExperienceConducted.aggregate([
        {
          $match: { teacherID: new mongoose.Types.ObjectId(teacherId) },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

    const totalNoOfAssessmentCreatedByTeacherChartData =
      await Assessment.aggregate([
        {
          $match: { createdBy: new mongoose.Types.ObjectId(teacherId) },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

    const dashboardData = {
      totalNoOfExperienceCreatedByTeacher,
      totalNoOfExperienceDeployedTeacher,
      totalNoOfAssessmentCreatedByTeacher,
      overallExperienceDeployedByTeacher,
      totalNoOfExperienceByTeacher:
        totalNoOfExperienceCreatedByTeacherChartData,
      ExperienceDeployedByTeacher: totalNoOfExperienceDeployedTeacherChartData,
      AssessmentCreatedByTeacher: totalNoOfAssessmentCreatedByTeacherChartData,
      totalNoOfExperienceConducted,
      totalNoOfExperience,
      totalNoOfAssessment,
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getSystemAdminDashboardData,
  getTeacherDashboardData,
  getGradeSectionAssessmentPerformance,
  getSuperAdminDashboardData,
  getTeacherDashboardDataNumbers,
};
