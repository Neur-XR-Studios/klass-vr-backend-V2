const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const youtubeCookieService = require('../services/youtube.cookie.service');

const getCookieHealth = catchAsync(async (req, res) => {
  const needsRefresh = await youtubeCookieService.needsRefresh();
  const cookiesWork = await youtubeCookieService.testCookies();

  res.status(httpStatus.OK).send({
    status: cookiesWork ? 'healthy' : 'unhealthy',
    needsRefresh,
    cookiesWork,
  });
});

const refreshCookies = catchAsync(async (req, res) => {
  await youtubeCookieService.ensureFreshCookies(true);

  res.status(httpStatus.OK).send({
    success: true,
  });
});

module.exports = {
  getCookieHealth,
  refreshCookies,
};
