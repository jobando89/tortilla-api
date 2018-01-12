module.exports = {
    env: {
        commonjs: true,
        es6: true,
        node: true
    },
    extends: 'eslint:recommended',
    rules: {
        'max-len': ['error', 150, 4],
        indent: ['error', 4, { SwitchCase: 1 }],
        'linebreak-style': ['error', 'unix'],
        quotes: ['error', 'single'],
        semi: ['error', 'always']
    },
    parserOptions: {
        ecmaVersion: '2017',
        ecmaFeatures:{
            experimentalObjectRestSpread: true
        }
    }
};
