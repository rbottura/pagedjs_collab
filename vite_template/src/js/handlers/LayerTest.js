import { Handler } from 'pagedjs';

export class LayerTest extends Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
        this.layers = [];
    }

    afterRendered(pages) {
        const page = document.querySelectorAll(".pagedjs_page");
        // console.log(pages, page.length)
    }

    beforeParsed(content) {
        //console.log(content);
    }

    afterPageLayout(pageElement, page, breakToken) {
        // console.log(/* "pageElement", pageElement, */ "page", page, /* "breakToken", breakToken */);

        let allChildrenArray = this.getAllChildren(pageElement);
        const layers = allChildrenArray.filter((element) => element.className.includes("layer"));

        if (layers.length > 0) {

            // console.log("pageElement", pageElement);
            layers[0].style.opacity = 0;

            //const pagedjs_sheet = pageElement;
            const pageClone = this.clonePage(page);
            pageClone.style.position = "relative";
            pageClone.style.top = "calc(var(--pagedjs-height)* -1)";
            pageClone.style.opacity = 1;

            this.layers.push(pageClone);
            // console.log("layersClone", this.layers);

            pageElement.appendChild(pageClone);

            let allCloneChildrenArray = this.getAllChildren(pageClone);
            const layersClone = allCloneChildrenArray.filter((element) => element.className.includes("layer"));

            const layerClone = layersClone[0];
            layerClone.style.opacity = 1;

            const layerChildren = this.getAllChildren(layerClone);
            if(layerChildren.length > 0){
                layerChildren.forEach( (child) =>{
                    child.style.opacity = 1;
                });
            }

            const cloneParents = this.getAllParents(layerClone);
            // console.log(cloneParents);
            let content = null;

            cloneParents.forEach((element) => {
                element.style.opacity = 1;
                if (element.className === "pagedjs_page_content") {
                    content = element;
                }
            });
        }
    }

    clonePage(page) {

        const pageBoxClone = page.pagebox.cloneNode(true);
        const children = this.getAllChildren(pageBoxClone);

        //hide all
        children.forEach((element) => {
            element.style.opacity = 0;
        });

        return pageBoxClone;
    }

    getAllParents(element) {
        const parents = [];
        let parent = element.parentElement;

        while (parent) {
            parents.push(parent);
            parent = parent.parentElement;
        }

        return parents;
    }

    getAllChildren(element) {
        let children = [];
        let child = element.firstElementChild;

        while (child) {
            children.push(child);
            if (child.firstElementChild) {
                children = children.concat(this.getAllChildren(child));
            }
            child = child.nextElementSibling;
        }

        return children;
    }
}

/*
// Previewer
beforePreview(content, renderTo)
afterPreview(pages)

// Chunker
beforeParsed(content)
filter(content)
afterParsed(parsed)
beforePageLayout(page)
onPageLayout(pageWrapper, breakToken, layout);
afterPageLayout(pageElement, page, breakToken)
finalizePage(pageElement, page, breakToken)

// Polisher
beforeTreeParse(text, sheet)
beforeTreeWalk(ast)
afterTreeWalk(ast, sheet)
onUrl(urlNode)
onAtPage(atPageNode)
onRule(ruleNode)
onDeclaration(declarationNode, ruleNode)
onContent(contentNode, declarationNode, ruleNode)

// Layout
layoutNode(node)
renderNode(node, sourceNode, layout)
onOverflow(overflow, rendered, bounds)
onBreakToken(breakToken, overflow, rendered)
afterOverflowRemoved(removed, rendered)
beforeRenderResult(breakToken, pageWrapper)
*/
