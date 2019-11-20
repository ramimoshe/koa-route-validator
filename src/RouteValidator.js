'use strict';

const EventEmitter = require('events');
const Joi          = require('@hapi/joi');
const _            = require('lodash/fp');

const reduce = _.reduce.convert({ 'cap': false });


class RouteValidator extends EventEmitter {
    get _inputSchema() {
        return Joi.object({
            request : Joi.object({
                body       : Joi.object().keys({ isJoi: true }).unknown(),
                headers    : Joi.object().keys({ isJoi: true }).unknown(),
                params     : Joi.object().keys({ isJoi: true }).unknown(),
                queryString: Joi.object().keys({ isJoi: true }).unknown()
            }).optional(),
            response: Joi.object({
                body   : Joi.object().keys({ isJoi: true }).unknown(),
                headers: Joi.object().keys({ isJoi: true }).unknown()
            }).optional()
        });
    }

    create(validationObject) {
        const inputValidationResult = this._inputSchema.validate(validationObject);
        if (inputValidationResult.error) {
            throw new Error(inputValidationResult.error.message);
        }

        return async (ctx, next) => {
            const requestValidationResult = this._validateRequest(ctx, validationObject.request);
            if (this._hasError(requestValidationResult)) {
                return ctx.throw(400, JSON.stringify({ validationResults: this._extractErrors(requestValidationResult) }));
            }

            ctx.state.rv = this._getJoiValues(requestValidationResult);

            await next();

            if (ctx.response.status === 200) {
                const responseValidationResult = this._validateResponse(ctx, validationObject.response);
                if (!_.isEmpty(responseValidationResult)) {
                    this.emit('warn', {
                        path: _.get('matched[0].path')(ctx),
                        responseValidationResult
                    });
                    ctx.status = 500;
                    ctx.body   = {};
                    return;
                }
            }
        };
    }

    _getJoiValues(validationResults) {
        return reduce((result, validationResult, key) => {
            result[key] = validationResult.value;

            return result;
        }, {})(validationResults);
    }

    _extractErrors(validationResult) {
        return reduce((result, value, key) => {
            if (!_.isEmpty(value.error)) {
                result.push({
                    [key]: value.error.message
                });
            }

            return result;
        }, [])(validationResult);
    }

    _hasError(requestValidationResult) {
        return _.filter(r => !_.isEmpty(r.error))(requestValidationResult).length > 0;
    }

    _validateRequest(ctx, schema = {}) {
        return {
            body       : (schema.body || Joi.any()).validate(ctx.request.body),
            headers    : (schema.headers || Joi.any()).validate(ctx.request.headers),
            params     : (schema.params || Joi.any()).validate(ctx.params),
            queryString: (schema.queryString || Joi.any()).validate(ctx.request.query)
        };
    }

    _validateResponse(ctx, schema = {}) {
        const validationResult = {
            body   : _.get('error.message', (schema.body || Joi.any()).validate(ctx.body)),
            headers: _.get('error.message', (schema.headers || Joi.any()).validate(ctx.headers))
        };

        return reduce((result, value, key) => {
            if (!_.isEmpty(value)) {
                result[key] = value;
            }
            return result;
        }, {})(validationResult);
    }
}

module.exports = RouteValidator;
