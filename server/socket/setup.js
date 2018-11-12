const Events = require("./Events");

module.exports = server => {
  const io = require("socket.io")(server);

  io.on("connection", socket => {
    console.log("user connected");

    socket.on(Events.ROLL, msg => {
      io.emit(Events.ROLL, msg);
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
};
