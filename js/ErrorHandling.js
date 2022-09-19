import { icons } from "./utils/icons.js";

class WorksheetError extends Error {
    constructor(message, ...args) {
        super(message, ...args);
        this.name = "WorksheetError";
    }
}

class ErrorDisplay extends Object {
    constructor(err, canDismiss, timing) {
        this.error = err;
        this.canDismiss = canDismiss || false;
        this.timing = timing || 2000;

        // Bound instance methods
        this.show = this.show.bind(this);
        this.hideErrorDisplay = this.hideErrorDisplay.bind(this);
        this._buildElement = this._buildElement.bind(this);
    }

    show() {
        const displayContainer = this._buildElement();
        document.body.append(displayContainer);
        displayContainer.classList.add("error-show");
        if (!this.canDismiss) {
            setTimeout(() => {
                this.hideErrorDisplay(displayContainer);
            }, this.timing);
        }
    }

    hideErrorDisplay(anElement) {
        anElement.remove();
    }

    _buildElement() {
        const container = document.createElement("div");
        container.id = "error-display";
        container.classList.add("error-container");
        const icon = document.createElement("span");
        icon.classList.add("icon");
        icon.innerHTML = icons.alert;
        const label = document.createElement("p");
        label.classList.add("error-message");
        label.textContent = this.error.message;
        container.append(icon, label);
        return container;
    }

    static listener(err) {
        if (err instanceof WorksheetError) {
            const errorDisplay = new ErrorDisplay(err);
            errorDisplay.show();
        } else {
            throw err;
        }
    }
}

export { WorksheetError, ErrorDisplay };
