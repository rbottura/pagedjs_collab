// import fonts and css for print btn
import "./src/css/style.css";

// css for print view linked to cover, content and back MD files
import "./src/css/cover.css";
import "./src/css/content.css";
import "./src/css/back.css";

import "highlight.js/styles/intellij-light.css";

import cover from "./src/md/cover.md?raw";
import content_fr from "./src/md/cramer_FR.md?raw";
import content_en from "./src/md/cramer_EN.md?raw";
import content_it from "./src/md/cramer_IT.md?raw";
import content_de from "./src/md/cramer_DE.md?raw";
import notes_fr from "./src/md/cramer_FR_notes.md?raw";
import notes_en from "./src/md/cramer_EN_notes.md?raw";
import back from "./src/md/back.md?raw"

import markdownit from "markdown-it";
import markdownitContainer from "markdown-it-container";
import markdownItAttrs from "markdown-it-attrs";
import markdownItFootnote from "markdown-it-footnote";

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
// const mdFilesList = [cover, content_fr, content_en, back];
// const mdFilesList = [cover, content_fr, content_en, content_it, back];
const mdFilesList = [cover, content_fr, content_en, content_it, content_de, back];

//html elements to be filled from converted md file
// const partsList = ["cover", "content_fr", "content_en", "back"];
// const partsList = ["cover", "content_fr", "content_en", 'content_it', "back"];
const partsList = ["cover", "content_fr", "content_en", 'content_it', 'content_de', "back"];

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
            console.log("code", code, "lang", lang);
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
    .use(markdownItFootnote) //div
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
        console.log(destinationElement)
        destinationElement.innerHTML = result;
        elementsToPaginate.push(destinationElement.cloneNode(true));
    };
}

//wait to have all the element loaded (module scripts can't be defered)
window.addEventListener("load", async (event) => {
    // await 
    await layoutHTML();
});

document.addEventListener('DOMContentLoaded', function () {
    // Initialize web view
    enableWebView();

    // Set up print button functionality
    const printBt = document.getElementById('printBt');
    if (printBt) {
        printBt.addEventListener('click', function () {
            
            // Switch to print mode (remove web styling)
            disableWebView();

            paginate(elementsToPaginate);
        });
    }
});

function enableWebView() {
    // Add web-publication-view class to body
    document.body.classList.add('web-publication-view');

    // Wrap chapters in container if not already done
    const chapters = document.querySelectorAll('.chapter');
    const existingContainer = document.querySelector('.chapters-container');

    if (chapters.length > 0 && !existingContainer) {
        // Create container
        const container = document.createElement('div');
        container.className = 'chapters-container';

        // Insert container before the first chapter
        const firstChapter = chapters[0];
        firstChapter.parentNode.insertBefore(container, firstChapter);

        // Move all chapters into the container
        chapters.forEach(chapter => {
            container.appendChild(chapter);
        });
    }
}

function disableWebView() {
    // Remove web-publication-view class from body
    document.body.classList.remove('web-publication-view');

    // Optional: Unwrap chapters from container for print layout
    const container = document.querySelector('.chapters-container');
    if (container) {
        const chapters = container.querySelectorAll('.chapter');
        const parent = container.parentNode;

        // Move chapters back to parent, after the container
        chapters.forEach(chapter => {
            parent.insertBefore(chapter, container.nextSibling);
        });

        // Remove the empty container
        container.remove();
    }
}

// Optional: Add a function to switch back to web view
function switchToWebView() {
    enableWebView();
}

// Optional: Add a function to switch to print view
function switchToPrintView() {
    disableWebView();
}

// Expose functions globally if needed
window.switchToWebView = switchToWebView;
window.switchToPrintView = switchToPrintView;