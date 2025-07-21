// import fonts and css for print btn
import "./src/css/style.css";

// css for print view linked to cover, content and back MD files
import "./src/css/cover.css";
import "./src/css/content.css";
import "./src/css/back.css";

import "highlight.js/styles/intellij-light.css";

import cover from "./src/md/cover.md?raw";
import content from "./src/md/content.md?raw";
import back from "./src/md/back.md?raw"

import markdownit from "markdown-it";
import markdownitContainer from "markdown-it-container";
import markdownItAttrs from "markdown-it-attrs";


import { paginate } from "./src/js/paginate.js";

import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import markdown from 'highlight.js/lib/languages/markdown';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('html', html);
hljs.registerLanguage('css', css);
hljs.registerLanguage('md', markdown);

let elementsToPaginate = [];

//markdown files to load
const mdFilesList = [cover, content, back];
//html elements to be filled from converted md file
const partsList = ["cover", "content", "back"];

//markdownit instanciation (old school method as no ES6 modules are available)
const md = markdownit
    ({
        // Options for markdownit
        "langPrefix": 'language-en',
        // You can use html markup element
        "html": true,
        "typographer": true,
        // Replace english quotation by french quotation
        "quotes": ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'],
        "highlight": function (code, lang) {
             console.log("code", code,"lang", lang);
             console.log(hljs.getLanguage(lang));
            if (lang && hljs.getLanguage(lang)) {
                try {
                    const highlightedCode = hljs.highlight(code, { language: lang, ignoreIllegals: true });
                    //console.log(highlightedCode);
                    var preTag = `<pre class="hljs" lang="${lang}"><code>${highlightedCode.value}</code></pre>`;

                    return preTag;
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
    })
    .use(markdownitContainer) //div
    .use(markdownItAttrs, { //custom html element attributes
        // optional, these are default options
        leftDelimiter: '{',
        rightDelimiter: '}',
        allowedAttributes: [] // empty array = all attributes are allowed
    });

//function to produce the HTML from md files
async function layoutHTML() {

    //!important! forEach can't be used as it doesn't respect await order!
    for (let index = 0; index < mdFilesList.length; index++) {
        const mdContent = mdFilesList[index];
        //convertion from md to html, returns a string
        const result = md.render(mdContent);

        const destinationElement = document.getElementById(partsList[index]);
        destinationElement.innerHTML = result;
        elementsToPaginate.push(destinationElement.cloneNode(true));
    };
}

//wait to have all the element loaded (module scripts can't be defered)
window.addEventListener("load", async (event) => {
    // await 
    await layoutHTML();
});

//interaction
const printBt = document.querySelector('#printBt');

printBt.addEventListener("click", () => {
    // console.log(ele)
    paginate(elementsToPaginate);
});
