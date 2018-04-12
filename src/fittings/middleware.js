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
    const middlewares = get(fittingDef, 'middleware', []);
    return (context, next) => {
        const {request: req, response: res} = context;
        const stack = [];
        for (let i = middlewares.length; i--; i > 0) {
            const middleware = middlewares[i];
            if (i === 0) {
                middleware(req, res, stack[stack.length - i - 1]);
            } else if (i === middlewares.length - 1) {
                stack.push(
                    () => {
                        middleware(req, res, next);
                    }
                );
            } else {
                stack.push(
                    () => {
                        middleware(req, res, stack[stack.length - i - 1]);
                    }
                );
            }
        }
    };
};


module.exports = create;