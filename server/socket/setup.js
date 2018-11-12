const Events = require("./Events");

module.exports = server => {
  const io = require("socket.io")(server);

  io.on("connection", socket => {
    console.log("user connected");

    socket.on(Events.ROLL, value => {
      io.emit(Events.ROLL, { value });
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
};
