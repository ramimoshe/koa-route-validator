'use strict';

const Joi            = require('joi');
const RouteValidator = require('../../../../src/RouteValidator');


describe('RouteValidator', () => {
    test('create - valid validationObject - return middleware function', () => {
        const routeValidator     = new RouteValidator();
        const middlewareFunction = routeValidator.create();
        expect(typeof middlewareFunction).toEqual('function');
    });

    test('create - invalid validationObject - throw error', (done) => {
        const routeValidator = new RouteValidator();
        try {
            routeValidator.create({ val: 123 });
        } catch (error) {
            done();
        }
    });

    test('middleware - invalid request.body - return 400 message', () => {
        const routeValidator     = new RouteValidator();
        const middlewareFunction = routeValidator.create({
            requestSchema: {
                body: Joi.object({
                    age : Joi.number().required(),
                    name: Joi.string()
                }).required()
            }
        });

        const ctx  = {
            state  : {},
            request: {},
            throw  : jest.fn()
        };
        const next = jest.fn();

        middlewareFunction(ctx, next);

        expect(ctx.throw.mock.calls[0][0]).toEqual(400);
        expect(ctx.throw.mock.calls[0][1]).toBeDefined();

        expect(next.mock.calls.length).toEqual(0);
    });

    test('middleware - valid request.body - call next & set Joi values', () => {
        const routeValidator     = new RouteValidator();
        const middlewareFunction = routeValidator.create({
            requestSchema: {
                body: Joi.object({
                    name: Joi.string().default('floss')
                }).required()
            }
        });

        const ctx  = {
            state  : {},
            request: {
                body: {}
            },
            response: {},
            throw  : jest.fn()
        };
        const next = jest.fn();

        middlewareFunction(ctx, next);

        expect(ctx.state.rv.body).toEqual({
            name: 'floss'
        });
        expect(Object.keys(ctx.state.rv).length).toEqual(4);
        expect(next.mock.calls.length).toEqual(1);
    });

    test('middleware - valid response - call next & set Joi values', () => {
        const routeValidator     = new RouteValidator();
        const middlewareFunction = routeValidator.create({
            responseSchema: {
                body: Joi.object({
                    name: Joi.string().default('floss')
                }).required()
            }
        });

        const ctx  = {
            state  : {},
            request: {
                body: {}
            },
            response: {},
            throw  : jest.fn()
        };
        const next = jest.fn();

        middlewareFunction(ctx, next);

        expect(ctx.state.rv.body).toEqual({
            name: 'floss'
        });
        expect(Object.keys(ctx.state.rv).length).toEqual(4);
        expect(next.mock.calls.length).toEqual(1);
    });
});
