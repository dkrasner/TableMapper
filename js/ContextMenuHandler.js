import { CONTEXT_MENU_EL_NAME } from "./ContextMenu.js";

class ContextMenuHandler {
    constructor(worksheet) {
        this.worksheet = worksheet;

        // Bound component methods
        this.tabContextMenu = this.tabContextMenu.bind(this);
        // this.selectionContextMenu = this.selectionContextMenu.bind(this);
        this.worksheetContextMenu = this.worksheetContextMenu.bind(this);
        this.innerSheetContextMenu = this.innerSheetContextMenu.bind(this);
        this.setupListeners = this.setupListeners.bind(this);
        this.removeListeners = this.removeListeners.bind(this);
    }

    setupListeners() {
        let innerSheet = this.worksheet.shadowRoot.getElementById("ap-sheet");
        innerSheet.addEventListener("contextmenu", this.innerSheetContextMenu);
        this.worksheet.addEventListener(
            "contextmenu",
            this.worksheetContextMenu
        );
    }

    removeListeners() {
        let innerSheet = this.worksheet.shadowRoot.getElementById("ap-sheet");
        innerSheet.removeEventListener(
            "contextmenu",
            this.innerSheetContextMenu
        );
        this.worksheet.removeEventListener(
            "contextmenu",
            this.worksheetContextMenu
        );
    }

    innerSheetContextMenu(event) {
        event.preventDefault();
        switch (event.originalTarget.tagName) {
            case "ROW-TAB":
                event.stopPropagation();
                this.tabContextMenu(event, "row");
                break;
            case "COLUMN-TAB":
                event.stopPropagation();
                this.tabContextMenu(event, "column");
                break;
        }
    }

    worksheetContextMenu(event) {
        event.preventDefault();
        console.log("worksheet");
        console.log(event.originalTarget);
        console.log(event);
        event.stopPropagation();
    }

    tabContextMenu(event, axis = "row") {
        const tab = event.originalTarget;
        const innerSheet = this.worksheet.shadowRoot.getElementById("ap-sheet");
        const currentLockedRows =
            parseInt(innerSheet.getAttribute(`locked${axis}s`)) || 0;
        let tabIndexName = "relativeY";
        if (axis === "column") {
            tabIndexName = "relativeX";
        }
        const tabIndex = parseInt(tab.dataset[tabIndexName]) + 1;
        let menuText = `Lock the first ${axis}`;
        if (tabIndex > 1) {
            menuText = `Lock the first ${tabIndex} ${axis}s`;
        }
        let menu = document.createElement(CONTEXT_MENU_EL_NAME);
        menu.addListItem(menuText, (clickEvent) => {
            innerSheet.setAttribute(`locked${axis}s`, tabIndex);
        });
        if (currentLockedRows) {
            menu.addListItem(`Unlock all ${axis}s`, (clickEvent) => {
                innerSheet.setAttribute(`locked${axis}s`, 0);
            });
        }
        menu.openAtMouseEvent(event);
    }
}

export { ContextMenuHandler as default, ContextMenuHandler };
