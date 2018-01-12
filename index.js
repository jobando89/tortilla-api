const server = require('./src/server');

module.exports = {
    create: server.create
};

server.create({
    appRoot: __dirname
});
