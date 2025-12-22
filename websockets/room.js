const joinRoom = (io, socket) => async () => {
  try {
    socket.join("Default");
  } catch (err) {
    console.log(err);
  }
};

module.exports = (io, socket) => {
  joinRoom(io, socket)();

  // register other room specific events here
};
