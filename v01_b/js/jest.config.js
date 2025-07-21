// jest.config.js
module.exports = {
    // Environnement de test
    testEnvironment: 'jsdom',

    // Pattern pour trouver les tests
    testMatch: [
        '**/__tests__/**/*.js',
        '**/*.test.js'
    ],

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/test-setup.js'],

    // Coverage
    collectCoverageFrom: [
        '**/*.js',
        '!**/node_modules/**',
        '!**/coverage/**',
        '!jest.config.js',
        '!test-setup.js'
    ],

    // Transformer les modules ES6
    transform: {
        '^.+\\.js$': 'babel-jest'
    },

    // Mock les modules globaux
    globals: {
        'Paged': {},
        'csstree': {}
    }
};