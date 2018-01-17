const sinon = require('sinon');
const proxyquire = require('proxyquire');
const Logger = require('logplease');
const swaggerParser = require('swagger-parser');
const restify = require('restify');
const Promise = require('bluebird');

describe('src/server', function () {

    let loggingLevel,
        definitionDefault,
        eventsDefault,
        wrapperDefault,
        server,
        middleware,
        serverUseStack,
        swaggerRestifyCreate;

    const sandbox = sinon.sandbox.create();

    describe('create', function () {


        afterEach(() => {
            sandbox.restore();
        });

        beforeEach(function () {

            serverUseStack = [];
            middleware = sandbox.stub().returns();

            server = {
                on: sandbox.stub().returns(),
                use: (func) => serverUseStack.push(func)
            }

            loggingLevel = {
                info: sandbox.stub().returns(),
                error: sandbox.stub().returns(),
                debug: sandbox.stub().returns(),
                warn: sandbox.stub().returns()
            };
            sandbox.stub(swaggerParser, 'dereference').resolves('fake-swaggerPath');
            swaggerRestifyCreate = sandbox.stub().resolves({
                register: sandbox.stub(),
                server: 'fake-server'
            })
            sandbox.stub(Promise, 'promisify').returns(
                swaggerRestifyCreate
            );
            sandbox.stub(process, 'env').returns();
            sandbox.stub(process, 'exit').returns();
            sandbox.stub(process, 'on');
            sandbox.stub(restify, 'createServer').returns(server);
            sandbox.stub(Logger, 'create').returns({
                    ...loggingLevel
                }
            );

            definitionDefault = {
                appRoot: 'fake-appRoot',
                port: 'fake-port',
            };

            eventsDefault = {
                onServerStart: sandbox.stub().resolves(),
                afterStart: sandbox.stub().resolves(),
                onTerminate: sandbox.stub().resolves(),
                error: sandbox.stub().resolves(),
                middleware: [
                    middleware
                ]
            };

            wrapperDefault = {
                props: sandbox.stub().resolves(),
                errorHandler: sandbox.stub().resolves()
            }
        });


        function run(definition = definitionDefault, events = eventsDefault, wrapper = wrapperDefault) {
            const src = proxyquire(`${__BASE}/src/server`, {});
            return src.create(definition, events, wrapper);
        }


        it('should start server', async function () {

            await run();

            loggingLevel.info.should.have.been.calledWith(`API started, now listening on fake-port`)
        });

        it('should throw an error when definition appRoot is nill', async function () {
            try {
                await run({
                    ...definitionDefault,
                    appRoot: null
                });
            } catch (err) {
                err.message.should.equal('The application appRoot cannot be undefined');
                return;
            }
            throw new Error('Test did not passed');
        });

        it('should throw an error when definition port is nill', async function () {
            try {
                await run({
                    ...definitionDefault,
                    port: null
                });
            } catch (err) {
                err.message.should.equal('The application port cannot be undefined');
                return;
            }
            throw new Error('Test did not passed');
        });

        it('should not call onServerStart event', async function () {

            await run(definitionDefault, {
                ...eventsDefault,
                onServerStart: undefined
            }, wrapperDefault);

            eventsDefault.onServerStart.should.not.have.been.calledWith();
        });

        it('should call afterStart event', async function () {

            await run();

            eventsDefault.afterStart.should.have.been.calledWith();
        });

        it('should not call afterStart event', async function () {

            await run(definitionDefault, {
                ...eventsDefault,
                afterStart: undefined
            }, wrapperDefault);

            eventsDefault.afterStart.should.not.have.been.calledWith();
        });

        it('should call uncaughtException event', async function () {

            await run();
            const event = process.on.args.find(arg => arg[0] === 'uncaughtException')[1];
            event();

            eventsDefault.error.should.have.been.calledWith();
        });


        it('should call uncaughtException event on createServer', async function () {
            await run();
            const event = server.on.args.find(arg => arg[0] === 'uncaughtException')[1];
            event(
                {},
                {
                    send: sandbox.stub().returns()
                },
                {route: 'fake-route'},
                {err: 'fake-err'}
            );
            loggingLevel.error.args[0].should.deep.equal([
                {
                    'route': {
                        'route': 'fake-route'
                    },
                    'err': {
                        'err': 'fake-err'
                    }
                },
                'An unhandled exception has occurred'
            ]);

        });

        it('should throw an exception on uncaughtException event', async function () {
            await run(definitionDefault, {
                ...eventsDefault,
                error: () => {
                    throw new Error('fake-error')
                }
            }, wrapperDefault);
            const event = process.on.args.find(arg => arg[0] === 'uncaughtException')[1];
            event();

            process.exit.should.have.been.calledWith(99);
        });

        it('should call onSignal event', async function () {
            const clock = sandbox.useFakeTimers();
            await run(
                {
                    ...definitionDefault,
                    terminateTimeout: 10000
                },
                eventsDefault,
                wrapperDefault
            );

            const event = process.on.args.find(arg => arg[0] === 'SIGINT')[1];
            await event();
            eventsDefault.onTerminate.should.have.been.calledWith()
            clock.restore();
        });

        it('should call onSignal timeout event', async function () {
            await run(
                {
                    ...definitionDefault,
                    terminateTimeout: 1
                },
                {
                    ...eventsDefault,
                    onTerminate: Promise.delay(500)
                },
                wrapperDefault
            );
            const event = process.on.args.find(arg => arg[0] === 'SIGINT')[1];
            await event();
            await Promise.delay(500)
            loggingLevel.warn.should.have.been.calledWith('API termination is waiting too long to finish');
        });

        it('should throw exception onSignal event', async function () {
            const clock = sandbox.useFakeTimers();
            const err = new Error('fake-error')
            await run(
                {
                    ...definitionDefault,
                    terminateTimeout: 10000
                },
                {
                    ...eventsDefault,
                    onTerminate: () => {
                        throw err;
                    }
                },
                wrapperDefault
            );
            const event = process.on.args.find(arg => arg[0] === 'SIGINT')[1];
            await event();
            loggingLevel.error.should.have.been.calledWith(sinon.match.any, 'An error occurred in terminate handler')
            clock.restore();
        });

        it('should call mapWrapperProperties', async function () {
            const next = sandbox.stub();
            await run();

            serverUseStack[1]({}, {}, next);

            next.should.have.been.calledWith();

        })

        it('should use NODE_ENV local_dev', async function () {
            process.env.NODE_ENV = 'local_dev'

            await run();

            swaggerRestifyCreate.args[0][0].bagpipes._preflight.cors.should.equal(true);
        })

        it('should use throw exception on create', async function () {

            const err = new Error('fake-err');

            await run(
                definitionDefault,
                {
                    ...eventsDefault,
                    onServerStart:()=>{throw err}
                },
                wrapperDefault
            );
            loggingLevel.error.should.have.been.calledWith({err},'Service failed to start')
            process.exit.should.have.been.calledWith(999);

        })

    });


});