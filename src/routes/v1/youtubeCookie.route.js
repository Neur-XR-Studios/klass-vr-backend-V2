const express = require('express');
const auth = require('../../middlewares/auth');
const { youtubeCookieController } = require('../../controllers');

const router = express.Router();

router.get('/health', auth('commonPermission'), youtubeCookieController.getCookieHealth);
router.post('/refresh', auth('commonPermission'), youtubeCookieController.refreshCookies);

module.exports = router;
