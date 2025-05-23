const { Subscription } = require("../models");
const logger = require("../config/logger");

const plansData = [
  {
    name: "Basic Plan",
    term: "30",
    description: "Includes basic features with standard support.",
  },
  {
    name: "Annual Plan",
    term: "360",
    description:
      "Includes advanced features, priority support, and a discounted annual rate.",
  },
  {
    name: "Trial Plan",
    term: "15",
    description:
      "Includes advanced features and priority support for a 15-day trial period.",
  },
];

// Function to seed plans
const seedPlans = async () => {
  try {
    for (const planData of plansData) {
      // Check if plan with the same name already exists
      const existingPlan = await Subscription.findOne({ name: planData.name });

      // If plan doesn't exist, insert it
      if (!existingPlan) {
        await Subscription.create(planData);
        logger.info(`Subscription '${planData.name}' seeded successfully!`);
      } else {
        return false;
      }
    }
  } catch (error) {
    console.error(`Error seeding plans: ${error}`);
  }
};

module.exports = {
  seedPlans,
};
