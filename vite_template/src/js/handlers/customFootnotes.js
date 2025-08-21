// CUSTOM FOOTNOTES HANDLER - Since pagedjs footnotes module isn't available

import { Handler } from 'pagedjs';

export class CustomFootnotes extends Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);

        // Store reference for multi-flow integration
        window.customFootnotesHandler = this;

        this.footnoteCounter = 1;
        this.footnotesBySection = new Map();
        this.allFootnotes = [];
    }

    // Process footnotes in beforeParsed (before layout)
    beforeParsed(content) {
        console.log('📝 Processing custom footnotes...');

        // Find all footnote elements
        const footnotes = content.querySelectorAll('.footnotes, [data-footnote]');

        footnotes.forEach(footnote => {
            this.processFootnote(footnote);
        });

        console.log(`✅ Processed ${footnotes.length} footnotes`);
    }

    processFootnote(footnoteElement) {
        // Generate unique reference
        const ref = `footnote-${this.footnoteCounter}`;
        const number = this.footnoteCounter++;

        // Create footnote call (superscript)
        const call = document.createElement('sup');
        call.textContent = number;
        call.className = 'footnote-call';
        call.dataset.footnoteCall = ref;
        call.dataset.ref = ref;

        // Add link to footnote
        const link = document.createElement('a');
        link.href = `#${ref}`;
        link.textContent = number;
        link.style.textDecoration = 'none';
        call.appendChild(link);

        // Insert call before footnote
        footnoteElement.parentNode.insertBefore(call, footnoteElement);

        // Determine which section this footnote belongs to
        const section = footnoteElement.closest('[data-flow-name]');
        const sectionName = section?.dataset.flowName || 'unknown';

        // Create footnote data
        const footnoteData = {
            ref: ref,
            number: number,
            content: footnoteElement.innerHTML,
            originalElement: footnoteElement,
            call: call,
            section: sectionName,
            isHost: this.isHostSection(section)
        };

        // Store in collections
        this.allFootnotes.push(footnoteData);

        if (!this.footnotesBySection.has(sectionName)) {
            this.footnotesBySection.set(sectionName, []);
        }
        this.footnotesBySection.get(sectionName).push(footnoteData);

        // Remove original footnote element from flow
        footnoteElement.remove();

        console.log(`📌 Created footnote ${number} for section "${sectionName}": ${footnoteData.content.substring(0, 50)}...`);
    }

    // Determine if section is host (integrate with your multi-flow logic)
    isHostSection(section) {
        if (!section) return false;

        // This should match your multi-flow logic for determining host
        // For now, simple heuristic
        return section.classList.contains('host') ||
            section.dataset.flowType === 'host';
    }

    // Collect footnotes by host/guest for end-of-document placement
    getFootnotesByType() {
        const hostFootnotes = [];
        const guestFootnotes = [];
        const unknownFootnotes = [];

        this.allFootnotes.forEach(footnote => {
            if (footnote.isHost) {
                hostFootnotes.push(footnote);
            } else if (footnote.section !== 'unknown') {
                guestFootnotes.push(footnote);
            } else {
                unknownFootnotes.push(footnote);
            }
        });

        return {
            host: hostFootnotes,
            guest: guestFootnotes,
            unknown: unknownFootnotes
        };
    }

    // Generate end-of-document footnotes section
    generateFootnotesSection() {
        if (this.allFootnotes.length === 0) {
            console.log('📝 No footnotes to generate');
            return;
        }

        console.log('📚 Generating footnotes section...');

        const footnotesByType = this.getFootnotesByType();

        // Create footnotes page
        const footnotesPage = this.createFootnotesPage();

        let html = '<div class="footnotes-content">';
        html += '<h2>References & Notes</h2>';

        // Guest section footnotes first
        if (footnotesByType.guest.length > 0) {
            html += '<div class="footnotes-section footnotes-guest">';
            html += '<h3>Guest Section</h3>';
            html += this.renderFootnotesList(footnotesByType.guest);
            html += '</div>';
        }

        // Host section footnotes
        if (footnotesByType.host.length > 0) {
            html += '<div class="footnotes-section footnotes-host">';
            html += '<h3>Host Section</h3>';
            html += this.renderFootnotesList(footnotesByType.host);
            html += '</div>';
        }

        // Unknown footnotes
        if (footnotesByType.unknown.length > 0) {
            html += '<div class="footnotes-section footnotes-other">';
            html += '<h3>Other References</h3>';
            html += this.renderFootnotesList(footnotesByType.unknown);
            html += '</div>';
        }

        html += '</div>';

        // Insert into footnotes page
        const pageContent = footnotesPage.querySelector('.pagedjs_page_content div');
        pageContent.innerHTML = html;

        // Add to document
        const pagedContainer = document.querySelector('.pagedjs_pages');
        if (pagedContainer) {
            pagedContainer.appendChild(footnotesPage);
        } else {
            document.body.appendChild(footnotesPage);
        }

        console.log(`✅ Generated footnotes page with ${this.allFootnotes.length} footnotes`);
    }

    // Create a properly structured footnotes page
    createFootnotesPage() {
        const page = document.createElement('div');
        page.className = 'pagedjs_page';
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

    // Render footnotes list HTML
    renderFootnotesList(footnotes) {
        let html = '<ol class="footnotes-list">';

        footnotes.forEach(footnote => {
            html += `
        <li id="${footnote.ref}" data-ref="${footnote.ref}">
          <div class="footnote-content">
            ${footnote.content}
          </div>
        </li>
      `;
        });

        html += '</ol>';
        return html;
    }

    // Method for multi-flow integration
    integrateWithMultiFlow(hostSectionSelector, guestSectionSelector) {
        console.log('🔗 Integrating footnotes with multi-flow...');

        // Update section identification based on multi-flow selectors
        this.allFootnotes.forEach(footnote => {
            const element = footnote.call.closest(hostSectionSelector);
            if (element) {
                footnote.isHost = true;
                footnote.section = 'host';
            } else {
                footnote.isHost = false;
                footnote.section = 'guest';
            }
        });

        // Rebuild section collections
        this.footnotesBySection.clear();
        this.allFootnotes.forEach(footnote => {
            if (!this.footnotesBySection.has(footnote.section)) {
                this.footnotesBySection.set(footnote.section, []);
            }
            this.footnotesBySection.get(footnote.section).push(footnote);
        });

        console.log(`📊 Updated footnotes: ${this.footnotesBySection.get('host')?.length || 0} host, ${this.footnotesBySection.get('guest')?.length || 0} guest`);
    }
}