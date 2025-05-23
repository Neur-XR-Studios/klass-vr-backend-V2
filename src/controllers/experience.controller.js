const { Session, Content, Assessment, Device } = require("../models");
const catchAsync = require("../utils/catchAsync");

const getDeployedSessionsWithAssessmentsAndContents = catchAsync(
  async (req, res) => {
    const deviceId = req.headers["device-id"];
    const studentId = await Device.findOne({ deviceID: deviceId });
    const deployedSessions = await Session.find({
      isDeployed: true,
      schoolId: studentId.schoolID,
    }).populate("teacherId");

    const sessionsWithAssessmentsAndContents = await Promise.all(
      deployedSessions.map(async (session) => {
        const assessments = await Assessment.find({ sessionId: session._id });
        const contents = await Content.find({ sessionId: session._id })
          .populate("modelDetails.modelId")
          .populate("videoDetails.VideoId")
          .populate("imageDetails.ImageId")
          .populate("simulationDetails.simulationId");

        const coordinatesDecode = contents.map((content) => {
          const updatedContent = content.toObject();
          updatedContent.modelDetails.forEach((modelDetail) => {
            if (modelDetail.modelCoordinates) {
              try {
                modelDetail.modelCoordinates = JSON.parse(
                  modelDetail.modelCoordinates
                );
              } catch (error) {
                console.error("Error parsing modelCoordinates:", error);
              }
            }
          });
          return updatedContent;
        });

        return {
          session: {
            _id: session._id,
            sessionId: session.sessionId,
            sessionTimeAndDate: session.sessionTimeAndDate,
            sessionStartedTime: session.sessionStartedTime,
            sessionEndedTime: session.sessionEndedTime,
            grade: session.grade,
            sectionOrClass: session.sectionOrClass,
            sessionStatus: session.sessionStatus,
            teacherId: session.teacherId,
            subject: session.subject,
            feedback: session.feedback,
            sessionDuration: session.sessionDuration,
            isDeployed: session.isDeployed,
          },
          assessments,
          content: coordinatesDecode,
          studentID: studentId.uniqueID,
        };
      })
    );

    res.send(sessionsWithAssessmentsAndContents);
  }
);

module.exports = {
  getDeployedSessionsWithAssessmentsAndContents,
};
