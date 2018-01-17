const sinon = require('sinon');
const proxyquire = require('proxyquire');
const Logger = require('logplease');
const {has, set} = require('lodash');


describe('src/fittings/preflight', function () {

    const sandbox = sinon.sandbox.create();

    describe('create', function () {

        let context, next;

        afterEach(() => {
            sandbox.restore();
        });

        beforeEach(function () {
            context = {
                request: {},
                response: {
                    setHeader: sandbox.stub().returns()
                }
            };
            next = sandbox.stub().returns();
        });

        function run(fittingDef, contextArg = context) {
            const src = proxyquire(`${__BASE}/src/fittings/preflight`, {});
            return src(fittingDef)(contextArg, next);
        }

        it('should call next', async function () {

            await run();

            next.should.have.been.calledWith();
        });

        it('should set * for Access-Control-Allow-Origin', async function () {

            await run({
                cors: true
            });

            context.response.setHeader.should.have.been.calledWith('Access-Control-Allow-Origin', '*');
        });

        it('should set fake-value for Access-Control-Allow-Origin', async function () {

            set(context, 'request.headers.http_origin', 'fake-value');
            await run({
                    cors: true,
                    origins: ['fake-value'],
                },
                context
            );

            context.response.setHeader.should.have.been.calledWith('Access-Control-Allow-Origin', 'fake-value');
        });

        it('should not set fake-value for Access-Control-Allow-Origin', async function () {

            set(context, 'request.headers.http_origin', 'fake-origin');

            await run({
                    cors: true,
                    origins: ['fake-value'],
                },
                context
            );

            context.response.setHeader.should.not.have.been.calledWith();
        });

        it('should end the request on OPTIONS method', async function () {

            set(context, 'request.method', 'OPTIONS');
            set(context, 'response.end', sandbox.stub().returns());

            await run(
                {},
                context
            );

            context.response.end.should.have.been.calledWith();
        });

        it('should use Access-Control-Allow-Headers fake-headers', async function () {

            set(context, 'request.method', 'OPTIONS');
            set(context, 'response.end', sandbox.stub().returns());

            await run(
                {
                    headers:'fake-headers'
                },
                context
            );

            context.response.setHeader.should.have.been.calledWith('Access-Control-Allow-Headers', 'fake-headers');
        });

    });
});