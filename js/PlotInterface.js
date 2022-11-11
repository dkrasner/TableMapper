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

    #do-it {
        background-color: var(--palette-orange);
        cursor: not-allowed;
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
        <button id="do-it">Plot it</button>
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
        this.onChartButtonClick = this.onChartButtonClick.bind(this);
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
        if (this.currentChart) {
            this.currentChart.update();
        } else{
            const plotter = this.shadowRoot.querySelector("#plot");
            let config;
            if (type == 'bar'){
                const labels = [
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                ];
                const data = {
                    labels: labels,
                    datasets: [{
                        label: this.worksheet.name,
                        data: [65, 59, 80, 81, 56, 55, 40],
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(255, 159, 64, 0.2)',
                            'rgba(255, 205, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(153, 102, 255, 0.2)',
                            'rgba(201, 203, 207, 0.2)'
                        ],
                        borderColor: [
                            'rgb(255, 99, 132)',
                            'rgb(255, 159, 64)',
                            'rgb(255, 205, 86)',
                            'rgb(75, 192, 192)',
                            'rgb(54, 162, 235)',
                            'rgb(153, 102, 255)',
                            'rgb(201, 203, 207)'
                        ],
                        borderWidth: 1
                    }]
                };
                config = {
                    type: 'bar',
                    data: data,
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
            }
            this.currentChart = new Chart(plotter, config);
            this.currentChart.render();
        }
    }

    onChartButtonClick(event){
        // first clear all selected
        this.shadowRoot.querySelectorAll("[data-plot-type]")

        const type = event.target.getAttribute("data-plot-type");
        if (type == "bar") {
            event.target.classList.add("selected");
            this.plot(type);
        } else {
            alert(`${type} plot is not available at the moment`);
        }
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
