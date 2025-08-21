// lib/multi-flow/multiflow.js - Enhanced with access to original handlers

import Handler from '../../../lib/pagedjs-src/modules/handler.js';
import { isContainer, isElement } from '../../../lib/pagedjs-src/utils/dom.js';

export class multilang extends Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);

    // Multi-flow configuration
    this.flowLocation = "samepage";
    this.flowSpreadAddWhite = false;
    this.useSyncPositioning = true;
    this.chapterSelector = 'h3';

    // Flow tracking
    this.parallelFlows = [];
    this.flowTracker = [];
    this.parallelImpacts = [];

    // Chapter sync
    this.sectionMap = new Map();
    this.syncPoints = [];
    this.chapterPageMap = new Map();

    // Integration with original footnotes
    this.originalFootnotesHandler = null;
  }

  // Access to original footnotes handler
  findOriginalFootnotesHandler() {
    if (this.chunker && this.chunker.handlers) {
      this.originalFootnotesHandler = this.chunker.handlers.find(handler =>
        handler.constructor.name === 'Footnotes'
      );
    }

    if (this.originalFootnotesHandler) {
      console.log('✅ Found original footnotes handler');
      return true;
    } else {
      console.log('❌ Original footnotes handler not found');
      return false;
    }
  }

  // Enhanced CSS processing
  onDeclaration(declaration, dItem, dList, rule) {
    if (declaration.property == "--parallel-flow") {
      let sel = this.generateSelector(rule.ruleNode.prelude);
      sel = sel.replace('[data-id="', "#");
      sel = sel.replace('"]', "");

      let itemsList = sel.split(",");
      itemsList.forEach((el) => {
        let flow = this.parallelFlows.find((a) => {
          return a.flow == declaration.value.value.trim();
        });

        if (flow) {
          flow.selectors.push({ selector: el, height: 0 });
        } else {
          this.parallelFlows.push({
            flow: declaration.value.value.trim(),
            selectors: [{ selector: el, height: 0 }],
          });
        }
      });
    }

    if (declaration.property == "--parallel-impact") {
      let sel = this.generateSelector(rule.ruleNode.prelude);
      sel = sel.replace('[data-id="', "#");
      sel = sel.replace('"]', "");

      let itemsList = sel.split(",");
      itemsList.forEach((el) => {
        this.parallelImpacts.push(el);
      });
    }
  }

  // Generate CSS selector string
  generateSelector(prelude) {
    // Use CSS tree if available, otherwise simple fallback
    if (typeof csstree !== 'undefined' && csstree.generate) {
      return csstree.generate(prelude);
    }

    // Simple fallback
    return prelude.toString();
  }

  // Enhanced beforeParsed with original footnotes integration
  beforeParsed(content, chunker) {
    // Find original footnotes handler
    this.findOriginalFootnotesHandler();

    // Process parallel impacts
    this.parallelImpacts.forEach((sel) => {
      content.querySelectorAll(sel).forEach((el) => {
        el.classList.add("parallel-impact");
      });
    });

    // Filter valid selectors
    this.parallelFlows.forEach((flow) => {
      flow.selectors = flow.selectors.filter((e) =>
        content.querySelector(e.selector),
      );
    });

    // Create testing zone
    document.body.insertAdjacentHTML(
      "beforeend",
      this.createTestingZone()
    );

    // Process flows and calculate heights
    this.processFlows(content);

    // Clean up testing zone
    document.querySelector("#parallel-removeme")?.remove();
  }

  // Create testing zone HTML
  createTestingZone() {
    return `<div id="parallel-removeme" class="pagedjs_pages">
      <div class="pagedjs_page">
        <div class="pagedjs_sheet">
          <div class="pagedjs_pagebox">
            <div class="pagedjs_area">
              <div class="pagedjs_page_content">
                <div class="testingzone"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  // Process flows and calculate heights
  processFlows(content) {
    this.parallelFlows.forEach((flows, flowsIndex) => {
      let flowName = this.parallelFlows[flowsIndex].flow;

      flows.selectors.forEach((flow, selectorIndex) => {
        let theZone = document.querySelector(".testingzone");
        let testedFlow = content.querySelector(flow.selector)?.cloneNode(true);

        if (!testedFlow) return;

        theZone.appendChild(testedFlow);

        if (selectorIndex === 0) {
          content.querySelector(flow.selector).dataset.flowstart = "start";
        }

        // Add flow markers and data
        const originalElement = content.querySelector(flow.selector);
        originalElement.insertAdjacentHTML("afterbegin", `<span class="flow-start"></span>`);
        originalElement.classList.add(`parallel-obj-${flowName}`);
        originalElement.dataset.height = testedFlow.offsetHeight;
        originalElement.dataset.flowId = `parallel-obj-${flowName}-${selectorIndex}`;
        originalElement.dataset.flowName = flowName;

        flow.height = testedFlow.offsetHeight;
        testedFlow.classList.add(`parallel-obj-${flowName}`);
        testedFlow.dataset.height = testedFlow.offsetHeight;
        testedFlow.dataset.flowId = `parallel-obj-${flowName}-${selectorIndex}`;
        testedFlow.dataset.flowName = flowName;
      });

      // Determine main flow and reorder
      this.reorderFlowElements(content, flowName);
    });
  }

  // Reorder flow elements based on height
  reorderFlowElements(content, flowName) {
    let parallelElements = Array.from(
      document.querySelectorAll(`.parallel-obj-${flowName}`),
    );

    if (parallelElements.length === 0) return;

    let biggestHeightId = parallelElements.reduce(
      (max, el) =>
        parseInt(el.dataset.height) > parseInt(max.dataset.height) ? el : max,
      parallelElements[0],
    ).dataset.flowId;

    const mainElement = content.querySelector(`[data-flow-id="${biggestHeightId}"]`);
    const startElement = content.querySelector(`[data-flowstart]`);

    if (mainElement && startElement) {
      mainElement.dataset.mainObjInFlow = "true";
      startElement.parentNode.insertBefore(mainElement, startElement);
    }

    // Move other elements to end
    parallelElements.forEach((el) => {
      if (el.dataset.flowId !== biggestHeightId) {
        const realElement = content.querySelector(`[data-flow-id="${el.dataset.flowId}"]`);
        if (realElement) {
          content.appendChild(realElement);
        }
      }
    });
  }

  // Page number tracking with finalizePage
  finalizePage(page) {
    const pageNum = page.dataset.pageNumber;

    // Track chapters and their page numbers
    const chapters = page.querySelectorAll(this.chapterSelector);
    chapters.forEach(chapter => {
      const chapterText = chapter.textContent.trim();
      this.chapterPageMap.set(chapter, pageNum);
      console.log(`📄 Chapter "${chapterText}" finalized on page ${pageNum}`);
    });

    // Enhanced footnote handling with original handler
    if (this.originalFootnotesHandler) {
      this.handleFootnotesIntegration(page);
    }
  }

  // Integration with original footnotes handler
  handleFootnotesIntegration(page) {
    // Let original handler process footnotes
    // Then apply multi-flow specific positioning

    const footnoteAreas = page.querySelectorAll('.pagedjs_footnote_area');
    footnoteAreas.forEach(area => {
      // Determine which section this footnote area belongs to
      const section = area.closest('[data-flow-name]');
      if (section) {
        const flowName = section.dataset.flowName;
        area.dataset.footnoteSection = flowName;

        // Apply section-specific styling
        this.applyFootnoteAreaStyling(area, flowName);
      }
    });
  }

  // Apply section-specific footnote styling
  applyFootnoteAreaStyling(area, flowName) {
    if (this.flowLocation === 'samepage') {
      // Position footnote areas for parallel layout
      if (flowName && this.isGuestSection(flowName)) {
        area.style.float = 'left';
        area.style.width = '45%';
        area.style.marginRight = '5%';
      } else {
        area.style.float = 'right';
        area.style.width = '45%';
        area.style.marginLeft = '5%';
      }
    }
  }

  // Check if section is guest (not main flow)
  isGuestSection(flowName) {
    // Implement logic to determine guest vs host sections
    // This should align with your getBiggestHeight logic
    return false; // Placeholder
  }

  // ... rest of existing methods (afterRendered, positioning, etc.) ...

  afterRendered(pages) {
    console.warn("Multi-flow processing complete, integrating with footnotes...");

    // Your existing positioning logic
    this.processParallelFlows(pages);

    // Final footnotes integration
    if (this.originalFootnotesHandler) {
      console.log('🔗 Integrating with original footnotes handler');
      // Additional footnote processing if needed
    }
  }

  // Existing positioning methods...
  processParallelFlows(pages) {
    // Your existing afterRendered logic here
  }
}