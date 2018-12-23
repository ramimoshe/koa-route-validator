'use strict';

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
});