const School = require("./models/school.model");

async function updateSubscriptionRemainingDays() {
  try {
    await School.updateMany(
      {
        isSubscribed: true,
        subscriptionRemainingDays: { $gt: 0 },
      },
      {
        $inc: { subscriptionRemainingDays: -1 },
      }
    );

    await School.updateMany(
      {
        isSubscribed: true,
        subscriptionRemainingDays: 0,
      },
      {
        $set: { isSubscribed: false },
      }
    );

    console.log("Subscription remaining days updated successfully.");
  } catch (error) {
    console.error("Error updating subscription remaining days:", error);
  }
}

module.exports = () => {
  updateSubscriptionRemainingDays();
};
