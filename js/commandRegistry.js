/**  TableMapper Command Registry
  * ---------------------------
  * A registry of all available commands in the
  * TableMapper ecosystems.
  */

const commandRegistry = {
    "copy" : _onCopyCommand,
}

/* the commands */
function _onCopyCommand(source, target, arg){
    console.log(`going to copy ${source} to ${target}`);
    const sourceSheet = document.getElementById("source");
    const targetSheet = document.getElementById("target");
    const [sourceOrigin, sourceCorner] = source.split(":");
    const [sourceOriginX, sourceOriginY] = parseCoordinates(sourceOrigin);
    const [sourceCornerX, sourceCornerY] = parseCoordinates(sourceCorner);
    const [targetOriginX, targetOriginY] = parseCoordinates(target);
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
            if(arg){
                value = eval(`'${value}'.${arg}`);
            }
            targetSheet.dataFrame.putAt([targetX, targetY], value);
            currentY += 1;
            targetY += 1;
        }
        currentX += 1;
        currentY = sourceOriginY;
        targetX += 1;
        targetY = targetOriginY;
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
