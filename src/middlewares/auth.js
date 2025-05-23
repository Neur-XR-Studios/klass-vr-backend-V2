const passport = require("passport");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { Role, School } = require("../models");
const logger = require("../config/logger");

const verifyCallback =
  (req, resolve, reject, requiredRights) => async (err, user, info) => {
    if (err || info || !user) {
      return reject(
        new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate")
      );
    }
    req.user = user;

    if (requiredRights.length) {
      try {
        const userRole = await Role.findOne({ role: user.role }).lean();

        if (userRole) {
          const userPermissions = userRole.permissions || [];
          const hasRequiredRights = requiredRights.every((requiredRight) =>
            userPermissions.includes(requiredRight)
          );
          if (!hasRequiredRights && req.params.userId !== user.id) {
            return reject(new ApiError(httpStatus.FORBIDDEN, "Forbidden"));
          }
        } else {
          logger.error("Role not found for user:", user.role);
          return reject(
            new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Role not found")
          );
        }
      } catch (error) {
        logger.error("Error fetching role:", error);
        return reject(
          new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error fetching role")
        );
      }
    }

    // Check if the associated school's subscription is active
    if (req.user.schoolId) {
      try {
        const school = await School.findById(req.user.schoolId);
        if (!school || !school.isSubscribed) {
          return reject(
            new ApiError(httpStatus.UNAUTHORIZED, "Subscription ended")
          );
        }
      } catch (error) {
        logger.error("Error checking school subscription:", error);
        return reject(
          new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Error checking school subscription"
          )
        );
      }
    }
    if (req.user.schoolId) {
      try {
        const school = await School.findById(req.user.schoolId);
        if (!school || !school.isActive) {
          return reject(
            new ApiError(
              httpStatus.UNAUTHORIZED,
              "School is currently not active; please try again later."
            )
          );
        }
      } catch (error) {
        logger.error("Error checking school status:", error);
        return reject(
          new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Error checking school status"
          )
        );
      }
    }

    resolve();
  };

const auth =
  (...requiredRights) =>
  async (req, res, next) => {
    return new Promise((resolve, reject) => {
      passport.authenticate(
        "jwt",
        { session: false },
        verifyCallback(req, resolve, reject, requiredRights)
      )(req, res, next);
    })
      .then(() => next())
      .catch((err) => next(err));
  };

module.exports = auth;
