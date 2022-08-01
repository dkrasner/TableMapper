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
import LeaderLine from "leader-line";

class WSPort extends HTMLElement {
  constructor() {
    super();

    // The handle is an element we create
    // during drag operations for attaching the
    // leader line
    this.handle = null;
    this.handleRect = null;
    this.handleIsDragging = false;
    this.isPort = true;

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
    this.handleDocumentDragOver = this.handleDocumentDragOver.bind(this);
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }

  connectedCallback() {
    if (this.isConnected) {
      // Initial attributes
      this.setAttribute("draggable", true);

      // Setup event handling
      this.addEventListener("dragstart", this.handleDragStart);
      this.addEventListener("drag", this.handleDrag);
      this.addEventListener("dragend", this.handleDragEnd);
      this.addEventListener("dragenter", this.handleDragEnter);
      this.addEventListener("dragleave", this.handleDragLeave);
      this.addEventListener("drop", this.handleDrop);
      this.addEventListener("dragover", this.handleDragOver);
    }
  }

  disconnectedCallback() {
    this.removeEventListener("dragenter", this.handleDragEnter);
    this.removeEventListener("dragleave", this.handleDragLeave);
    this.removeEventListener("drop", this.handleDrop);
    this.removeEventListener("dragover", this.handleDragOver);
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
    // First, we need to ignore certain drag and drop
    // events on this element itself, so that we prevent
    // the effects of possibly dropping on itself
    this.removeEventListener("dragenter", this.handleDragEnter);
    this.removeEventListener("dragleve", this.handleDragLeave);
    this.removeEventListener("drop", this.handleDrop);

    // Set the dataTransfer object to include the id of
    // this element's parent element.
    let parentEl = this.parentElement || this.host;
    if (parentEl) {
      console.log(`Setting dataTransfer id to ${parentEl.id}`);
      event.dataTransfer.setData("text/plain", parentEl.id);
    }
    event.dataTransfer.effectAllowed = "none";

    // Initialize the visual handle, which will be tracked
    // during move events. The LeaderLine will follow it,
    // constantly updating
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
    document.addEventListener("dragover", this.handleDocumentDragOver);
  }

  handleDragEnd(event) {
    this.leaderLine.remove();
    this.updateHandlePosition(0, 0);
    this.handle.remove();
    document.querySelector(".h-image-drag").remove();
    document.removeEventListener("dragover", this.handleDocumentDragOver);

    // Add the normal drag listeners back to this element.
    this.addEventListener("dragenter", this.handleDragEnter);
    this.addEventListener("dragleve", this.handleDragLeave);
    this.addEventListener("drop", this.handleDrop);
  }

  handleDrag(event) {
    // Nothing for now.
  }

  handleDocumentDragOver(event) {
    this.updateHandlePosition(event.pageX, event.pageY);
    this.leaderLine.position().show();
  }

  handleDragOver(event) {
    event.preventDefault();
  }

  handleDragEnter(event) {
    event.preventDefault(); // Allows this to be a drop target
  }

  handleDragLeave(event) {}

  handleDrop(event) {
    let eventInfo = {};
    let parentEl = this.parentElement || this.host;
    if (parentEl) {
      eventInfo.targetId = parentEl.id;
    } else {
      eventInfo.targetId = undefined;
    }

    eventInfo.sourceId = event.dataTransfer.getData("text/plain");
    this.dispatchEvent(
      new CustomEvent("port-made-connection", {
        detail: eventInfo,
      })
    );

    event.preventDefault();
  }

  initHandleElement() {
    this.handle = document.createElement("div");
    this.handle.classList.add("active-port-handle");
    this.handle.setAttribute("draggable", true);

    /**
     * Temporary styling for testing.
     * Should remove.
     */
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
    this.handle.style.transform = `translate(${x - this.handleRect.x}px, ${
      y - this.handleRect.y
    }px)`;
  }
}

window.customElements.define("ws-port", WSPort);

export { WSPort as default, WSPort };
