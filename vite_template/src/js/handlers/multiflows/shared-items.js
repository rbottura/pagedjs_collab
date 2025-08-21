// lib/multi-flow/shared-items.js - Shared content handler for multi-flow layouts

import Handler from '../../../lib/pagedjs-src/modules/handler.js';

export class SharedItems extends Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);

        // Store reference for multi-flow integration
        window.sharedItemsHandler = this;

        // Storage for shared items
        this.sharedItems = new Map(); // id -> item data
        this.placeholders = new Map(); // placeholder element -> shared item id
        this.processedItems = new Set(); // track which items have been positioned

        // Configuration
        this.enabled = true;
        this.debugMode = false;

        console.log('📦 Shared Items handler initialized');
    }

    // Process shared items before parsing
    beforeParsed(content) {
        if (!this.enabled) return;

        console.log('📦 Processing shared items...');

        // Find all shared items
        this.collectSharedItems(content);

        // Find all placeholders
        this.collectPlaceholders(content);

        // Match placeholders to shared items
        this.matchPlaceholdersToItems();

        console.log(`✅ Found ${this.sharedItems.size} shared items and ${this.placeholders.size} placeholders`);
    }

    // Collect shared items from content
    collectSharedItems(content) {
        const sharedElements = content.querySelectorAll('.shared-item[data-shared-id]');

        sharedElements.forEach((element, index) => {
            const sharedId = element.dataset.sharedId;

            if (this.sharedItems.has(sharedId)) {
                console.warn(`⚠️ Duplicate shared item ID: ${sharedId}`);
                return;
            }

            // Determine which section this shared item belongs to
            const section = element.closest('[data-flow-name], section');
            const flowName = section?.dataset.flowName || 'unknown';

            const itemData = {
                id: sharedId,
                element: element,
                originalSection: flowName,
                content: element.innerHTML,
                processed: false,
                placeholder: null,
                index: index
            };

            this.sharedItems.set(sharedId, itemData);

            console.log(`📌 Collected shared item "${sharedId}" from section "${flowName}"`);

            // Add debug marker if enabled
            if (this.debugMode) {
                this.addDebugMarker(element, 'shared-item', sharedId);
            }
        });
    }

    // Collect placeholders from content
    collectPlaceholders(content) {
        const placeholderElements = content.querySelectorAll('.shared-placeholder[data-shared-ref]');

        placeholderElements.forEach((element, index) => {
            const sharedRef = element.dataset.sharedRef;

            // Determine which section this placeholder belongs to
            const section = element.closest('[data-flow-name], section');
            const flowName = section?.dataset.flowName || 'unknown';

            const placeholderData = {
                element: element,
                sharedRef: sharedRef,
                section: flowName,
                index: index
            };

            this.placeholders.set(element, placeholderData);

            console.log(`🔗 Found placeholder for "${sharedRef}" in section "${flowName}"`);

            // Add debug marker if enabled
            if (this.debugMode) {
                this.addDebugMarker(element, 'placeholder', sharedRef);
            }
        });
    }

    // Match placeholders to their corresponding shared items
    matchPlaceholdersToItems() {
        this.placeholders.forEach((placeholderData, placeholderElement) => {
            const sharedItem = this.sharedItems.get(placeholderData.sharedRef);

            if (sharedItem) {
                sharedItem.placeholder = placeholderData;
                placeholderData.sharedItem = sharedItem;

                console.log(`🔗 Matched placeholder in "${placeholderData.section}" to shared item "${sharedItem.id}"`);
            } else {
                console.warn(`⚠️ No shared item found for placeholder "${placeholderData.sharedRef}"`);
            }
        });
    }

    // Process shared items during rendering
    renderNode(node) {
        if (!this.enabled || node.nodeType !== 1) return;

        // Check if this node contains placeholders
        const placeholders = node.querySelectorAll('.shared-placeholder[data-shared-ref]');

        placeholders.forEach(placeholder => {
            this.processPlaceholder(placeholder);
        });
    }

    // Process a single placeholder
    processPlaceholder(placeholderElement) {
        const placeholderData = this.placeholders.get(placeholderElement);

        if (!placeholderData || !placeholderData.sharedItem) {
            return;
        }

        const sharedItem = placeholderData.sharedItem;

        if (sharedItem.processed) {
            // Item already processed, just remove placeholder
            placeholderElement.remove();
            return;
        }

        console.log(`📦 Processing shared item "${sharedItem.id}" for placeholder in "${placeholderData.section}"`);

        // Position the shared item
        this.positionSharedItem(sharedItem, placeholderElement);

        // Mark as processed
        sharedItem.processed = true;
        this.processedItems.add(sharedItem.id);

        // Remove placeholder
        placeholderElement.remove();
    }

    // Position shared item spanning sections
    positionSharedItem(sharedItem, placeholderElement) {
        const page = placeholderElement.closest('.pagedjs_page');
        if (!page) {
            console.warn(`⚠️ No page found for shared item "${sharedItem.id}"`);
            return;
        }

        // Find both sections on this page
        const sections = page.querySelectorAll('[data-flow-name]');
        const leftSection = Array.from(sections).find(s => this.isLeftSection(s));
        const rightSection = Array.from(sections).find(s => this.isRightSection(s));

        if (!leftSection || !rightSection) {
            console.warn(`⚠️ Could not find both sections for shared item "${sharedItem.id}"`);
            return;
        }

        // Calculate positioning
        const positioning = this.calculateSharedItemPosition(leftSection, rightSection, placeholderElement);

        // Clone the shared item element
        const sharedElement = sharedItem.element.cloneNode(true);
        sharedElement.classList.add('shared-item-positioned');
        sharedElement.dataset.originalId = sharedItem.id;

        // Apply positioning
        Object.assign(sharedElement.style, {
            position: 'absolute',
            left: `${positioning.left}px`,
            top: `${positioning.top}px`,
            width: `${positioning.width}px`,
            zIndex: '10',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #ddd',
            padding: '1em',
            margin: '0.5em 0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        });

        // Insert into page
        const pageContent = page.querySelector('.pagedjs_page_content');
        if (pageContent) {
            pageContent.appendChild(sharedElement);
        }

        // Remove original shared item from flow
        sharedItem.element.remove();

        console.log(`✅ Positioned shared item "${sharedItem.id}" spanning both sections`);
    }

    // Calculate position for shared item
    calculateSharedItemPosition(leftSection, rightSection, placeholderElement) {
        const leftRect = leftSection.getBoundingClientRect();
        const rightRect = rightSection.getBoundingClientRect();
        const placeholderRect = placeholderElement.getBoundingClientRect();
        const pageRect = leftSection.closest('.pagedjs_page_content').getBoundingClientRect();

        return {
            left: Math.min(leftRect.left, rightRect.left) - pageRect.left,
            top: placeholderRect.top - pageRect.top,
            width: Math.max(leftRect.right, rightRect.right) - Math.min(leftRect.left, rightRect.left)
        };
    }

    // Determine if section is on the left (guest section)
    isLeftSection(section) {
        // This should align with your multi-flow logic
        return section.classList.contains('c') ||
            section.classList.contains('guest') ||
            section.dataset.flowType === 'guest';
    }

    // Determine if section is on the right (host section)
    isRightSection(section) {
        // This should align with your multi-flow logic
        return section.classList.contains('a') ||
            section.classList.contains('host') ||
            section.dataset.flowType === 'host';
    }

    // Add debug markers
    addDebugMarker(element, type, id) {
        const marker = document.createElement('div');
        marker.className = `debug-shared-marker debug-${type}`;
        marker.innerHTML = `
      <span class="debug-type">${type.toUpperCase()}</span>
      <span class="debug-id">${id}</span>
    `;

        element.style.position = 'relative';
        element.appendChild(marker);
    }

    // Clean up unprocessed shared items
    afterRendered(pages) {
        if (!this.enabled) return;

        console.log('📦 Cleaning up shared items...');

        // Remove any unprocessed shared items
        this.sharedItems.forEach((item, id) => {
            if (!item.processed && item.element.parentNode) {
                console.log(`🗑️ Removing unprocessed shared item "${id}"`);
                item.element.remove();
            }
        });

        // Remove any remaining placeholders
        this.placeholders.forEach((data, element) => {
            if (element.parentNode) {
                console.log(`🗑️ Removing unmatched placeholder "${data.sharedRef}"`);
                element.remove();
            }
        });

        console.log(`✅ Shared items processing complete: ${this.processedItems.size} items positioned`);
    }

    // Configuration methods
    enable() {
        this.enabled = true;
        console.log('📦 Shared items enabled');
    }

    disable() {
        this.enabled = false;
        console.log('📦 Shared items disabled');
    }

    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`📦 Shared items debug mode: ${enabled}`);
    }

    // Get shared item by ID
    getSharedItem(id) {
        return this.sharedItems.get(id);
    }

    // Get all shared items
    getAllSharedItems() {
        return Array.from(this.sharedItems.values());
    }

    // Check if item was processed
    isProcessed(id) {
        return this.processedItems.has(id);
    }
}

export default SharedItems;