const express = require("express");
const authRoute = require("./auth.route");
const userRoute = require("./user.route");
const docsRoute = require("./docs.route");
const assessmentRoute = require("./assessment.route");
const sessionRoute = require("./session.route");
const contentRoute = require("./content.route");
const experienceRoute = require("./experience.route");
const roleRoute = require("./role.route");
const subscriptionRoute = require("./subscription.route");
const schoolRoute = require("./school.route");
const videoRoute = require("./video.route");
const modelRoute = require("./3dmodel.route");
const deviceRoute = require("./device.route");
const gradeRoute = require("./grade.route");
const sectionRoute = require("./section.route");
const studentRoute = require("./student.route");
const experienceConducted = require("./experienceConducted.route");
const deviceSyncAndActive = require("./activeAndSync.route");
const perfomance = require("./perfomance.route");
const imageRoute = require("./image360.route");
const dashboardRoute = require("./dashboard.route");
const simulationRoute = require("./simulation.route");
const config = require("../../config/config");

const router = express.Router();

const defaultRoutes = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/users",
    route: userRoute,
  },
  {
    path: "/assessments",
    route: assessmentRoute,
  },
  {
    path: "/sessions",
    route: sessionRoute,
  },
  {
    path: "/content",
    route: contentRoute,
  },
  {
    path: "/experience",
    route: experienceRoute,
  },
  {
    path: "/roles",
    route: roleRoute,
  },
  {
    path: "/subscriptions",
    route: subscriptionRoute,
  },
  {
    path: "/schools",
    route: schoolRoute,
  },
  {
    path: "/video",
    route: videoRoute,
  },
  {
    path: "/models",
    route: modelRoute,
  },
  {
    path: "/devices",
    route: deviceRoute,
  },
  {
    path: "/grades",
    route: gradeRoute,
  },
  {
    path: "/sections",
    route: sectionRoute,
  },
  {
    path: "/students",
    route: studentRoute,
  },
  {
    path: "/experience_conducted",
    route: experienceConducted,
  },
  {
    path: "/device_sync",
    route: deviceSyncAndActive,
  },
  {
    path: "/performance",
    route: perfomance,
  },
  {
    path: "/images",
    route: imageRoute,
  },
  {
    path: "/dashboard",
    route: dashboardRoute,
  },
  {
    path: "/simulations",
    route: simulationRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: "/docs",
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === "development") {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
