/* Various utility functions and helpers */

/**
 * I create a span element with svg element child from a svg string
 */
const createIconSVGFromString = function(iconString){
    const parser = new DOMParser();
    return parser.parseFromString(iconString, "image/svg+xml").documentElement; 
}

export {
    createIconSVGFromString,
    createIconSVGFromString as default
}
