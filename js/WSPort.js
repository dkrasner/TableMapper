/**
 * WSPort Component
 * -----------------------
 * An element that handles dragging and
 * dropping of connections between sheets
 */

const templateString = `
<style>
:host {
display: block;
background-color: blue;
width: 50px;
height: 50px;
}
</style>
`;

class WSPort extends HTMLElement {
  constructor() {
    super();

    // The handle is an element we create
    // during drag operations for attaching the
    // leader line
    this.handle = null;
    this.handleRect = null;
    this.handleIsDragging = false;

    // The leader-line will follow the handle
    // during drags
    this.leaderLine = null;

    // Bound component methods
    this.initHandleElement = this.initHandleElement.bind(this);
    this.setHandlePosition = this.setHandlePosition.bind(this);
    this.updateHandlePosition = this.updateHandlePosition.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
  }

  connectedCallback() {
    if (this.isConnected) {
      // Initial attributes
      this.setAttribute("draggable", true);

      // Setup event handling
      //this.addEventListener('mouseenter', this.handleMouseEnter);
      //this.addEventListener('mouseleave', this.handleMouseLeave);
      this.addEventListener("dragstart", this.handleDragStart);
      this.addEventListener("drag", this.handleDrag);
      this.addEventListener("dragend", this.handleDragEnd);
    }
  }

  disconnectedCallback() {
    this.removeEventListener("mouseenter", this.handleMouseEnter);
    this.removeEventListener("mouseleave", this.handleMouseLeave);
  }

  handleMouseEnter(event) {
    console.log("enter");
    this.handle = document.createElement("div");
    this.handle.classList.add("active-port-handle");
    this.handle.setAttribute("draggable", true);
    // TEMPORARY -- inline style for live testing
    this.handle.style.display = "block";
    this.handle.style.width = "25px";
    this.handle.style.height = "25px";
    this.handle.style.backgroundColor = "green";
    this.handle.style.position = "absolute";
    this.setHandlePosition();
    //this.handle.addEventListener('dragstart', this.handleDragStart);
    document.body.append(this.handle);
    event.stopPropagation();
    event.preventDefault();
    return false;
  }

  handleMouseLeave(event) {
    console.log("leave");
    this.handle.remove();
    this.handleIsDragging = false;
  }

  handleDragStart(event) {
    this.initHandleElement();
    this.handleRect = this.handle.getBoundingClientRect();
    this.leaderLine = new LeaderLine(this, this.handle, {
      dash: { animation: true },
    });
    this.handleIsDragging = true;
    let hiddenImageEl = document.createElement("div");
    hiddenImageEl.style.position = "absolute";
    hiddenImageEl.classList.add("h-image-drag");
    document.body.append(hiddenImageEl);
    event.dataTransfer.setDragImage(hiddenImageEl, 0, 0);
    console.log("handle did a dragstart!");
    document.addEventListener("dragover", this.handleDragOver);
  }

  handleDragEnd(event) {
    this.leaderLine.remove();
    this.updateHandlePosition(0, 0);
    this.handle.remove();
    document.querySelector(".h-image-drag").remove();
    document.removeEventListener("mousemove", this.handleDragOver);
  }

  handleDrag(event) {
    // Nothing for now.
  }

  handleDragOver(event) {
    this.updateHandlePosition(event.pageX, event.pageY);
    this.leaderLine.position().show();
  }

  handleMouseMove(event) {
    if (this.handleIsDragging) {
      this.updateHandlePosition(event.deltaX, event.deltaY);
      this.leaderLine.position.show();
    }
  }

  initHandleElement() {
    this.handle = document.createElement("div");
    this.handle.classList.add("active-port-handle");
    this.handle.setAttribute("draggable", true);
    // TEMPORARY -- inline style for live testing
    this.handle.style.display = "block";
    this.handle.style.width = "25px";
    this.handle.style.height = "25px";
    this.handle.style.backgroundColor = "green";
    this.handle.style.position = "absolute";
    this.setHandlePosition();
    document.body.append(this.handle);
  }

  setHandlePosition() {
    let rect = this.getBoundingClientRect();
    let y = rect.y + window.pageYOffset;
    let x = rect.x + window.pageXOffset;
    this.handle.style.top = `${y}px`;
    this.handle.style.left = `${x}px`;
  }

  updateHandlePosition(x, y) {
    this.handle.style.transform = `translate(${x - this.handleRect.width}px, ${
      y - this.handleRect.height
    }px)`;
  }
}

window.customElements.define("ws-port", WSPort);

export { WSPort as default, WSPort };
