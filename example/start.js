const server = require('../');
global.tortillaApi = `${__dirname}/../`;
const config = require('config');
const {get} = require('lodash');
const guid = require('guid');
const Logger = require('logplease');

const logger = (() => {
    const color = get(config, 'log.server.color', 'Yellow');
    const logger = Logger.create('Main Application', {color: Logger.Colors[color]});
    return logger;
})();


server.create(
    {
        definition: {
            appRoot: `${__dirname}`,
            logger:
                (() => {
                    const color = get(config, 'log.http.color', 'Yellow');
                    const defaultLogger = Logger.create(`Request:${guid.raw()}`, {color: Logger.Colors[color]});
                    return defaultLogger;
                }),
        },
        serverLogger: logger
    }
);
