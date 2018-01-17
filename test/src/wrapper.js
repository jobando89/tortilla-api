const sinon = require('sinon');
const proxyquire = require('proxyquire');
const Logger = require('logplease');
const {has, set} = require('lodash');


describe('src/wrapper', function () {

    const sandbox = sinon.sandbox.create();

    describe('wrap', function () {

        let loggingLevel;

        function run(operation) {
            const src = proxyquire(`${__BASE}/src/wrapper`, {});
            return src.wrap(operation);
        }

        afterEach(() => {
            sandbox.restore();
        });

        beforeEach(function () {
            loggingLevel = {
                info: sandbox.stub().returns(),
                error: sandbox.stub().returns(),
                debug: sandbox.stub().returns(),
                warn: sandbox.stub().returns()
            };
            sandbox.stub(Logger, 'create').returns({
                    ...loggingLevel
                }
            );
        });

        it('should return an ok status', async function () {

            const res = {
                send: sandbox.stub().returns()
            }

            await run()({}, res);
        });

        it('should map wrapperProperties functions', async function () {
            let fakewrapper = undefined;
            const fakeFunction = sandbox.stub().returns();
            const req = {
                wrapperProperties: sandbox.stub().returns({
                    fakeFunction
                })
            };
            const res = {
                send: sandbox.stub().returns()
            };
            const operation = (wrapper) => {
                fakewrapper = wrapper
            };

            await run(operation)(req, res);

            has(fakewrapper, 'fakeFunction').should.equal(true);
        });

        it('should call created', async function () {
            const send = sandbox.stub();
            let fakewrapper = undefined;
            const res = {
                send: sandbox.stub().returns()
            }
            const operation = (wrapper) => {
                fakewrapper = wrapper
            };
            set(fakewrapper, '_res.send', send)

            await run(operation)({}, res);

            fakewrapper.reply.created();

            fakewrapper._res.send.should.have.been.calledWith(201)
        });

        it('should call noContent', async function () {
            const send = sandbox.stub();
            let fakewrapper = undefined;
            const res = {
                send: sandbox.stub().returns()
            }
            const operation = (wrapper) => {
                fakewrapper = wrapper
            };
            set(fakewrapper, '_res.send', send)

            await run(operation)({}, res);

            fakewrapper.reply.noContent();

            fakewrapper._res.send.should.have.been.calledWith(204)
        });

        it('should call badRequest', async function () {
            const send = sandbox.stub();
            let fakewrapper = undefined;
            const res = {
                send: sandbox.stub().returns()
            }
            const operation = (wrapper) => {
                fakewrapper = wrapper
            };
            set(fakewrapper, '_res.send', send)

            await run(operation)({}, res);

            fakewrapper.reply.badRequest();

            fakewrapper._res.send.should.have.been.calledWith(400)
        });

        it('should call unauthorized', async function () {
            const send = sandbox.stub();
            let fakewrapper = undefined;
            const res = {
                send: sandbox.stub().returns()
            }
            const operation = (wrapper) => {
                fakewrapper = wrapper
            };
            set(fakewrapper, '_res.send', send)

            await run(operation)({}, res);

            fakewrapper.reply.unauthorized();

            fakewrapper._res.send.should.have.been.calledWith(401)
        });

        it('should call forbidden', async function () {
            const send = sandbox.stub();
            let fakewrapper = undefined;
            const res = {
                send: sandbox.stub().returns()
            }
            const operation = (wrapper) => {
                fakewrapper = wrapper
            };
            set(fakewrapper, '_res.send', send)

            await run(operation)({}, res);

            fakewrapper.reply.forbidden();

            fakewrapper._res.send.should.have.been.calledWith(403)
        });

        it('should call notFound', async function () {
            const send = sandbox.stub();
            let fakewrapper = undefined;
            const res = {
                send: sandbox.stub().returns()
            }
            const operation = (wrapper) => {
                fakewrapper = wrapper
            };
            set(fakewrapper, '_res.send', send)

            await run(operation)({}, res);

            fakewrapper.reply.notFound();

            fakewrapper._res.send.should.have.been.calledWith(404)
        });

        it('should call internalServerError', async function () {
            const send = sandbox.stub();
            let fakewrapper = undefined;
            const res = {
                send: sandbox.stub().returns()
            }
            const operation = (wrapper) => {
                fakewrapper = wrapper
            };
            set(fakewrapper, '_res.send', send)

            await run(operation)({}, res);

            fakewrapper.reply.internalServerError();

            fakewrapper._res.send.should.have.been.calledWith(500)
        });

        it('should call internalServerError', async function () {
            const send = sandbox.stub();
            let fakewrapper = undefined;
            const res = {
                send: sandbox.stub().returns()
            }
            const operation = (wrapper) => {
                fakewrapper = wrapper
            };
            set(fakewrapper, '_res.send', send)

            await run(operation)({}, res);

            fakewrapper.reply.internalServerError();

            fakewrapper._res.send.should.have.been.calledWith(500)
        });

        it('should call wrapper log', async function () {
            let fakewrapper = undefined;
            const res = {
                send: sandbox.stub().returns()
            };

            const operation = (wrapper) => {
                fakewrapper = wrapper
            };
            const req = {
                swagger:{
                    params:{
                        'fake-param':{
                            value:'fake-value'
                        }
                    }
                },
            }
            await run(operation)(req, res);

            const logger = fakewrapper.logger

            logger.info('fake-log');
            loggingLevel.info.should.have.been.calledWith('fake-log')
        });

        it('should call get a request', async function () {
            let fakewrapper = undefined;
            const res = {
                send: sandbox.stub().returns()
            }
            const operation = (wrapper) => {
                fakewrapper = wrapper
            };
            const req = {
                swagger:{
                    params:{
                        'fake-param':{
                            value:'fake-value'
                        }
                    }
                },
            }
            await run(operation)(req, res);

            const fakeValue = fakewrapper.req.getParam('fake-param');

            fakeValue.should.equal('fake-value')
        });


        it('should handle an error in the operation and return 500', async function () {
            const err = new Error('fake-err');
            const send = sandbox.stub().returns()
            const res = {
                send
            };

            let fakewrapper = undefined;
            const operation = (wrapper) => {
                fakewrapper = wrapper;
                throw err;
            };

            await run(operation)({}, res);

            fakewrapper._res.send.should.have.been.calledWith(500)
        });


        it('should handle an error in the catch block and log it', async function () {
            const err = new Error('fake-err');
            const send = () => {
                throw err;
            }
            const res = {
                send
            }

            let fakewrapper = undefined;
            const operation = (wrapper) => {
                fakewrapper = wrapper;
                throw err;
            };

            await run(operation)({}, res);

            loggingLevel.error.should.have.been.calledWith('Failed to send API response');
        });

    });
});