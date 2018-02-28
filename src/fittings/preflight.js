const get = require('lodash/get');
const castArray = require('lodash/castArray');
const isNil = require('lodash/isNil');
const isEmpty = require('lodash/isEmpty');

const defaults = Object.freeze({
    cors: false,
    origins: ['*'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    status: 204
});

const create = (fittingDef) => {
//TODO: Enable cors always?
    const methods = castArray(get(fittingDef, ['methods'], defaults.methods));
    const origins = castArray(get(fittingDef, ['origins'], defaults.origins));
    const status = get(fittingDef, ['status'], defaults.status);
    const cors = get(fittingDef, ['cors'], defaults.cors);
    const headers = get(fittingDef, ['headers']);

    return function (context, next) {
        const {request: req, response: res} = context;

        if (cors) {
            const origin = get(req, ['headers', 'http_origin'], '*');
            if (origins.includes('*') || origins.includes(origin)) {
                res.setHeader('Access-Control-Allow-Origin', origin);
            }
        }

        const method = get(req, ['method'], '').toUpperCase();
        if (method === 'OPTIONS') {
            const allowedHeaders = isNil(headers)
                ? get(req, ['headers', 'access-control-request-headers'])
                : castArray(headers).join(',');
            if (!isEmpty(allowedHeaders)) res.setHeader('Access-Control-Allow-Headers', allowedHeaders);

            res.setHeader('Access-Control-Allow-Methods', methods.map(m => m.toUpperCase()).join(','));
            res.setHeader('Content-Length', '0');
            res.statusCode = status;
            return res.end();
        }
        return next();
    };
};


module.exports = create;