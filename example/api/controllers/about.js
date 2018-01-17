const Wrapper = require('../../../src/wrapper');
const packageJson = require (`${tortillaApi}/package.json`);

module.exports={
    get : Wrapper.wrap(async helper => {
        return helper.res.send(200, {
            Version:packageJson.version,
            App: packageJson.name
        });
    })
};