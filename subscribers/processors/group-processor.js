const GroupsQueue = require("../queues/groups-queue");
const { SOCKET_EVENTS } = require("../../src/common/constants/constants");
const {
  MESSAGE_TYPE_TEMPLATES,
  MESSAGE_TYPES,
} = require("../../src/common/constants/collection.constants");
const webSockets = require("../../websockets");

const {
  sendGroupNotifications,
} = require("../../src/groups/helpers/groups.socket.handler");

GroupsQueue.process(10, async (job) => {
  try {
    const { message, sendPushNotification, eventType, emitId } = job.data;
    const { sender, groupId } = message;

    const io = webSockets.getIO();

    io.to(emitId.toString()).emit(SOCKET_EVENTS.GROUP_CHAT_MESSAGE, {
      // messageId: uuid,
      eventType,
      message,
      sender: sender._id,
      groupId,
    });

    if (sendPushNotification) {
      const messageText =
        message.content.type === "text"
          ? message.content.body.replace(/@\[(.+?)\]\(.+?\)/g, "@$1")
          : MESSAGE_TYPE_TEMPLATES[message.content.type];

      if (message.content.type !== MESSAGE_TYPES.REQUEST) {
        await sendGroupNotifications({
          sender: sender.displayName || sender.userName,
          senderId: message.sender._id,
          groupId,
          groupType: "group",
          message: messageText,
          type: message.content.type,
          image: message.sender.profileImage,
        });
      }
    }

    return;
  } catch (ex) {
    console.log("Error:Error:", ex);
  }
});
