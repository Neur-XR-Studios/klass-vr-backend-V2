const { Subscription } = require('../models');

async function createSubscription(subscriptionBody) {
  const { startDate, endDate } = subscriptionBody;
  const term = await calculateTerm(startDate, endDate);

  const subscriptionData = { ...subscriptionBody, term };

  const subscription = await Subscription.create(subscriptionData);
  return subscription;
}

async function getSubscriptionById(subscriptionId) {
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }
  return subscription;
}

async function updateSubscription(subscriptionId, updateBody) {
  const { startDate, endDate } = updateBody;
  let term;
  if (startDate && endDate) {
    term = await calculateTerm(startDate, endDate);
  }

  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  Object.assign(subscription, { ...updateBody, term });
  await subscription.save();
  return subscription;
}

async function deleteSubscription(subscriptionId) {
  const subscription = await Subscription.findByIdAndDelete(subscriptionId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }
}

async function getAllSubscriptions() {
  const subscriptions = await Subscription.find();
  return subscriptions;
}
async function calculateTerm(startDate, endDate) {
  if (!startDate || !endDate) {
    throw new Error('Start date and end date are required');
  }
  const diffInMs = endDate - startDate;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  return diffInDays;
}

module.exports = {
  createSubscription,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  getAllSubscriptions,
};
