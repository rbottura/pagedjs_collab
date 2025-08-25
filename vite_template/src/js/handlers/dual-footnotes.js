// DUAL FOOTNOTES SYSTEM - Supports both margin bottom and end-of-document

import { Handler } from 'pagedjs';

export class DualFootnotes extends Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);

        // Store reference for multi-flow integration
        window.dualFootnotesHandler = this;

        // Configuration
        this.footnoteMode = null; // 'margin' or 'end-document'
        this.sectionFootnotes = true; // Separate footnote areas per section

        // Storage
        this.footnoteCounter = 1;
        this.footnotesBySection = new Map();
        this.needsLayout = [];

        // Track which sections need footnote areas
        this.footnoteSections = new Set(['section.c', 'section.a', '.chapter.c', '.chapter.a']);
    }

    // Configure footnote mode
    setMode(mode, options = {}) {
        this.footnoteMode = mode; // 'margin' or 'end-document'
        this.sectionFootnotes = options.sectionFootnotes !== false;
        console.log(`📝 Footnotes mode set to: ${mode}`);
    }

    // Process footnotes in beforeParsed
    beforeParsed(content) {
        console.log(`📝 Processing footnotes in ${this.footnoteMode} mode...`);

        // Find all footnote elements
        const footnotes = content.querySelectorAll('.footnotes, [data-footnote]');

        footnotes.forEach(footnote => {
            this.processFootnote(footnote, content);
        });

        if (this.footnoteMode === 'margin') {
            // Create footnote areas for each section
            this.createSectionFootnoteAreas(content);
        }

        console.log(`✅ Processed ${footnotes.length} footnotes`);
    }

    processFootnote(footnoteElement, content) {
        // Generate unique reference
        const ref = `footnote-${this.footnoteCounter}`;
        const number = this.footnoteCounter++;

        // Determine which section this footnote belongs to
        const section = footnoteElement.closest('[data-flow-name], section');
        const sectionSelector = this.getSectionSelector(section);
        const sectionName = section?.dataset.flowName || sectionSelector || 'unknown';

        // Create footnote call (superscript)
        const call = this.createFootnoteCall(footnoteElement, ref, number);

        // Create footnote data
        const footnoteData = {
            ref: ref,
            number: number,
            content: footnoteElement.innerHTML,
            originalElement: footnoteElement,
            call: call,
            section: sectionName,
            sectionSelector: sectionSelector,
            element: this.createFootnoteElement(footnoteElement, ref, number)
        };

        // Store in collections
        if (!this.footnotesBySection.has(sectionName)) {
            this.footnotesBySection.set(sectionName, []);
        }
        this.footnotesBySection.get(sectionName).push(footnoteData);

        // Remove original footnote element from flow
        footnoteElement.remove();

        console.log(`📌 Created footnote ${number} for section "${sectionName}"`);
    }

    // Create footnote call (adapted from original footnotes.js)
    createFootnoteCall(footnoteElement, ref, number) {
        const parentElement = footnoteElement.parentElement;
        const footnoteCall = document.createElement('a');

        // Copy classes from original footnote
        for (const className of footnoteElement.classList) {
            footnoteCall.classList.add(`${className}`);
        }

        footnoteCall.classList.add('footnote-call');
        footnoteCall.dataset.footnoteCall = ref;
        footnoteCall.dataset.ref = ref;
        footnoteCall.textContent = number;

        // Add link
        footnoteCall.href = `#note-${ref}`;

        // Insert before original footnote
        parentElement.insertBefore(footnoteCall, footnoteElement);

        return footnoteCall;
    }

    // Create footnote element (adapted from original footnotes.js)
    createFootnoteElement(originalElement, ref, number) {
        const footnoteElement = document.createElement('div');
        footnoteElement.className = 'footnote-item';
        footnoteElement.dataset.note = 'footnote';
        footnoteElement.dataset.ref = ref;
        footnoteElement.dataset.footnoteMarker = ref;
        footnoteElement.id = `note-${ref}`;
        footnoteElement.innerHTML = originalElement.innerHTML;

        return footnoteElement;
    }

    // Get section selector for CSS targeting
    getSectionSelector(section) {
        if (!section) return null;

        // Build selector from classes
        if (section.classList.length > 0) {
            return '.' + Array.from(section.classList).join('.');
        }

        // Fallback to tag name
        return section.tagName.toLowerCase();
    }

    // Create footnote areas for sections (margin mode)
    createSectionFootnoteAreas(content) {
        if (this.footnoteMode !== 'margin') return;

        console.log('🏗️ Creating section footnote areas...');

        this.footnoteSections.forEach(sectionSelector => {
            const sections = content.querySelectorAll(sectionSelector);

            sections.forEach(section => {
                // Create footnote area for this section
                const footnoteArea = this.createFootnoteArea(sectionSelector);
                section.appendChild(footnoteArea);

                console.log(`📦 Created footnote area for ${sectionSelector}`);
            });
        });
    }

    // Create footnote area structure (adapted from original)
    createFootnoteArea(sectionSelector) {
        const footnoteArea = document.createElement('div');
        footnoteArea.className = `pagedjs_footnote_area pagedjs_footnote_area_${sectionSelector.replace(/[^a-zA-Z0-9]/g, '_')}`;

        const footnoteContent = document.createElement('div');
        footnoteContent.className = 'pagedjs_footnote_content pagedjs_footnote_empty';

        const footnoteInnerContent = document.createElement('div');
        footnoteInnerContent.className = 'pagedjs_footnote_inner_content';

        footnoteContent.appendChild(footnoteInnerContent);
        footnoteArea.appendChild(footnoteContent);

        return footnoteArea;
    }

    // Handle footnote rendering (adapted from original)
    renderNode(node) {
        if (this.footnoteMode !== 'margin') return;

        if (node.nodeType == 1 && node.dataset) {
            // Find footnote calls in this node
            const footnoteCalls = node.querySelectorAll('[data-footnote-call]');

            footnoteCalls.forEach(call => {
                this.moveFootnoteToMargin(call, node);
            });
        }
    }

    // Move footnote to section margin (adapted from original)
    moveFootnoteToMargin(footnoteCall, node) {
        const ref = footnoteCall.dataset.ref;
        const sectionName = footnoteCall.closest('[data-flow-name], section')?.dataset.flowName || 'unknown';
        const footnoteData = this.findFootnote(ref, sectionName);

        if (!footnoteData) {
            console.log(`⚠️ Footnote ${ref} not found for section ${sectionName}`);
            return;
        }

        // Find the appropriate footnote area for this section
        const section = footnoteCall.closest('[data-flow-name], section');
        const footnoteArea = section?.querySelector('.pagedjs_footnote_area');

        if (!footnoteArea) {
            console.log(`⚠️ No footnote area found for section`);
            return;
        }

        const footnoteContent = footnoteArea.querySelector('.pagedjs_footnote_content');
        const footnoteInnerContent = footnoteArea.querySelector('.pagedjs_footnote_inner_content');

        // Check if footnote already exists (for overflow)
        const existing = footnoteInnerContent.querySelector(`[data-ref="${ref}"]`);
        if (existing) {
            return;
        }

        // Add the footnote
        footnoteInnerContent.appendChild(footnoteData.element);

        // Remove empty class
        if (footnoteContent.classList.contains('pagedjs_footnote_empty')) {
            footnoteContent.classList.remove('pagedjs_footnote_empty');
        }

        console.log(`📝 Moved footnote ${ref} to section margin`);
    }

    // Find footnote by ref and section
    findFootnote(ref, sectionName) {
        const sectionFootnotes = this.footnotesBySection.get(sectionName) || [];
        return sectionFootnotes.find(f => f.ref === ref);
    }

    // Handle end-of-document footnotes
    generateEndDocumentFootnotes() {
        if (this.footnoteMode !== 'end-document') return;

        console.log('📚 Generating end-of-document footnotes...');

        // Create footnotes page
        const footnotesPage = this.createFootnotesPage();

        let html = '<div class="footnotes-content">';
        html += '<h2>References & Notes</h2>';

        // Add footnotes by section
        this.footnotesBySection.forEach((footnotes, sectionName) => {
            if (footnotes.length > 0) {
                html += `<div class="footnotes-section footnotes-${sectionName}">`;
                html += `<h3>Section: ${sectionName}</h3>`;
                html += '<ol class="footnotes-list">';

                footnotes.forEach(footnote => {
                    html += `<li id="${footnote.ref}">${footnote.content}</li>`;
                });

                html += '</ol></div>';
            }
        });

        html += '</div>';

        // Insert into page
        const pageContent = footnotesPage.querySelector('.pagedjs_page_content div');
        pageContent.innerHTML = html;

        // Add to document
        const pagedContainer = document.querySelector('.pagedjs_pages');
        if (pagedContainer) {
            pagedContainer.appendChild(footnotesPage);
        }

        console.log('✅ Generated end-of-document footnotes');
    }

    // Create footnotes page
    createFootnotesPage() {
        const page = document.createElement('div');
        page.className = 'pagedjs_page footnotes-page';
        page.style.breakBefore = 'page';

        page.innerHTML = `
      <div class="pagedjs_sheet">
        <div class="pagedjs_pagebox">
          <div class="pagedjs_area">
            <div class="pagedjs_page_content">
              <div></div>
            </div>
          </div>
        </div>
      </div>
    `;

        return page;
    }

    // Integration method for multi-flow
    integrateWithMultiFlow(mode = 'margin') {
        this.setMode(mode);

        if (mode === 'end-document') {
            this.generateEndDocumentFootnotes();
        }
    }
}