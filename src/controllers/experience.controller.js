const { Session, Content, Assessment, Device } = require("../models");
const catchAsync = require("../utils/catchAsync");
const { getSignedS3Url } = require("../services/s3.service");

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

        const coordinatesDecode = await Promise.all(
          contents.map(async (content) => {
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

            // Use pre-signed S3 URL for AVPro Video Player compatibility
            if (updatedContent.youTubeDownloadedUrl) {
              // Generate a pre-signed URL (valid for 6 hours) for AVPro to access
              updatedContent.youTubePlayableUrl = await getSignedS3Url(updatedContent.youTubeDownloadedUrl);
            } else if (updatedContent.youTubeUrl) {
              // If not downloaded yet, return null
              // Frontend/VR app should handle pending/downloading states
              updatedContent.youTubePlayableUrl = null;
              console.log('[Experience] YouTube video not yet downloaded for content:', updatedContent._id);
            }

            return updatedContent;
          })
        );

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

    res.set("Cache-Control", "no-store");
    res.send(sessionsWithAssessmentsAndContents);
  }
);

module.exports = {
  getDeployedSessionsWithAssessmentsAndContents,
};
