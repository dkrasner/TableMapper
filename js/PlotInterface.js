/**
 * PlotInterface Component
 * -------------------------------------------
 * Custom Element allowing for the selection and configuraiton of commands
 */
import icons from "./utils/icons.js";
import createIconSVGFromString from "./utils/helpers.js";

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);


const templateString = `
<style>
    :host {
        display: flex;
        flex-direction: column;
        position: absolute;
        z-index: 10000;
        background-color: var(--palette-lightblue);
        border: solid var(--palette-orange) 1.5px;
        border-radius: 5px;
        left: 50%;
        top: 30%;
        resize: both;
        overflow: hidden;
        width: 500px;
        height: 400px;
    }

    div.wrapper {
        margin: 8px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100% !important;
    }

    #header {
        cursor: grab;
        text-align: center;
        font-weight: bold;
        display: flex;
        justify-content: space-around;
        align-items: center;
        margin-top: 7px;
        margin-bottom: 7px;
    }

    #footer {
        margin: 8px;
        margin-bottom: 0px;
        cursor: grab;
        text-align: center;
        font-size: 20px;
        font-weight: bold;
        display: flex;
        justify-content: space-around;
        align-items: center;
    }

    #save {
        margin-left: 2px;
    }

    span[data-clickable="true"]{
        cursor: pointer;
        width: 20px;
        height: 20px;
    }

    svg {
        width: 20px;
        height: 20px;
        pointer-events: none;
    }

    button {
        margin-right: 1px;
        margin-left: 1px;
    }

    #close {
        cursor: pointer;
        position: absolute;
        right: 0px;
        top: 0px;
    }

    #plot-it {
        background-color: var(--palette-orange);
    }

    #save-it {
        background-color: var(--palette-cyan);
    }

    .unlock {
        background-color: var(--palette-beige) !important;
        cursor: default !important;
    }

    #plot-wrapper {
        height: 100%!important;
        width: 100!important;
        resizable: true;
        background-color: var(--palette-white);
    }

    #plot {
        height: 100%!important;
        resizable: true;
        background-color: var(--palette-white);
    }

    .selected {
        outline: 1px solid var(--palette-orange);
    }
</style>
<div class="wrapper">
    <div id="header"></div>
    <div id="plot-wrapper">
        <canvas id="plot"></canvas>
    </div>
    <div id="footer">
        <button id="plot-it">Plot it</button>
        <button id="save-it">Save It</button>
    </div>
</div>
`;

class PlotInterface extends HTMLElement {
    constructor(worksheet) {
        super();
        this.worksheet = worksheet;
        this.currentChart = null;

        // Setup template and shadow root
        const template = document.createElement("template");
        template.innerHTML = templateString;
        this._shadowRoot = this.attachShadow({ mode: "open" });
        this._shadowRoot.appendChild(template.content.cloneNode(true));

        // Bound component methods
        this.addChartButton = this.addChartButton.bind(this);
        this.plot = this.plot.bind(this);
        this.getDataSelection = this.getDataSelection.bind(this);
        this.onChartButtonClick = this.onChartButtonClick.bind(this);
        this.onPlotButtonClick = this.onPlotButtonClick.bind(this);
        this.onMouseDownInHeaderFooter = this.onMouseDownInHeaderFooter.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUpAfterDrag = this.onMouseUpAfterDrag.bind(this);
        this.onClose = this.onClose.bind(this);
    }

    connectedCallback() {
        if (this.isConnected) {
            const header = this.shadowRoot.querySelector("#header");
            const footer = this.shadowRoot.querySelector("#footer");
            const wrapper = this.shadowRoot.querySelector(".wrapper");
            // event listeners
            header.addEventListener("mousedown", this.onMouseDownInHeaderFooter);
            footer.addEventListener("mousedown", this.onMouseDownInHeaderFooter);
            // add the plot button callback; TODO this is temp
            // since we'll want it more responsive
            const plotButton = this.shadowRoot.querySelector("button#plot-it");
            plotButton.addEventListener("click", this.onPlotButtonClick);
            // add a close button
            const svg = createIconSVGFromString(icons.circleX);
            svg.style.setProperty("width", "15px");
            svg.style.setProperty("height", "15px");
            const button = document.createElement("span");
            button.id = "close";
            button.appendChild(svg);
            button.addEventListener("click", this.onClose);
            wrapper.appendChild(button);
            // add the charts
            ["line", "bar", "pie"].forEach((name) => {
                const button = this.addChartButton(name);
                header.append(button);
                if (name == 'bar') {
                    // add a basic plot so there is something to see
                    button.classList.add("selected");
                    this.plot('bar');
                }
            })
        }
    }

    disconnectedCallback() {
        const header = this.shadowRoot.querySelector("#header");
        const footer = this.shadowRoot.querySelector("#footer");
        header.removeEventListener("mousedown", this.onMouseDownInHeaderFooter);
        footer.removeEventListener("mousedown", this.onMouseDownInHeaderFooter);
    }

    addChartButton(name){
        const svg = createIconSVGFromString(icons[`${name}Chart`]);
        const button = document.createElement("span");
        button.appendChild(svg);
        button.addEventListener("click", this.onChartButtonClick);
        button.setAttribute("title", `${name} plot`);
        button.setAttribute("data-clickable", true);
        button.setAttribute("data-plot-type", name);
        return button;
    }

    plot(type){
        // get the selected data
        // TODO atm we only consider columns
        const data = this.getDataSelection();
        console.log(data)
        if (this.currentChart) {
            this.currentChart.destroy();
        }
        const plotter = this.shadowRoot.querySelector("#plot");
        const labels = [];
        for (let i=0; i < data.length; i++){
            labels.push(i);
        }
        const plotData = {
            labels: labels,
            datasets: [{
                label: this.worksheet.name,
                data: data,
                borderWidth: 1
            }]
        };
        const config = {
            type: 'line',
            data: plotData,
            responsive: true,
            maintainAspectRatio: false,
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            },
        };
        this.currentChart = new Chart(plotter, config);
        this.currentChart.render();
    }

    getDataSelection(){
        const selectionFrame = this.worksheet.sheet.selector.selectionFrame;
        const data =  selectionFrame.mapEachPointRow((r) => {
            // TODO we are assuming columns here!!!
            let val = this.worksheet.sheet.dataFrame.getAt(r[0])
            val = parseFloat(val);
            return val;
        });
        return data;
    }

    onChartButtonClick(event){
        // first clear all selected
        this.shadowRoot.querySelectorAll("[data-plot-type]").forEach((e) => {
            e.classList.remove("selected");
        });

        const type = event.target.getAttribute("data-plot-type");
        if (type == "bar") {
            event.target.classList.add("selected");
            this.plot(type);
        } else {
            alert(`${type} plot is not available at the moment`);
        }
    }

    onPlotButtonClick(event){
        const type = this.shadowRoot.querySelector(
            "[data-plot-type]").getAttribute("data-plot-type");
        this.plot(type);
    }

    onClose(){
        this.remove();
    }

    onMouseDownInHeaderFooter(event) {
        // drag event propagation can be touchy so make sure we are not clicking or dragging
        // any children of header/footer
        if (
            event.target.id == "footer" ||
                event.target.id == "header"
        ) {
            document.addEventListener("mousemove", this.onMouseMove);
            document.addEventListener("mouseup", this.onMouseUpAfterDrag);
        }
    }

    onMouseUpAfterDrag() {
        document.removeEventListener("mouseup", this.onMouseUpAfterDrag);
        document.removeEventListener("mousemove", this.onMouseMove);
    }

    onMouseMove(event) {
        const currentLeft = this.getBoundingClientRect().left;
        const currentTop = this.getBoundingClientRect().top;
        const newTop = currentTop + event.movementY;
        const newLeft = currentLeft + event.movementX;
        this.style.setProperty("top", newTop + "px");
        this.style.setProperty("left", newLeft + "px");
    }

    attributeChangedCallback(name, oldVal, newVal) {
    }

    static get observedAttributes() {
        return [];
    }
}

window.customElements.define("plot-interface", PlotInterface);


export { PlotInterface as default };
