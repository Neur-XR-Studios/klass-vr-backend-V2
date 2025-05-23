const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { subscriptionService } = require('../services');

const create = catchAsync(async (req, res) => {
  const subscription = await subscriptionService.createSubscription(req.body);
  res.status(httpStatus.CREATED).send(subscription);
});

const getById = catchAsync(async (req, res) => {
  const subscription = await subscriptionService.getSubscriptionById(req.params.subscriptionId);
  res.status(httpStatus.OK).send(subscription);
});

const update = catchAsync(async (req, res) => {
  const subscription = await subscriptionService.updateSubscription(req.params.subscriptionId, req.body);
  res.status(httpStatus.OK).send(subscription);
});

const remove = catchAsync(async (req, res) => {
  await subscriptionService.deleteSubscription(req.params.subscriptionId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getAll = catchAsync(async (req, res) => {
  const subscriptions = await subscriptionService.getAllSubscriptions();
  res.status(httpStatus.OK).send(subscriptions);
});

module.exports = {
  create,
  getById,
  update,
  remove,
  getAll,
};
