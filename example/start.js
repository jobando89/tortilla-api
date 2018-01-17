const server = require('../');

global.tortillaApi = `${__dirname}/../`;

server.create({
    appRoot: `${__dirname}`
});
