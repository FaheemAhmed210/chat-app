const CronJob = require("cron").CronJob;
const groupsPinnedMessagesService = require("../src/groups/pinned-messages/pinned-messages.service");

const groupMessagesService = require("../src/groups/messages/messages.service");

async function removeExpiredPins() {
  try {
    console.log("---Pinned Message Delete cron job started---");

    const now = new Date();

    // Step 1: find expired pinned messages
    const expiredGroupDocs = await groupsPinnedMessagesService.find({
      "pinnedMessages.expiresAt": { $lte: now },
    });

    const expiredGroupMessageIds = [];

    for (const doc of expiredGroupDocs) {
      for (const msg of doc.pinnedMessages) {
        if (msg.expiresAt <= now) {
          expiredGroupMessageIds.push(msg.messageId);
        }
      }
    }

    // Step 3: update group messages

    await Promise.all([
      expiredGroupMessageIds.length &&
        groupMessagesService.updateMany(
          { _id: { $in: expiredGroupMessageIds } },
          { $set: { isPinned: false } }
        ),

      groupsPinnedMessagesService.updateMany(
        { "pinnedMessages.expiresAt": { $lte: now } },
        { $pull: { pinnedMessages: { expiresAt: { $lte: now } } } }
      ),
    ]);
    console.log("---Pinned Message Delete cron job ended---");
  } catch (ex) {
    console.log("Pinned Message Delete exception", ex);
  }
}

exports.initializeJob = () => {
  const job = new CronJob("0 * * * *", removeExpiredPins, null, true);
};
