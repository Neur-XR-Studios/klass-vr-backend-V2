const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { sessionService } = require('../services');
const { Session } = require('../models');

const createSession = catchAsync(async (req, res) => {
  const teacherId = req.user.id;
  const schoolId = req.user.schoolId;
  const session = await sessionService.createSession(req.body, teacherId, schoolId);
  res.status(httpStatus.CREATED).send(session);
});

const getSessions = catchAsync(async (req, res) => {
  const result = await sessionService.querySessions(req);
  res.send(result);
});

const getSession = catchAsync(async (req, res) => {
  const session = await sessionService.getSessionById(req.params.sessionId);

  if (!session) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Session not found');
  }

  res.send(session);
});

const updateSession = catchAsync(async (req, res) => {
  const updatedSession = await sessionService.updateSessionById(req.params.sessionId, req.body);
  res.send(updatedSession);
});

const deleteSession = catchAsync(async (req, res) => {
  await sessionService.deleteSessionById(req.params.sessionId);
  res.status(httpStatus.NO_CONTENT).send();
});

const deploySession = catchAsync(async (req, res) => {
  const { sessionId } = req.params;
  const schoolId = req.user.schoolId;
  const checkAllFalse = await Session.find({
    schoolId,
    isDeployed: true,
  });
  if (checkAllFalse.length !== 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Session is already in progress. Please try again later.');
  }
  // const session = await sessionService.getSessionById(sessionId, schoolId);

  // const conflictingSession = await sessionService.getConflictingSession(schoolId, session.sessionTimeAndDate);

  // if (conflictingSession) {
  //   throw new Error('Another session is already scheduled for the same time or overlaps with the current session');
  // }
  const updatedSession = await sessionService.deploySession(sessionId, schoolId);
  res.status(httpStatus.OK).send(updatedSession);
});

const filterSessions = catchAsync(async (req, res) => {
  const filters = req.body;
  const schoolId = req.user.schoolId;
  const result = await sessionService.filterOption(filters, schoolId);
  res.send(result);
});

const queryUserSessions = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const filters = req.body;
  const result = await sessionService.queryUserSessions(filters, userId);
  res.send(result);
});

const queryDrafts = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await sessionService.getSessionsWithDrafts(userId);
  res.send(result);
});

module.exports = {
  createSession,
  getSessions,
  getSession,
  updateSession,
  deleteSession,
  deploySession,
  filterSessions,
  queryUserSessions,
  queryDrafts,
};
