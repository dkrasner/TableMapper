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
        this.updateLinkedSheet(this.getAttribute("target"), "");
        // remove all the leaderlines
        this.leaderLines.forEach((line) => {
            line.start.removeTarget(line.end.id);
            line.end.removeSource(line.start.id);
            line.remove();
        });
    }

    updateLeaderLine() {
        this.leaderLines.forEach((line, index) => {
            // when we remove the lines tell the corresponding worksheets to
            // remove the link icons
            line.start.removeTarget(line.end.id);
            line.end.removeSource(line.start.id);
            line.remove();
        });
        this.leaderLines = [];
        // update the leader line for each source
        let sources = this.getAttribute("sources");
        if(!sources){
            return;
        }
        sources = sources.split(",");
        // for now we remove all the lines and put them back as needed
        sources.forEach((id) => {
            const sourceElement = document.getElementById(id);
            const destElement = document.getElementById(this.getAttribute("target"));
            if (sourceElement && destElement) {
                console.log("Creating new leader-line between:");
                console.log(sourceElement, destElement);
                this.leaderLines.push(new LeaderLine(sourceElement, destElement));
                console.log(`Telling ${sourceElement.id} to add target`);
                sourceElement.addTarget(destElement.id, destElement.name);
                console.log(`Telling ${destElement.id} to add source`);
                destElement.addSource(sourceElement.id, sourceElement.name);
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
        if (!areEqual) {
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
            this.updateLinkedSheet(oldVal, newVal);
            // if there are no sources nor target then remove the connection
            if(newVal === ""){
                this.remove();
            }
        }
    }

    static get observedAttributes() {
        return ["sources", "target"];
    }
}

window.customElements.define("ws-connection", WSConnection);

export { WSConnection as default };
