/**  TableMapper Command Registry
  * ---------------------------
  * A registry of all available commands in the
  * TableMapper ecosystems.
  */

const commandRegistry = {
    default: _onDefault,
    replace: _onReplace
}

/* the commands */


/* The copy function take a pre-copy/preprocessing function
   argument which is run on the values before they are copied
   */
function _copy(source, target, preProcessFunc){
    console.log(`going to copy ${source} to ${target}`);
    const [sourceSheetId, sourceCoords] = source.split("!");
    // TODO: we should get some higher level ways for worksheet to interact with the underlying my-grid
    const sourceSheet = document.getElementById(sourceSheetId).shadowRoot.querySelector("my-grid");
    const [targetSheetId, targetCoords] = target.split("!");
    const targetSheet = document.getElementById(targetSheetId).shadowRoot.querySelector("my-grid");
    const [sourceOrigin, sourceCorner] = sourceCoords.split(":");
    const [sourceOriginX, sourceOriginY] = parseCoordinates(sourceOrigin);
    const [sourceCornerX, sourceCornerY] = parseCoordinates(sourceCorner);
    const [targetOriginX, targetOriginY] = parseCoordinates(targetCoords);
    // iterate over the coordinates and fill in target sheet data values
    let currentX = sourceOriginX;
    let currentY = sourceOriginY;
    let targetX = targetOriginX;
    let targetY = targetOriginY;
    while (currentX <= sourceCornerX){
        while(currentY <= sourceCornerY){
            let value = sourceSheet.dataFrame.getAt([currentX, currentY]);
            // the presence of an arg tell us that we should apply it to the string
            // in the JS way
            if(preProcessFunc){
                // value = eval(`'${value}'.${arg}`);
                value = preProcessFunc(value);
            }
            targetSheet.dataFrame.putAt([targetX, targetY], value, false);
            currentY += 1;
            targetY += 1;
        }
        currentX += 1;
        currentY = sourceOriginY;
        targetX += 1;
        targetY = targetOriginY;
    }
    targetSheet.render();
}

/* a string.replace() like function which takes
   a dictionary of values (passed in as a string
   "key1:value2; key2;value2"); later on it will take
   a reference to another sheet containing the k-v's
   */
function _onReplace(source, target, dict){
    // split into key:val's
    dict = dict.split(";");
    _copy(source, target, (item) => {
        dict.forEach((kv) => {
            // split the key and value and clean up
            let [k, v] = kv.split(":");
            k = k.trim();
            v= v.trim();
            const regex = new RegExp(k);
            // if we match return the new value
            // NOTE: the convention here is that the last match
            // returns and previous are effectively ignored
            if(regex.test(item)){
                item = item.replace(regex, v);
            }
        })
        return item;
    })
}

function _onDefault(source, target, func){
    if(func){
        // TODO: this is insanely dangerous
        _copy(source, target, (value) => {
            return eval(`'${value}'.${func}`)
        })
    } else {
        _copy(source, target)
    }
}

/* utilities */
/*
  I parse a coordinate in the form "(A,B)"
  and return a [a,b] int list.
*/
function parseCoordinates(coordinates){
    let [x, y] = coordinates.replace(/[()]/g,"").split(",");
    x = parseInt(x);
    y = parseInt(y);
    return [x, y];
}

export {
    commandRegistry,
    commandRegistry as default
}
