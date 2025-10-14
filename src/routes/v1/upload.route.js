const express = require('express');
const auth = require('../../middlewares/auth');
const uploadController = require('../../controllers/upload.controller');

const router = express.Router();

// For now, restrict to users who can manage videos
router.post('/initiate', auth('manageVideos'), uploadController.initiate);
router.post('/presign', auth('manageVideos'), uploadController.presign);
router.post('/complete', auth('manageVideos'), uploadController.complete);
router.post('/abort', auth('manageVideos'), uploadController.abort);

module.exports = router;
