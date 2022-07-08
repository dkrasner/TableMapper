/** Preload file for setting up JSDom for tests **/
import jsdom from 'jsdom';
import {Crypto} from '@peculiar/webcrypto'; // Mock for browser API
import ResizeObserver from 'resize-observer-polyfill'; // Mock for browser API

global.window = new jsdom.JSDOM().window;
global.document = window.document;
global.HTMLElement = window.HTMLElement;
global.crypto = new Crypto();
global.DOMParser = window.DOMParser;
global.ResizeObserver = ResizeObserver;
global.CustomEvent = window.CustomEvent;

Object.defineProperty(global.window, 'crypto', {
    value: global.crypto
});
Object.defineProperty(global.window, 'ResizeObserver', {
    value: ResizeObserver
});
