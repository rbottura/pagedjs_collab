import { Handler } from 'pagedjs';

export class HighlightAreas extends Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
    }

    afterRendered(pages) {
        const page = document.querySelectorAll(".pagedjs_page");
        console.log(pages, page.length)

        let marginsNodes = []
        let pNodes = []

        const listClassMargins = ['.pagedjs_margin-top', '.pagedjs_margin-right', '.pagedjs_margin-bottom', '.pagedjs_margin-left']
        pages.forEach(page => {

            // Fill principales margins with a background Image
            page.pagebox.querySelectorAll([...listClassMargins]).forEach(mrg => {
                marginsNodes.push(mrg)
                mrg.style.backgroundImage = 'url("./css/custom/bck_mrg.png")'
                mrg.style.backgroundSize = '10px'
                mrg.style.opacity = '.5'
                mrg.style.border = 'dashed red 1px'
            })

            // Make paragraph 
            page.area.querySelectorAll('p').forEach(para => {
                pNodes.push(para)
                para.contentEditable = true;
            })
        })
        
        // hide any highlights before browser's pdf render
        window.onbeforeprint = () => {
            console.log(marginsNodes)
            marginsNodes.forEach(mrg => {
                mrg.style.backgroundImage = 'none'
                mrg.style.opacity = '1'
                mrg.style.border = 'none'
            })
        };
    }

    beforeParsed(content) {
        //console.log(content);
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
