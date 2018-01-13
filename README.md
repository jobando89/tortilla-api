# Tortilla-APi

Tortilla-API is wrapper of restify and swaggerRestify for a quick and easy creation of REST API in node.

## Getting Started

Install dependencies:
```
npm install tortilla-api
```
Use it as a module:

```javascript
const tortilla = require('tortilla-api');

tortilla.create(
    {
        appRoot: __dirname //Look for required files in this directory
    }
);
```

### Prerequisites

Tortilla-API requires a specific folder structure relative to where appRoot is set to be.

#####Folder Structure

+ api
	+ controllers
		+ (all controller files)
	+ swagger
		+ swagger.yaml
+ config (root directory of application)
	+ default.yaml

### Configuration

#####Configuration Documentation
```javascript
tortilla.create(
	{ // App definition
        appRoot, //Start point of where to look for dependencies
		port, //The port to use to listen for requests

    },
    { //Events and restify middleware
        onServerStart, //Called before the server starts

		afterStart, //Called after the server has started

        onTerminate, //Called before the application is terminated

		error, //Event handler when there is an unhandled exception in the application

        middleware: [ //Referrer to Universal handlers for usage of middleware (http://restify.com/docs/home/)
		//Array of functions
		]
    },
    { //Properties and error handling for controller methods
        props: (req, res) => { //Add to the wrapper when used in the controller methods
        },
        errorHandler:(statusCode, message,reply)=>{ //Unhandled exceptions from the controller methods can be taken care of here.
		//By default all errors will return http 500 with the error message of the exception
        }
    }
);
```
### Example
#####Configuration Example

```javascript
const tortilla = require('tortilla-api');

tortilla.create(
	{ // App definition
        appRoot: __dirname,
		port: 8080
    },
    { //Events and restify middleware
        onServerStart: function(context) {
			console.log('Called before the server starts')
		},
		afterStart: function(context) {
			console.log('Called after the server has started')
		},
        onTerminate: function(context) {
			console.log('Called before the application is terminated')
		},
		error: function(err) {
			console.log('unhandled exception in the application')
		},
        middleware: [
			function(req, res, next) {
    			console.warn('run for all routes!');
    			return next();
			}
		]
    },
    { //Properties and error handling for controller methods
        props: function (req, res) {
			const myQueryParam = req.getParam('myQueryParam');
			return {
				myQueryParam
			};
        },
        errorHandler:(statusCode, message,reply)=>{
			if (message.includes('doesn\'t exist')) {
                return reply.notFound(message);
            }
        }
    }
);
```

Controller Method Example

```javascript
const tortilla = require('tortilla-api');
const Wrapper = tortilla.wrapper;

module.exports={
    ControllerExample : Wrapper.wrap(async helper => {
        return helper.res.send(200, 'Hello World');
    })
};
```


## Tests
###Unit Tests

```
npm run test
```
###Code Coverage

```
npm run cover
```

### coding style tests

Explain what these tests test and why

```
npm run lint
```

## Demo

Clone the repo

```
git clone https://github.com/jobando89/tortilla-api
```

Inside the repo folder

```
npm install

npm start
```

Navigate to http://localhost:8080