const webSockets = require("../../../websockets");
const redisClient = require("../../../helpers/redis");
const groupParticipantsService = require("../participants/participants.service");
const usersService = require("../../users/users.service");

const {
  subscribeUsersToTopic,
  unSubscribeUsersToTopic,
  sendGroupNotifications,
} = require("../../common/google-cloud-services/firebase/firebase.util");

exports.sendGroupNotifications = async (sendsDto) => {
  try {
    const { senderId, sender, groupId, message, type, image } = sendsDto;
    const tokensResp = await groupParticipantsService.getFcmTokens({
      groupId,
      senderId,
    });

    if (!tokensResp.data) {
    } else {
      const { androidTokens, iosTokens } = tokensResp.data[0];

      await Promise.all([
        androidTokens?.length
          ? sendGroupNotifications({
              tokens: androidTokens,
              sender,
              groupId: groupId.toString(),
              groupType: "group",
              message,
              type,
              image,
              platformName: "android",
            })
          : null,
        ,
        iosTokens?.length
          ? sendGroupNotifications({
              tokens: iosTokens,
              sender,
              groupId: groupId.toString(),
              groupType: "group",
              message,
              type,
              image,
              platformName: "ios",
            })
          : null,
        ,
      ]);
    }
  } catch (err) {
    console.log("err::", err);
  }
};
