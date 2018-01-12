const server = require('./src/server');
const wrapper = require('./src/wrapper');

module.exports = {
    create: server.create,
    wrapper
};
