const {merge, pick, noop, get, set, isNil, castArray, has} = require('lodash');
const Promise = require('bluebird');
const swaggerRestify = require('swagger-restify-mw');
const restify = require('restify');
const path = require('path');
const swaggerParser = require('swagger-parser');
const config = require('config');
const bodyParser = require('body-parser');
const busboyBodyParcer = require('busboy-body-parser');
const Logger = require('logplease');
const logger = Logger.create('Main Application', {color: Logger.Colors.Yellow});

Logger.setLogLevel(get(config, 'loglevel', 'INFO'));

const exitCode = {
    success: 0,
    uncaughtError: 99,
    startFailed: 999
};

const signals = [
    'SIGINT',
    'SIGTERM',
    'SIGQUIT',
    'SIGHUP'
];


const create = async (definition, events, wrapper) => {

    const context = {
        env: process.env, //Register run environment
        config,
        internal: {
            definition: {
                appRoot: __dirname, //This directory
                port: get(config, 'port', 8080), //Default port
                error: noop, //Return undefined
                ...definition //Overwrite the properties
            },
        },
        events,//{onServerStart,afterStart}
        wrapper
    };


    if (isNil(get(context, 'internal.definition'))) throw new Error('The application definition cannot be undefined');

    if (isNil(get(context, 'internal.definition.appRoot'))) throw new Error('The application appRoot cannot be undefined');

    if (isNil(get(context, 'internal.definition.port'))) throw new Error('The application port cannot be undefined');

    const timeout = get(context, 'internal.definition.terminateTimeout', 5000);

    const error = get(context, 'internal.events.error', noop);

    try {
        registerErrorHandler(error); //Register and event handler when there is an unhandled exception on the application
        signals.forEach(sig => process.on(sig, onSignal(context, timeout))); //Register termination signals and how to handle them
        serverInit(context); //Initialise and start server
    } catch (err) {
        logger.error({err}, 'Service failed to start');
        process.exit(exitCode.startFailed);
    }
};

const serverInit = async (context) => {
    logger.info(`Starting API At Port ${context.internal.definition.port}`);

    await has(context, 'events.onServerStart') ? context.events.onServerStart(context) : Promise.resolve();//Execute Event If Any

    await loadSwaggerYaml(context);//Load swagger definition
    createServer(context); // Create restify server
    await swaggerize(context); //Load option for swagger configuration
    await listen(context); //Start Server

    await has(context, 'events.afterStart') ? context.events.onServerStart(context) : Promise.resolve();//Execute Event If Any

    return get(context, ['restify', 'server']);
};

const loadSwaggerYaml = async (context) => {
    const appRoot = context.internal.definition.appRoot;
    const swaggerPath = path.join(appRoot, 'api/swagger/swagger.yaml');
    const swaggerDefinition = await swaggerParser.dereference(swaggerPath); //Load swagger file
    set(context, 'swagger.definition', swaggerDefinition); //Load definition to current context
    global.swaggerDefinition = swaggerDefinition;
};

const createServer = (context) => {
    logger.debug('Creating restify server');
    const server = restify.createServer();
    server.on('uncaughtException', (req, res, route, err) => { //Register application exception handler
        logger.error({route, err}, 'An unhandled exception has occurred');
        res.send(500, 'An internal error has occurred.');
    });

    get(context, 'events.middleware', []).map(middleware => server.use(middleware)); //Register server middleware
    server.use(mapWrapperProperties(context)); //Register middleware for wrapper use
    server.use(bodyParser.json(context));
    server.use(busboyBodyParcer());
    set(context, 'restify.server', server); ////Load server to current context
};

const mapWrapperProperties = context => (req, res, next) => {
    req.wrapperProperties = get(context, 'wrapper.props', noop);
    res.errorHandler = get(context, 'wrapper.errorHandler');
    next();
};

//Create swagger configuration
const swaggerize = async (context) => {
    const appRoot = context.internal.definition.appRoot;
    logger.debug('Loading swagger definition');
    const create = Promise.promisify(swaggerRestify.create);

    const fittingsPath = path.resolve(`${__dirname}/fittings`);
    const swaggerConfig = require(`${__dirname}/config/defaultSwaggerConfig.json`); //Load default config
    castArray(get(swaggerConfig, 'fittingsDirs', [])).push(fittingsPath);

    const cors = get(context, 'env.NODE_ENV', '').toLowerCase() === 'local_dev' ? true : false;//get value for cors

    set(swaggerConfig, 'bagpipes._preflight.cors', cors); //Set value for cors

    const options = {
        ...swaggerConfig,
        ...get(context, 'config.swagger', {}),
        swagger: context.swagger.definition,
        appRoot: context.internal.definition.appRoot
    };

    const swagger = await create(options);
    logger.debug('Swagger definition loaded, registering routes with restify server');
    swagger.register(context.restify.server);
    set(context, ['swagger', 'server'], swagger);
};

const listen = async (context) => {
    logger.info('Starting restify server');
    const port = context.internal.definition.port;
    const server = context.restify.server;
    const listen = Promise.promisify(server.listen, {context: server});
    await listen(port);
    logger.info(`API started, now listening on ${port}`);
};

//Register and event handler when there is an unhandled exception on the application
const registerErrorHandler = (callback = noop) => {
    function unhandledError(err) {
        logger.error({err: err}, 'An unhandled error has occurred'); //Log Error
        return Promise.resolve(
            (async () => {
                try {
                    await callback(err); //Attempt to use call back to handle error
                } catch (err) {//If there is an exception
                    err => logger.error({err}, 'Exception handler failed');
                } finally {
                    process.exit(exitCode.uncaughtError); //Terminate a
                }
            })());
    }

    //Map the event types
    //https://nodejs.org/api/process.html#process_event_unhandledrejection
    process.on('uncaughtException', unhandledError);
    process.on('unhandledRejection', unhandledError);
};


const onSignal = (context, timeout) => () => {
    logger.info('Starting API Termination');
    Promise.race([
        Promise.delay(timeout).then(() => logger.warn('API termination is waiting too long to finish')),
        (async () => {
            try {
                await has(context, 'events.onTerminate') ? context.events.onTerminate(context) : Promise.resolve();
                logger.info('API terminated successfully');
            } catch (err) {
                logger.error({err}, 'An error occurred in terminate handler');
            }
        })()
    ]).then(
        () => process.exit(exitCode.success)
    );

};


module.exports = {create};