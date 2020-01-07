const http = require('http');

const PORTNUM = process.env.NODE_SVR_PORT;

const server = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('Hello from basic nodeJs svr >>>2<<<');
});

server.listen(PORTNUM);
console.log(`>> Server >>>2<<< listening at http://127.0.0.1:${PORTNUM}/`);
