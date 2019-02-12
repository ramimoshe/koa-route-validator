## koa-route-validator
koa-route middleware that validate request/response for each route using Joi

### install
```bash
npm i koa-route-validator
```

### How to use
#### Using koa-route-validator
```js
const RouteValidator = require('koa-route-validator');
const rv = new RouteValidator();
rv.on('warn', console.warn);
rv.create({/* options */}); // returns koa-router middleware
```

#### Example of using koa-route-validator with koa-router
```js
const RouteValidator = require('koa-route-validator');

const koaRouter = new KoaRouter();
const rv = new RouteValidator();
rv.on('warn', console.warn);
koaRouter.get('/:id', rv.create({
    request: {
        params: Joi.object({})
    }
}), async (ctx) => {
    // route handler
});
```

### Options
```json
{
    "request" : {
        "body"       : {},
        "headers"    : {},
        "params"     : {},
        "queryString": {}
    },
    "response":{ 
        "body"   : {},
        "headers": {}
    }
}
```
* request: optional
  * body: optional - Joi schema for body
  * headers: optional - Joi schema for headers
  * params: optional - Joi schema for params
  * queryString: optional - Joi schema for queryString
* response: optional
  * body: optional - Joi schema for body
  * headers: optional - Joi schema for headers
  

License
----

MIT
