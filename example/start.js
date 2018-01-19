const server = require('../');
global.tortillaApi = `${__dirname}/../`;
const config = require('config');
const {get} = require('lodash');
const guid = require('guid');


const logger = () => {
    const Logger = require('logplease');
    const color = get(config, 'log.server.color', 'Yellow');
    const logger = Logger.create('Main Application', {color: Logger.Colors[color]});
    Logger.setLogLevel(get(config, 'log.server.level', 'INFO'));
    return logger;
}


server.create({
        appRoot: `${__dirname}`,
        logger: () => {
            const Logger = require('logplease');
            const color = get(config, 'log.http.color', 'Yellow');
            Logger.setLogLevel(get(config, 'log.http.level', 'INFO'));
            const defaultLogger = Logger.create(`Request:${guid.raw()}`, {color: Logger.Colors[color]});
            return defaultLogger;
        },
    },
    {},
    {},
    logger()
);
