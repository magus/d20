const Events = require("./Events");

module.exports = server => {
  const io = require("socket.io")(server);

  const Users = {};
  const updateUsers = () => io.emit(Events.USERS, Users);

  io.on("connection", socket => {
    const userId = socket.id;

    console.log("user connected");
    Users[userId] = null;
    updateUsers();

    socket.on(Events.ROLL, msg => {
      io.emit(Events.ROLL, msg);
    });

    socket.on(Events.IDENTIFY, msg => {
      Users[userId] = msg;
      updateUsers();
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
      delete Users[userId];
      updateUsers();
    });
  });
};
