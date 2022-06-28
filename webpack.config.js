const path = require('path');

module.exports = {
    entry: './js/webdav-client.js',
    output: {
        path: path.resolve(__dirname),
        filename: 'webdav.bundle.js'
    },
    mode: 'development'
};
