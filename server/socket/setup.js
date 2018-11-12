const Events = require('./Events');

module.exports = server => {
  const io = require('socket.io')(server, {
    // below are engine.IO options
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
  });

  const Users = {};
  const emitUsers = () => io.emit(Events.USERS, Users);
  const disconnectUser = (userId) => {
    console.log(userId, 'disconnect');
    delete Users[userId];
    emitUsers();
  };

  io.on('connection', socket => {
    const userId = socket.id;

    console.log(userId, 'connected');
    Users[userId] = null;
    emitUsers();

    socket.on(Events.ROLL, msg => {
      io.emit(Events.ROLL, msg);
    });

    socket.on(Events.IDENTIFY, msg => {
      Users[userId] = msg;
      emitUsers();
    });

    socket.on('disconnect', () => disconnectUser(userId));
    socket.on('error', () => disconnectUser(userId));
  });
};
