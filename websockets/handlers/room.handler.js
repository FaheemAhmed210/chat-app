const groupParticipantsService = require("../../src/groups/participants/participants.service");

const joinRoom = (io, socket) => async () => {
  try {
    socket.join("Default");
    const userId = socket.userId;
    socket.join(userId);
  } catch (err) {
    console.log(err);
  }
};

const joinAllUserGroups = (io, socket) => async () => {
  try {
    let groupIds;
    const userId = socket.userId;

    const groupIdsResp = await groupParticipantsService.getUserGroupIds(userId);

    groupIds = groupIdsResp.data;

    if (!groupIds || groupIds.length <= 0) {
      return;
    }
    // }

    // Join each group room
    groupIds.forEach((groupId) => socket.join(groupId));

    console.log(`User ${userId} joined rooms:`, groupIds);
  } catch (err) {
    console.error("Error joining rooms:", err);
  }
};

module.exports = (io, socket) => {
  joinRoom(io, socket)();
  joinAllUserGroups(io, socket)();

  // register other room specific events here
};
