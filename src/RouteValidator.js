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
            if (!_.isEmpty(requestValidationResult)) {
                return ctx.throw(400, JSON.stringify({ validationResults: requestValidationResult }));
            }

            await next();

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
        };
    }

    _validateRequest(ctx, requestSchema = {}) {
        const validationResult = {
            body       : this._validate(ctx.request.body, requestSchema.body || Joi.any()),
            headers    : this._validate(ctx.request.headers, requestSchema.headers || Joi.any()),
            params     : this._validate(ctx.params, requestSchema.params || Joi.any()),
            queryString: this._validate(ctx.request.query, requestSchema.queryString || Joi.any())
        };

        return this._parseResponse(validationResult);
    }

    _validateResponse(ctx, responseSchema = {}) {
        const validationResult = {
            body   : this._validate(ctx.body, responseSchema.body || Joi.any()),
            headers: this._validate(ctx.headers, responseSchema.headers || Joi.any()),
        };

        return this._parseResponse(validationResult);
    }

    _parseResponse(validationResult) {
        const response = reduce((result, value, key) => {
            if (!_.isEmpty(value)) {
                result[key] = value;
            }
            return result;
        }, {})(validationResult);

        return response;
    }

    _validate(data, schema) {
        return _.get('error.message', Joi.validate(data, schema));
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