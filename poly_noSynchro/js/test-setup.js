// test-setup.js
import { JSDOM } from 'jsdom';

// Configuration JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
});

// Expose DOM globals
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;

// Mock PagedJS
global.Paged = {
    Handler: class {
        constructor(chunker, polisher, caller) {
            this.chunker = chunker;
            this.polisher = polisher;
            this.caller = caller;
        }
    },
    registerHandlers: jest.fn()
};

// Mock csstree
global.csstree = {
    generate: jest.fn(rule => '.test-selector')
};

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0
}));

// Mock offset properties
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    get: function () { return 100; }
});

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    get: function () { return 200; }
});

Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
    get: function () { return 0; }
});

Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
    get: function () { return 0; }
});