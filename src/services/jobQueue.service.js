const { processYouTubeVideo } = require('./youtubeDownload.service');

// In-memory job queue (simple implementation)
// For production, consider using Bull with Redis
const jobQueue = [];
const processingJobs = new Set();
const MAX_CONCURRENT_JOBS = 2; // Process 2 videos at a time

/**
 * Add YouTube download job to queue
 * @param {string} contentId - Content document ID
 * @returns {Object} - Job info
 */
function queueYouTubeDownload(contentId) {
  // Check if already in queue or processing
  const existingJob = jobQueue.find(job => job.contentId === contentId);
  if (existingJob) {
    console.log('[Job Queue] Job already in queue:', contentId);
    return existingJob;
  }

  if (processingJobs.has(contentId)) {
    console.log('[Job Queue] Job already processing:', contentId);
    return { contentId, status: 'processing' };
  }

  const job = {
    contentId,
    status: 'queued',
    queuedAt: new Date(),
  };

  jobQueue.push(job);
  console.log('[Job Queue] Added job to queue:', contentId, '| Queue size:', jobQueue.length);

  // Start processing if not at capacity
  processNextJob();

  return job;
}

/**
 * Process next job in queue
 */
async function processNextJob() {
  // Check if we're at capacity
  if (processingJobs.size >= MAX_CONCURRENT_JOBS) {
    console.log('[Job Queue] At capacity. Processing:', processingJobs.size, '| Queued:', jobQueue.length);
    return;
  }

  // Get next job
  const job = jobQueue.shift();
  if (!job) {
    return; // No jobs in queue
  }

  const { contentId } = job;
  processingJobs.add(contentId);

  console.log('[Job Queue] Starting job:', contentId, '| Active:', processingJobs.size, '| Queued:', jobQueue.length);

  try {
    // Process the video
    await processYouTubeVideo(contentId);
    console.log('[Job Queue] ✓ Job completed:', contentId);
  } catch (error) {
    console.error('[Job Queue] Job failed:', contentId, error.message);
  } finally {
    // Remove from processing set
    processingJobs.delete(contentId);

    // Process next job
    setImmediate(() => processNextJob());
  }
}

/**
 * Get queue status
 * @returns {Object} - Queue statistics
 */
function getQueueStatus() {
  return {
    queued: jobQueue.length,
    processing: processingJobs.size,
    jobs: jobQueue.map(j => ({
      contentId: j.contentId,
      queuedAt: j.queuedAt,
    })),
    processingJobs: Array.from(processingJobs),
  };
}

// Auto-process jobs every 10 seconds (safety net)
setInterval(() => {
  if (jobQueue.length > 0 && processingJobs.size < MAX_CONCURRENT_JOBS) {
    console.log('[Job Queue] Auto-check: Processing next job...');
    processNextJob();
  }
}, 10000);

module.exports = {
  queueYouTubeDownload,
  getQueueStatus,
};
