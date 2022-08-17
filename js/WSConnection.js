/**
 * WSConnection Component
 * -------------------------------------------
 * Custom Element describing connections between worksheets
 */
import LeaderLine from "leader-line";

class WSConnection extends HTMLElement {
    constructor() {
        super();

        this.leaderLines = [];

        // Bound component methods
        this.updateLeaderLine = this.updateLeaderLine.bind(this);
        this.updateLinkedSheet = this.updateLinkedSheet.bind(this);
        this.onWorksheetMoved = this.onWorksheetMoved.bind(this);
    }

    connectedCallback() {
        if (this.isConnected) {
            this.updateLinkedSheet("", this.getAttribute("sources"));
            this.updateLinkedSheet("", this.getAttribute("target"));
        }
    }

    disconnectedCallback() {
        this.updateLinkedSheet(this.getAttribute("sources"), "");
        this.updateLinkedSheet(this.getAttribute("target"));
    }

    updateLeaderLine() {
        // update the leader line for each source
        let sources = this.getAttribute("sources");
        if(!sources){
            return;
        }
        sources = sources.split(",");
        // for now we remove all the lines and put them back as needed
        this.leaderLines.forEach((line, index) => {
            line.remove();
            this.leaderLines.pop(index);
        });
        sources.forEach((id) => {
            const sourceElement = document.getElementById(id);
            const destElement = document.getElementById(this.getAttribute("target"));
            if (sourceElement && destElement) {
                console.log("Creating new leader-line between:");
                console.log(sourceElement, destElement);
                this.leaderLines.push(new LeaderLine(sourceElement, destElement));
            }
        })
    }

    updateLinkedSheet(oldVal, newVal) {
        console.log("updateLinkedSheet called!");
        console.log(`old: ${oldVal} new: ${newVal}`);
        if(oldVal){
            oldVal = oldVal.split(',');
        } else {
            oldVal = [];
        }
        if(newVal){
            newVal = newVal.split(',');
        } else {
            newVal = [];
        }
        // check if the arrays are equal
        const temp = oldVal.filter((item) => {return newVal.indexOf(item) > -1});
        const areEqual = temp.length == oldVal.length && temp.length == newVal.length;
        if (this.isConnected && !areEqual) {
            console.log("updating linked sheet", oldVal, newVal);
            oldVal.forEach((id) => {
                const oldLinkedEl = document.getElementById(id);
                if (oldLinkedEl) {
                    oldLinkedEl.removeEventListener(
                        "worksheet-moved",
                        this.onWorksheetMoved
                    );
                }
            });
            newVal.forEach((id) => {
                const newLinkedEl = document.getElementById(id);
                if (newLinkedEl) {
                    newLinkedEl.addEventListener(
                        "worksheet-moved",
                        this.onWorksheetMoved
                    );
                }
            });
        }
    }

    onWorksheetMoved(event) {
        // When the worksheet moves, we need to redraw the leaderLine
        console.log("worksheet moved in connection element");
        const lines = this.leaderLines.filter((l) => {
            return l.start.id == event.detail.id || l.end.id == event.detail.id;
        });
        lines.forEach((l) => {l.position().show()});
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === "sources" || name === "target") {
            this.updateLeaderLine();
        }
        if (name === "sources") {
            this.updateLinkedSheet(oldVal, newVal);
        }
        if (name === "target") {
            this.updateLinkedSheet(oldVal, newVal);
        }
    }

    static get observedAttributes() {
        return ["sources", "target"];
    }
}

window.customElements.define("ws-connection", WSConnection);

export { WSConnection as default };
