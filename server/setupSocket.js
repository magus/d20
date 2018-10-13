module.exports = (server) => {
  const io = require('socket.io')(server);

  io.on('connection', socket => {
    console.log('user connected');

    socket.on('roll', msg => {
      io.emit('roll', msg);
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });
};
