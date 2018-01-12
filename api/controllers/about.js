const Wrapper = require('../../src/wrapper');


module.exports={
    get : Wrapper.wrap(async helper => {
        return helper.res.send(200, {
            Version:'0.0.1',
            App: 'Tortilla API'
        });
    })
};