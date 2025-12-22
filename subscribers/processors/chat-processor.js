const ChatsQueue = require("../queues/chats-queue");

const redisClient = require("../../helpers/redis");
const { SOCKET_EVENTS } = require("../../src/common/constants/constants");
const collectionsService = require("../../src/collections/collections.service");
const {
  MESSAGE_TYPE_TEMPLATES,
} = require("../../src/chats/constants/chats.constants");
const webSockets = require("../../websockets");
const {
  sendNotifications,
} = require("../../src/common/google-cloud-services/firebase/firebase.util");

ChatsQueue.process(10, async (job) => {
  try {
    const { message, sendPushNotification, eventType } = job.data;
    const { sender, receiver, chatId } = message;

    const senderId = sender._id;
    const receiverId = receiver._id;

    // Fetch receiver chat settings in parallel
    const [{ data: receiverCollection }] = await Promise.all([
      collectionsService.findOne({ collectionId: chatId, userId: receiverId }),
    ]);

    const io = webSockets.getIO();

    const isMuted =
      (receiverCollection?.isMuted &&
        (receiverCollection?.mutedTill === null ||
          new Date(receiverCollection?.mutedTill) > new Date())) ??
      false;

    io.to(receiverId.toString()).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
      // messageId: uuid,
      eventType,
      message,
      sender: senderId,
      receiver: receiverId,
      chatId,
      isMuted,
    });

    if (!isMuted && sendPushNotification) {
      const sender = message.sender.displayName || message.sender.userName;

      const messageText =
        message.content.type === "text"
          ? message.content.body.replace(/@\[(.+?)\]\(.+?\)/g, "@$1")
          : MESSAGE_TYPE_TEMPLATES[message.content.type];
      await sendNotifications({
        fcmToken: message.receiver.fcmToken,
        sender,
        groupId: message.chatId.toString(),
        groupType: "chat",
        message: messageText,
        type: message.content.type,
        image: message.sender.profileImage,
        platformName: message?.receiver?.platformName || "android",
      });
    }

    return;
  } catch (ex) {
    console.log("Error:Error:", ex);
  }
});
