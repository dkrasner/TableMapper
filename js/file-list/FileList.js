const fileIcon = `
<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-file" width="100%" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
  <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
</svg>
`;

const folderIcon = `
<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-folder" width="100%" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2" />
</svg>
`;

const caretRight = `
<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-caret-right" width="100%" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M18 15l-6 -6l-6 6h12" transform="rotate(90 12 12)" />
</svg>
`;

const templateString = `
<style>
:host {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    transform: translateX(-100%);
    height: 100%;
    width: 50em;
    max-width: 400px;
    transition: 0.2s ease-in transform;
    z-index: 90;
    background-color: white;
    font-size: 0.8rem;
}

:host(.show){
    transform: translateX(0%);
    transition: 0.2s ease-in transform;
    box-shadow: 10px 0 1px -8px rgba(200, 200, 200, 0.5);
}

#tab {
    --tab-width: 3em;
    --tab-height: 1.5em;
    display: block;
    position: absolute;
    box-sizing: border-box;
    left: calc(100% - 1px);
    top: 4px;
    padding-left: 4px;
    padding-right: 4px;
    height: var(--tab-height);
    border-top-right-radius: 2px;
    border-bottom-right-radius: 2px;
    border: 1px solid rgba(100, 100, 100, 0.8);
    border-left: 1px solid white;
    z-index: 100;
    background-color: white;
}

#tab:hover {
    cursor: pointer;
}

</style>
<div id="tab">Files</div>
<slot></slot>
`;

class FileList extends HTMLElement {
    constructor() {
        super();

        this.template = document.createElement('template');
        this.template.innerHTML = templateString;
        this.attachShadow({mode: 'open'});
        this.shadowRoot.append(
            this.template.content.cloneNode(true)
        );

        // By default, we say the server
        // root is the webdav root.
        this.root = "/";

        // Bind component methods
        this.fetch = this.fetch.bind(this);
        this.toggle = this.toggle.bind(this);
    }

    connectedCallback(){
        if(this.isConnected){
            this.shadowRoot.getElementById('tab').addEventListener('click', this.toggle);
        }
    }

    disconnectedCallback(){
        this.shadowRoot.getElementById('tab').removeEventListener('click', this.toggle);
    }

    attributeChangedCallback(name, oldVal, newVal){
        if(name === 'root' && newVal !== oldVal){
            this.root = newVal;
            this.fetch();
        }
    }

    async fetch(){
        if(!this.client){
            throw new Error('No WebDAV client instance configured for file-list!');
        }
        let childInfo = await this.client.getDirectoryContents(this.root);
        //let currentChildren = Array.from(this.childElements);
        let temp = document.createElement('div');
        temp.append(...this.children);
        childInfo.forEach(item => {
            let nextChild = temp.querySelector(`[etag="${item.etag}"]`);
            if(nextChild){
                // In this case, an element for the
                // file/folder already exists unchanged
                this.append(nextChild);
            } else if(item.type === 'directory'){
                nextChild = document.createElement('folder-reference');
                nextChild.client = this.client;
                this.append(nextChild);
            } else if(item.type === 'file'){
                nextChild = document.createElement('file-reference');
                nextChild.client = this.client;
                this.append(nextChild);
            }
            nextChild.updateFromInfo(item);
        });
    }

    toggle(){
        this.classList.toggle('show');
    }

    static get observedAttributes(){
        return [
            'root'
        ];
    }
};


const fileRefTemplateString = `
<style>
:host {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 10px 14px;
    padding-left: 4px;
    border: 1px solid rgba(100, 100, 100, 0.8);
    border-top: none;
}

:host(:hover){
    cursor: pointer;
}

#content-area {
    display: block;
    flex: 1;
    font-family: inherit;
    font-size: 1.5em;
}

#icon-area {
    display: block;
    width: 2em;
    height: 2em;
    position: relative;
}

#caret-area {
   visibility: hidden;
   width: 2rem;
   height: 2rem;
   position: relative;
}
</style>
<div id="caret-area">${caretRight}</div>
<div id="icon-area">${fileIcon}</div>
<div id="content-area"><span></span></div>`;

class FileReference extends HTMLElement {
    constructor() {
        super();

        this.template = document.createElement('template');
        this.template.innerHTML = fileRefTemplateString;
        this.attachShadow({mode: 'open'});
        this.shadowRoot.append(
            this.template.content.cloneNode(true)
        );

        // Stored properties
        this.fileInfo = {};

        // Bind component methods
        this.updateFromInfo = this.updateFromInfo.bind(this);
    }

    updateFromInfo(aDict){
        this.fileInfo = Object.assign({}, aDict);
        this.shadowRoot.querySelector('#content-area > span').innerHTML = this.fileInfo.basename;
    }
}

const fileDirectoryTemplateString = `
<style>
:host {
    display: block;
}

:host(:hover){
    cursor: pointer;
}

:host([open]) #carat-area {
    transform: rotate(90deg);
    transition: 0.2s linear transform;
}

:host([open]) #sub-area {
    display: block;
}

#wrapper-area {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 10px 14px;
    padding-left: 4px;
    border: 1px solid rgba(100, 100, 100, 0.8);
    border-top: none;
}

#carat-area {
    transform: rotate(0deg);
    transition: 0.2s linear transform;
    width: 2rem;
    height: 2rem;
    position: relative;
}

#icon-area {
    display: block;
    width: 2em;
    height: 2em;
    position: relative;
}

#sub-area {
    display: none;
    padding-left: 2rem;
}

#content-area {
    display: block;
    flex: 1;
    font-family: inherit;
    font-size: 1.5em;
}
</style>
<div id="wrapper-area">
    <div id="carat-area">${caretRight}</div>
    <div id="icon-area">${folderIcon}</div>
    <div id="content-area"><span></span></div>
</div>
<div id="sub-area">
    <slot></slot>
</div>`;

class FolderReference extends FileList {
    constructor() {
        super();

        this.template = document.createElement('template');
        this.template.innerHTML = fileDirectoryTemplateString;
        this.shadowRoot.innerHTML = "";
        this.shadowRoot.append(
            this.template.content.cloneNode(true)
        );

        // Stored properties
        this.fileInfo = {};

        // Bind component methods
        this.fetch = this.fetch.bind(this);
        this.updateFromInfo = this.updateFromInfo.bind(this);
        this.handleFolderClick = this.handleFolderClick.bind(this);
    }

    connectedCallback(){
        if(this.isConnected){
            this.shadowRoot.getElementById('wrapper-area').addEventListener(
                'click',
                this.handleFolderClick
            );
        }
    }

    disconnectedCallback(){
        this.shadowRoot.getElementById('wrapper-area').removeEventListener(
            'click',
            this.handleFolderClick
        );
    }

    handleFolderClick(){
        if(this.hasAttribute('open')){
            this.removeAttribute('open');
        } else {
            this.setAttribute('open', '');
        }
    }

    updateFromInfo(aDict){
        this.fileInfo = Object.assign({}, aDict);
        this.shadowRoot.querySelector('#content-area > span').innerHTML = this.fileInfo.basename;
        this.setAttribute('root', this.fileInfo.filename);
    }
}

window.customElements.define('folder-reference', FolderReference);
window.customElements.define('file-reference', FileReference);
window.customElements.define('file-list', FileList);

export {
    FileList,
    FileList as default
};
