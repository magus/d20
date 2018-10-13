// This file doesn't go through babel or webpack transformation.
// Make sure the syntax and sources this file requires are compatible with the current node version you are running
// See https://github.com/zeit/next.js/issues/1245 for discussions on Universal Webpack or universal Babel
// https://nextjs.org/docs/#custom-server-and-routing
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // Be sure to pass `true` as the second argument to `url.parse`.
    // This tells it to parse the query portion of the URL.
    const parsedUrl = parse(req.url, true);
    const { pathname, query } = parsedUrl;

    // console.log({ pathname, query });

    handle(req, res, parsedUrl);
  }).listen(3000, err => {
    if (err) throw err;

    console.log('> Ready on http://localhost:3000');

    const io = require('socket.io')(server);
    io.on('connection', socket => {
      console.log('user connected');

      socket.on('disconnect', () => {
        console.log('user disconnected');
      });
    });
  });
});
