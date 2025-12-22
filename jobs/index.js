const pinnedMessageUpdateJob = require("./pinned-message-update.job");

module.exports = function registerScheduledJobs() {
  pinnedMessageUpdateJob.initializeJob();
};
