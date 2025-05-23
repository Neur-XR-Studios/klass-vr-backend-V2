const { User, School, Model3D, Video, Device, ExperienceConducted, Perfomance } = require('../models');

const totalNoOfSchools = async (req, res) => {
  const totalSchools = await School.countDocuments();
  return totalSchools;
};

const expiredLicensingInOrder = async (req, res) => {
  const totalDays = await User.find({ subscriptionRemainingDays: { $ne: null, $gte: 0 } })
    .sort({ subscriptionRemainingDays: 1 })
    .limit(5);
  return totalDays;
};

const clientSchoolPerfomance = async (req, res) => {
  const data = await Perfomance.aggregate([
    {
      $group: {
        _id: '$schoolId',
        averageScore: { $avg: '$score' },
      },
    },
    {
      $lookup: {
        from: 'School',
        localField: 'schoolId',
        foreignField: '_id',
        as: 'school',
      },
    },
    {
      $project: {
        _id: 0,
        school: { $arrayElemAt: ['$school', 0] },
        averageScore: 1,
      },
    },
    {
      $sort: { 'school.schoolName': 1 },
    },
  ]);

  const graphData = {
    labels: [],
    data: [],
  };

  data.forEach((item) => {
    graphData.labels.push(item.school.schoolName);
    graphData.data.push(item.averageScore);
  });

  return graphData;
};

const totalNoOf3dModels = async (req, res) => {
  const total3dModels = await Model3D.countDocuments();
  return total3dModels;
};

const totalNoOf360Videos = async (req, res) => {
  const total360Videos = await Video.countDocuments();
  return total360Videos;
};

const totalNoOfUsersWithRole = async (req, res) => {
  const teacher = await Video.countDocuments({ type: 'teacher' });
  const admin = await Video.countDocuments({ type: 'admin' });
  const superadmin = await Video.countDocuments({ type: 'superadmin' });
  const repoteam = await Video.countDocuments({ type: 'repoManager' });

  const object = {
    totalNoOfTeacher: teacher,
    totalNoOfAdmin: admin,
    totalNoOfSuperAdmin: superadmin,
    totalNoOfRepoTeam: repoteam,
  };
  return object;
};

const totalNoOfActiveAndDeactiveSchools = async (req, res) => {};

const totalNoOfExperienceCreated = async (req, res) => {
  const total360Videos = await Video.countDocuments();
  return total360Videos;
};

const totalNoOfVrDevice = async (req, res) => {
  const totalNoOfDevices = await Device.countDocuments();
  return totalNoOfDevices;
};

module.exports = {
  totalNoOfSchools,
  expiredLicensingInOrder,
  clientSchoolPerfomance,
  totalNoOf3dModels,
  totalNoOf360Videos,
  totalNoOfUsersWithRole,
  totalNoOfVrDevice,
  totalNoOfActiveAndDeactiveSchools,
  totalNoOfExperienceCreated,
};
