const admin = require("firebase-admin");
const path = require("path");
const { googleCloud } = require("../../../../configs");

const serviceAccount = require(path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  googleCloud.firebase.serviceAccountKey
));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.broadcastNotification = async (
  notification,
  fcmTokens,
  result = {}
) => {
  try {
    const notificationOptions = {
      timeToLive: googleCloud.firebase.notificationTTL,
    };
    const notificationMessage = {
      title: notification.title,
      body: notification.message,
    };

    const response = await admin.messaging().sendMulticast({
      notification: notificationMessage,
      tokens: fcmTokens,
    });
    result.data = response;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.sendNotifications = async (notificationsDto, result = {}) => {
  try {
    const {
      fcmToken,
      sender,
      groupId,
      groupType,
      message,
      image,
      platformName,
    } = notificationsDto;

    const notificationMessage = {
      token: fcmToken,
      data: {
        sender,
        groupId,
        groupType,
        message,
        image,
      },
      android: {
        priority: "high",
      },

      ...(platformName === "ios" && {
        notification: {
          title: sender,
          body: message,
        },
        apns: {
          headers: {
            "apns-priority": "10",
            "apns-push-type": "alert",
          },
          payload: {
            aps: {
              "mutable-content": 1,
              alert: {
                title: sender,
                body: message,
              },
              sound: "annaywali.mp3",
              badge: 1,
            },
          },
          fcm_options: {
            image,
          },
        },
      }),
    };

    const response = await admin.messaging().send(notificationMessage);

    result.data = response;
  } catch (ex) {
    console.log("ex:::::", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.subscribeUsersToTopic = async (tokens, topic, result = {}) => {
  try {
    const response = await admin.messaging().subscribeToTopic(tokens, topic);

    result.data = response;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.unSubscribeUsersToTopic = async (tokens, topic, result = {}) => {
  try {
    const response = await admin
      .messaging()
      .unsubscribeFromTopic(tokens, topic);

    result.data = response;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.sendGroupNotifications = async (notificationsDto, result = {}) => {
  try {
    const { sender, groupId, groupType, message, image, platformName, tokens } =
      notificationsDto;

    const notificationMessage = {
      tokens,
      data: {
        sender,
        groupId,
        groupType,
        message,
        image,
      },
      android: {
        priority: "high",
      },

      ...(platformName === "ios" && {
        notification: {
          title: sender,
          body: message,
        },
        apns: {
          headers: {
            "apns-priority": "10",
            "apns-push-type": "alert",
          },
          payload: {
            aps: {
              "mutable-content": 1,
              alert: {
                title: sender,
                body: message,
              },
              sound: "annaywali.mp3",
              badge: 1,
            },
          },
          fcm_options: {
            image,
          },
        },
      }),
    };

    const response = await admin
      .messaging()
      .sendEachForMulticast(notificationMessage);

    result.data = response;
  } catch (ex) {
    console.log("ex:::::", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};
