const {get, keys, noop, isNil} = require('lodash');
const Promise = require('bluebird');

class Wrapper {
    constructor(req, res, logger) {
        this._req = req;
        this._res = res;
        this._logger = logger;
    }

    static wrap(operation) {
        return async (req, res) => {
            const logger = get(req, 'logger');
            const wrapper = new Wrapper(req, res, logger);
            wrapper.logger.info('Start Request');
            const wrapperFunction = get(req, 'wrapperProperties', noop);
            const wrapperProperties = wrapperFunction(wrapper.req, wrapper.res);
            keys(wrapperProperties).forEach(key => {
                wrapper[key] = wrapperProperties[key];
            });

            try {
                await (!isNil(operation) ? operation :
                    () => {
                        wrapper.reply.ok();
                        return Promise.resolve;
                    }
                )(wrapper);
                return wrapper.logger.info('End Request');
            }
            catch (err) {
                try {
                    const message = get(err, 'message', 'Unknown error occurred');
                    let statusCode = get(err, 'statusCode', 500);
                    logger.error(message, err);
                    const defaultHandler = wrapper.reply;
                    const errorHandler = get(res, 'errorHandler', defaultHandler);
                    return errorHandler(statusCode, message, wrapper.reply);
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
        const defaultLogger =
            {
                debug: (get(this, '_logger.debug', noop)).bind(this._logger),
                log: (get(this, '_logger.log', noop)).bind(this._logger),
                info: (get(this, '_logger.info', noop)).bind(this._logger),
                warn: (get(this, '_logger.warn', noop)).bind(this._logger),
                error: (get(this, '_logger.error', noop)).bind(this._logger)
            };
        return defaultLogger;
    }
}


module.exports = Wrapper;