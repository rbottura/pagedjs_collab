import "../css/paged-preview.css";
import "../css/pagedjs-interface.css";


import { Previewer, registerHandlers } from 'pagedjs';
// import { Skeleton } from "./handlers/Skeleton.js";
import { HighlightAreas } from "./handlers/HighlightAreas.js";
import { LayerTest } from "./handlers/LayerTest.js";
import { multilang } from "./handlers/multi-flows.js";

//instanciate a Previewer to use,
//Previewer {settings: {…}, polisher: Polisher, chunker: Chunker, hooks: {…}, size: {…}}
const paged = new Previewer();
//register a handler to define hooks on a specific method it defines
registerHandlers(LayerTest);
registerHandlers(multilang);

const documentFragment = document.createDocumentFragment();

//pagination intitation method
export async function paginate(elementsList, styleList) {

    //!important! forEach can't be used as it doesn't respect await order!
    for (let index = 0; index < elementsList.length; index++) {
        const element = elementsList[index];
        //populate document fragment
        documentFragment.appendChild(element);
    };

    //merge styles together
    //const styles = [previewStyle];// styleList.concat(styleList, ["../css/paged-preview.css", "../css/pagedjs-interface.css"]);
    //console.log(styles);

    //clear the current body out
    document.body.innerHTML = "";

    //execute pagedjs preview
    
    await import("../css/multiflow.css");
    await import("../css/interface.css");
    
    await paged.preview(documentFragment, null, document.body);
}
