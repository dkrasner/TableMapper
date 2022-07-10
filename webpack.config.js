import path from 'path';
import * as url from 'url';
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

let config = {
    entry: './js/main.js',
    output: {
        path: path.resolve(__dirname, 'dist/'),
        filename: 'worksheet.bundle.js'
    },
    mode: 'development'
};

export { config as default };
