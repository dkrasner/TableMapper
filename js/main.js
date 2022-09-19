/* Main */
import { Worksheet } from "./Worksheet.js";
import CommandInterface from "./CommandInterface.js";
import WSConnection from "./WSConnection.js";
import WSPort from "./WSPort.js";
import LeaderLine from "leader-line";
import { WorksheetError, ErrorDisplay } from "./ErrorHandling.js";

// Add a global error handler for custom WorksheetError
// related errors
document.addEventListener("error", ErrorDisplay.listener);

// For testing
window.throwTestError = function () {
    throw new WorksheetError("Test error!");
};

export {
    Worksheet,
    WorksheetError,
    CommandInterface,
    WSConnection,
    WSPort,
    LeaderLine,
    Worksheet as default,
};
