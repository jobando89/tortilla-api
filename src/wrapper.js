const {get, keys, noop} = require('lodash');
const guid = require('guid');
const config = require('config');
const Logger = require('logplease');
const logger = Logger.create(`Request:${guid.raw()}`, {color: Logger.Colors.Yellow});
Logger.setLogLevel(get(config, 'loglevel', 'INFO'));

class Wrapper {
    constructor(req, res) {
        this._req = req;
        this._res = res;
    }

    static wrap(operation) {
        return async (req, res) => {
            const wrapper = new Wrapper(req, res);
            const wrapperFunction = get(req, 'wrapperProperties', noop);
            const wrapperProperties = wrapperFunction(wrapper.req, wrapper.res);
            keys(wrapperProperties).forEach(key => {
                wrapper[key] = wrapperProperties[key];
            });

            try {
                return await operation(wrapper);
            }
            catch (err) {
                try {
                    const message = get(err, 'message', 'Unknown error occurred');
                    let statusCode = get(err, 'statusCode', 500);
                    logger.error(message, err);
                    const defaultHandler = wrapper.reply;
                    const errorHandler = get(res, 'errorHandler', defaultHandler);
                    return errorHandler(statusCode, message);
                }
                catch (sendError) {
                    logger.error('Failed to send API response', sendError);
                }
            }
        };
    }

    get req() {
        const getParam = (name) => {
            return get(this._req, ['swagger', 'params', name, 'value']);
        };
        return {
            ...this._req,
            getParam,
        };
    }

    get res() {
        return this._res;
    }

    get reply() {
        const reply = (code, payload) => this._res.send(code, payload);
        reply.ok = payload => reply(200, payload);
        reply.created = payload => reply(201, payload);
        reply.noContent = payload => reply(204, payload);
        reply.badRequest = payload => reply(400, payload);
        reply.unauthorized = payload => reply(401, payload);
        reply.forbidden = payload => reply(403, payload);
        reply.notFound = payload => reply(404, payload);
        reply.internalServerError = payload => reply(500, payload);
        return reply;
    }

    get logger() {
        return logger;
    }
}


module.exports = Wrapper;