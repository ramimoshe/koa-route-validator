'use strict';

const EventEmitter = require('events');
const Joi          = require('joi');
const _            = require('lodash/fp');

const reduce = _.reduce.convert({ 'cap': false });


class RouteValidator extends EventEmitter {
    create(validationObject) {
        const inputValidationResult = Joi.validate(validationObject, this._inputSchema);
        if (inputValidationResult.error) {
            throw new Error(inputValidationResult.error.message);
        }

        return async (ctx, next) => {
            const requestValidationResult = this._validateRequest(ctx, validationObject.requestSchema);
            if (this._hasError(requestValidationResult)) {
                return ctx.throw(400, JSON.stringify({ validationResults: this._extractErrors(requestValidationResult) }));
            }

            ctx.state.rv = this._getJoiValues(requestValidationResult);

            await next();

            if (ctx.response.status === 200) {
                const responseValidationResult = this._validateResponse(ctx, validationObject.responseSchema);
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

    _validateRequest(ctx, requestSchema = {}) {
        return {
            body       : Joi.validate(ctx.request.body, requestSchema.body || Joi.any()),
            headers    : Joi.validate(ctx.request.headers, requestSchema.headers || Joi.any()),
            params     : Joi.validate(ctx.params, requestSchema.params || Joi.any()),
            queryString: Joi.validate(ctx.request.query, requestSchema.queryString || Joi.any())
        };
    }

    _validateResponse(ctx, responseSchema = {}) {
        const validationResult = {
            body   : this._validate(ctx.body, responseSchema.body || Joi.any()),
            headers: this._validate(ctx.headers, responseSchema.headers || Joi.any()),
        };

        return this._parseResponse(validationResult);
    }

    get _inputSchema() {
        return Joi.object({
            requestSchema : Joi.object({
                body       : Joi.object().keys({ isJoi: true }).unknown(),
                headers    : Joi.object().keys({ isJoi: true }).unknown(),
                params     : Joi.object().keys({ isJoi: true }).unknown(),
                queryString: Joi.object().keys({ isJoi: true }).unknown()
            }).optional(),
            responseSchema: Joi.object({
                body   : Joi.object().keys({ isJoi: true }).unknown(),
                headers: Joi.object().keys({ isJoi: true }).unknown()
            }).optional()
        });
    }
}

module.exports = RouteValidator;