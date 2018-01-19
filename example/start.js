const server = require('../');

global.tortillaApi = `${__dirname}/../`;

const config = require('config');
const Logger = require('logplease');
const {get} = require('lodash');
Logger.setLogLevel(get(config, 'loglevel', 'INFO'));
const guid = require('guid');



server.create({
    appRoot: `${__dirname}`,
    logger : ()=>{
        const defaultLogger = Logger.create(`Request:${guid.raw()}`, {color: Logger.Colors['Yellow']});
        return defaultLogger;
    }
});
