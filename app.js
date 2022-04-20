// import {GridSheet} from "https://raw.githubusercontent.com/darth-cheney/ap-sheet/blob/master/src/GridSheet.js";

document.addEventListener('DOMContentLoaded', () => {
    console.log("test");
    let span = document.createElement("span");
    span.innerText = "OKOK";

    // <my-grid class="spreadsheet" id="table" rows="12" columns="3" expands="true"></my-grid>
    let div = document.querySelector('div');
    div.append(span);
});

