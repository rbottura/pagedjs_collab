// lib/custom-pagedjs.js - Your custom Paged.js build

// Import core Paged.js components
import { Previewer } from './pagedjs-src/polisher/base.js';
import { Chunker } from './pagedjs-src/chunker/chunker.js';
import { Polisher } from './pagedjs-src/polisher/polisher.js';

// Import original handlers you want to keep
import Breaks from './pagedjs-src/modules/paged-media/breaks.js';
import PrintMedia from './pagedjs-src/modules/paged-media/print-media.js';
import PageCounters from './pagedjs-src/modules/paged-media/counters.js';
import Lists from './pagedjs-src/modules/paged-media/lists.js';
import PositionFixed from './pagedjs-src/modules/paged-media/position-fixed.js';
import PagedMedia from './pagedjs-src/modules/paged-media/print-media.js';
// import RunningHeaders from './pagedjs-src/modules/paged-media/running-headers.js';
// import StringSets from './pagedjs-src/modules/paged-media/string-sets.js';

// Import the ORIGINAL footnotes handler (now accessible!)
import Footnotes from './pagedjs-src/modules/paged-media/footnotes.js';

// Import your custom handlers
import { multilang } from '../js/handlers/multiflows/multi-flows.js';
import { SharedItems } from '../js/handlers/multiflows/shared-items.js';
import { MultiFlowFootnotes } from '../js/handlers/multiflows/multi-footnotes.js';

// Create custom Paged.js class
export class CustomPagedJS extends Previewer {
    constructor() {
        super();

        // Register core handlers
        this.registerHandlers(
            Breaks,
            PrintMedia,
            PageCounters,
            Lists,
            PositionFixed,
            PagedMedia,
            RunningHeaders,
            StringSets,
            Footnotes,          // Original footnotes handler

            // Your custom handlers
            SharedItems,        // Handle shared content
            MultiFlowFootnotes, // Extend footnotes for multi-flows
            multilang           // Multi-flows layout (last)
        );

        console.log('🎉 Custom Paged.js with Multi-Flows initialized');
    }

    // Add convenience methods for multi-flows
    setFlowMode(mode) {
        const multiFlowHandler = this.getHandler('MultiLang');
        if (multiFlowHandler) {
            multiFlowHandler.flowLocation = mode; // "samepage" or "samespread"
        }
        return this;
    }

    setFootnoteMode(mode) {
        const footnoteHandler = this.getHandler('MultiFlowFootnotes');
        if (footnoteHandler) {
            footnoteHandler.setMode(mode); // "margin" or "end-document"
        }
        return this;
    }

    enableSyncPositioning(enabled = true) {
        const multiFlowHandler = this.getHandler('MultiLang');
        if (multiFlowHandler) {
            multiFlowHandler.useSyncPositioning = enabled;
        }
        return this;
    }

    // Helper to get handler by class name
    getHandler(handlerName) {
        return this.chunker?.handlers?.find(h =>
            h.constructor.name === handlerName
        );
    }

    // Preset configurations
    configureParallelLayout() {
        return this
            .setFlowMode('samepage')
            .setFootnoteMode('margin')
            .enableSyncPositioning(true);
    }

    configureSpreadLayout() {
        return this
            .setFlowMode('samespread')
            .setFootnoteMode('end-document')
            .enableSyncPositioning(false);
    }
}

// Export for easy use
export { multilang, SharedItems, MultiFlowFootnotes };

// Also create a simple factory function
export function createMultiFlowPaged(config = {}) {
    const paged = new CustomPagedJS();

    // Apply configuration
    if (config.layout === 'parallel') {
        paged.configureParallelLayout();
    } else if (config.layout === 'spread') {
        paged.configureSpreadLayout();
    }

    return paged;
}