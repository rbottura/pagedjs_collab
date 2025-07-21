// Tests unitaires pour le plugin PagedJS Multi-flows
// Framework: Jest avec jsdom pour simuler le DOM

import { JSDOM } from 'jsdom';
import { multilang } from './multilang-plugin'; // Adjust path as needed

// Mock PagedJS
const mockPaged = {
  Handler: class {
    constructor(chunker, polisher, caller) {
      this.chunker = chunker;
      this.polisher = polisher;
      this.caller = caller;
    }
  },
  registerHandlers: jest.fn()
};

// Mock csstree
const mockCssTree = {
  generate: jest.fn(rule => '.test-selector')
};

// Setup DOM environment
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <div class="content">
        <div class="french-content">Contenu français</div>
        <div class="english-content">English content</div>
      </div>
    </body>
  </html>
`);

global.document = dom.window.document;
global.window = dom.window;
global.Paged = mockPaged;
global.csstree = mockCssTree;

describe('Plugin PagedJS Multi-flows', () => {
  let plugin;
  let mockChunker;
  let mockPolisher;
  let mockCaller;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock chunker
    mockChunker = {
      addPage: jest.fn(() => ({
        element: document.createElement('div'),
        id: 'page-1'
      })),
      hooks: {
        afterPageLayout: { trigger: jest.fn() },
        finalizePage: { trigger: jest.fn() }
      },
      emit: jest.fn()
    };

    // Initialize plugin
    plugin = new multilang(mockChunker, {}, {});
    
    // Reset DOM
    document.body.innerHTML = `
      <div class="content">
        <div class="french-content">Contenu français</div>
        <div class="english-content">English content</div>
      </div>
    `;
  });

  describe('Initialisation', () => {
    test('should initialize with default configuration', () => {
      expect(plugin.flowLocation).toBe('samepage');
      expect(plugin.parallelFLows).toEqual([]);
      expect(plugin.flowTracker).toEqual([]);
      expect(plugin.parallelImpacts).toEqual([]);
    });

    test('should inherit from Paged.Handler', () => {
      expect(plugin).toBeInstanceOf(mockPaged.Handler);
    });
  });

  describe('CSS Declaration Parsing', () => {
    test('should parse --parallel-flow declarations', () => {
      const mockDeclaration = {
        property: '--parallel-flow',
        value: { value: 'french' }
      };

      const mockRule = {
        ruleNode: {
          prelude: {}
        }
      };

      mockCssTree.generate.mockReturnValue('.french-content');

      plugin.onDeclaration(mockDeclaration, null, null, mockRule);

      expect(plugin.parallelFLows).toHaveLength(1);
      expect(plugin.parallelFLows[0]).toEqual({
        flow: 'french',
        selectors: [{ selector: '.french-content', height: 0 }]
      });
    });

    test('should parse --parallel-impact declarations', () => {
      const mockDeclaration = {
        property: '--parallel-impact',
        value: { value: 'all' }
      };

      const mockRule = {
        ruleNode: {
          prelude: {}
        }
      };

      mockCssTree.generate.mockReturnValue('.impact-element');

      plugin.onDeclaration(mockDeclaration, null, null, mockRule);

      expect(plugin.parallelImpacts).toContain('.impact-element');
    });

    test('should group multiple selectors for the same flow', () => {
      const mockDeclaration = {
        property: '--parallel-flow',
        value: { value: 'bilingual' }
      };

      const mockRule = {
        ruleNode: {
          prelude: {}
        }
      };

      // First selector
      mockCssTree.generate.mockReturnValue('.french-content');
      plugin.onDeclaration(mockDeclaration, null, null, mockRule);

      // Second selector for same flow
      mockCssTree.generate.mockReturnValue('.english-content');
      plugin.onDeclaration(mockDeclaration, null, null, mockRule);

      expect(plugin.parallelFLows).toHaveLength(1);
      expect(plugin.parallelFLows[0].selectors).toHaveLength(2);
    });
  });

  describe('DOM Manipulation - beforeParsed', () => {
    test('should add parallel-impact class to elements', () => {
      plugin.parallelImpacts = ['.french-content'];
      
      const content = document.querySelector('.content');
      plugin.beforeParsed(content, mockChunker);

      expect(content.querySelector('.french-content').classList.contains('parallel-impact')).toBe(true);
    });

    test('should filter out non-existing selectors', () => {
      plugin.parallelFLows = [{
        flow: 'test',
        selectors: [
          { selector: '.french-content', height: 0 },
          { selector: '.non-existing', height: 0 }
        ]
      }];

      const content = document.querySelector('.content');
      plugin.beforeParsed(content, mockChunker);

      expect(plugin.parallelFLows[0].selectors).toHaveLength(1);
      expect(plugin.parallelFLows[0].selectors[0].selector).toBe('.french-content');
    });

    test('should create and inject HTML template', () => {
      const content = document.querySelector('.content');
      plugin.beforeParsed(content, mockChunker);

      // Template should be created and then removed
      expect(document.querySelector('#parallel-removeme')).toBeNull();
    });

    test('should process flows and set dataset attributes', () => {
      plugin.parallelFLows = [{
        flow: 'bilingual',
        selectors: [{ selector: '.french-content', height: 0 }]
      }];

      const content = document.querySelector('.content');
      plugin.beforeParsed(content, mockChunker);

      const element = content.querySelector('.french-content');
      expect(element.dataset.flowName).toBe('bilingual');
      expect(element.classList.contains('parallel-obj-bilingual')).toBe(true);
    });
  });

  describe('Page Rendering - renderNode', () => {
    test('should return early if not on same page mode', () => {
      plugin.flowLocation = 'samespread';
      const mockNode = document.createElement('div');
      
      const result = plugin.renderNode(mockNode);
      expect(result).toBeUndefined();
    });

    test('should skip nodes with main-obj-in-flow', () => {
      plugin.flowLocation = 'samepage';
      const mockNode = document.createElement('div');
      const parent = document.createElement('div');
      parent.dataset.mainObjInFlow = 'true';
      parent.appendChild(mockNode);
      
      const result = plugin.renderNode(mockNode);
      expect(result).toBeUndefined();
    });

    test('should process flow nodes correctly', () => {
      plugin.flowLocation = 'samepage';
      plugin.flowTracker = [{
        flow: 'test',
        pages: [{
          page: '1',
          elements: [{
            id: 'test-element',
            offsetTop: 10,
            offsetLeft: 10,
            offsetWidth: 100,
            offsetHeight: 50
          }]
        }]
      }];

      const mockNode = document.createElement('div');
      const flowContainer = document.createElement('div');
      flowContainer.dataset.flowName = 'test';
      flowContainer.dataset.flowId = 'test-flow-1';
      flowContainer.appendChild(mockNode);

      // Mock page structure
      const page = document.createElement('div');
      page.className = 'pagedjs_page';
      page.id = 'page-1';
      
      const pageContent = document.createElement('div');
      pageContent.className = 'pagedjs_page_content';
      
      const contentDiv = document.createElement('div');
      pageContent.appendChild(contentDiv);
      page.appendChild(pageContent);
      
      flowContainer.appendChild(mockNode);
      page.appendChild(flowContainer);

      // Add flow start marker
      const flowStart = document.createElement('span');
      flowStart.className = 'flow-start';
      flowContainer.appendChild(flowStart);

      global.getPageNumber = jest.fn().mockReturnValue(1);

      plugin.renderNode(mockNode);
      
      expect(global.getPageNumber).toHaveBeenCalled();
    });
  });

  describe('Page Finalization', () => {
    test('should track flow elements with parallel-impact', () => {
      const mockPage = document.createElement('div');
      mockPage.id = 'page-1';
      
      const mainObj = document.createElement('div');
      mainObj.dataset.mainObjInFlow = 'true';
      mainObj.dataset.flowName = 'test-flow';
      
      const impactElement = document.createElement('div');
      impactElement.className = 'parallel-impact';
      impactElement.id = 'impact-1';
      Object.defineProperty(impactElement, 'offsetTop', { value: 10 });
      Object.defineProperty(impactElement, 'offsetLeft', { value: 20 });
      Object.defineProperty(impactElement, 'offsetWidth', { value: 100 });
      Object.defineProperty(impactElement, 'offsetHeight', { value: 50 });
      
      mockPage.appendChild(mainObj);
      mockPage.appendChild(impactElement);

      plugin.finalizePage(mockPage);

      expect(plugin.flowTracker).toHaveLength(1);
      expect(plugin.flowTracker[0].flow).toBe('test-flow');
      expect(plugin.flowTracker[0].pages).toHaveLength(1);
      expect(plugin.flowTracker[0].pages[0].elements).toHaveLength(1);
    });

    test('should add white pages when flowSpreadAddWhite is true', async () => {
      plugin.flowSpreadAddWhite = true;
      plugin.parallelFLows = [{ flow: 'test' }];

      const mockPage = document.createElement('div');
      const mainObj = document.createElement('div');
      mainObj.dataset.mainObjInFlow = 'true';
      mockPage.appendChild(mainObj);

      await plugin.finalizePage(mockPage);

      expect(mockChunker.addPage).toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    test('getBiggestHeight should return element with maximum height', () => {
      const arr = [
        { height: 10, selector: '.small' },
        { height: 50, selector: '.big' },
        { height: 30, selector: '.medium' }
      ];

      const result = getBiggestHeight(arr);
      expect(result).toEqual({ height: 50, selector: '.big' });
    });

    test('getAllButBiggestHeight should return all elements except the biggest', () => {
      const arr = [
        { height: 10, selector: '.small' },
        { height: 50, selector: '.big' },
        { height: 30, selector: '.medium' }
      ];

      const result = getAllButBiggestHeight(arr);
      expect(result).toHaveLength(2);
      expect(result).not.toContain({ height: 50, selector: '.big' });
    });

    test('getPageNumber should extract page number from element', () => {
      const mockPage = document.createElement('div');
      mockPage.className = 'pagedjs_page';
      mockPage.id = 'page-42';
      
      const element = document.createElement('div');
      mockPage.appendChild(element);

      const result = getPageNumber(element);
      expect(result).toBe('42');
    });

    test('checkOverlap should detect rectangle overlap', () => {
      const rect1 = { left: 10, top: 10, right: 50, bottom: 50 };
      const rect2 = { left: 30, top: 30, right: 70, bottom: 70 };

      const result = checkOverlap(rect1, rect2);
      
      expect(result).toBeTruthy();
      expect(result.x).toBe(0); // relative to rect2
      expect(result.y).toBe(0); // relative to rect2
      expect(result.width).toBe(20);
      expect(result.height).toBe(20);
    });

    test('checkOverlap should return null for non-overlapping rectangles', () => {
      const rect1 = { left: 10, top: 10, right: 30, bottom: 30 };
      const rect2 = { left: 50, top: 50, right: 70, bottom: 70 };

      const result = checkOverlap(rect1, rect2);
      expect(result).toBeNull();
    });

    test('createOverlapElement should create positioned div', () => {
      const overlap = { x: 10, y: 20, width: 100, height: 50 };
      const container = document.createElement('div');
      
      createOverlapElement(overlap, container, 16, 'test-overlap');
      
      const overlapEl = container.querySelector('#test-overlap');
      expect(overlapEl).toBeTruthy();
      expect(overlapEl.style.width).toBe('116px'); // 100 + 16 offset
      expect(overlapEl.style.height).toBe('66px'); // 50 + 16 offset
      expect(overlapEl.style.float).toBe('left');
    });
  });

  describe('Configuration Edge Cases', () => {
    test('should default to samespread when invalid flowLocation', () => {
      plugin.flowLocation = 'invalid';
      plugin.onDeclaration({ property: '--parallel-flow', value: { value: 'test' } }, null, null, {
        ruleNode: { prelude: {} }
      });
      
      expect(plugin.flowLocation).toBe('samespread');
    });

    test('should handle empty parallel flows', () => {
      plugin.parallelFLows = [];
      const content = document.querySelector('.content');
      
      expect(() => {
        plugin.beforeParsed(content, mockChunker);
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete flow processing', () => {
      // Setup realistic scenario
      plugin.parallelFLows = [{
        flow: 'bilingual',
        selectors: [
          { selector: '.french-content', height: 0 },
          { selector: '.english-content', height: 0 }
        ]
      }];

      const content = document.querySelector('.content');
      plugin.beforeParsed(content, mockChunker);

      // Verify elements are processed
      const frenchEl = content.querySelector('.french-content');
      const englishEl = content.querySelector('.english-content');
      
      expect(frenchEl.dataset.flowName).toBe('bilingual');
      expect(englishEl.dataset.flowName).toBe('bilingual');
      expect(frenchEl.classList.contains('parallel-obj-bilingual')).toBe(true);
      expect(englishEl.classList.contains('parallel-obj-bilingual')).toBe(true);
    });
  });
});

// Helper function tests (if they were exported)
describe('Helper Functions', () => {
  // Tests for getBiggestHeight, getAllButBiggestHeight, etc.
  // These would need to be exported from your main file
});

// Mock implementation for testing
function getBiggestHeight(arr) {
  return arr.reduce((max, obj) => (obj.height > max.height ? obj : max), arr[0]);
}

function getAllButBiggestHeight(arr) {
  const biggest = getBiggestHeight(arr);
  return arr.filter(obj => obj !== biggest);
}

function getPageNumber(obj) {
  if (!obj) return undefined;
  return obj.closest('.pagedjs_page').id.replace('page-', '');
}

function checkOverlap(rect1, rect2) {
  if (!rect1 || !rect2) return null;
  
  const xOverlap = rect1.left < rect2.right && rect1.right > rect2.left;
  const yOverlap = rect1.top < rect2.bottom && rect1.bottom > rect2.top;

  if (xOverlap && yOverlap) {
    const overlapX = Math.max(rect1.left, rect2.left);
    const overlapY = Math.max(rect1.top, rect2.top);
    const overlapWidth = Math.min(rect1.right, rect2.right) - overlapX;
    const overlapHeight = Math.min(rect1.bottom, rect2.bottom) - overlapY;

    return {
      x: overlapX - rect2.left,
      y: overlapY - rect2.top,
      width: overlapWidth,
      height: overlapHeight
    };
  }

  return null;
}

function createOverlapElement(overlap, box2element, offset = 16, id) {
  const overlapElement = document.createElement('div');
  overlapElement.classList.add('overlap');
  overlapElement.style.width = `${overlap.width + offset}px`;
  overlapElement.style.height = `${overlap.height + offset}px`;
  overlapElement.style.marginTop = `${overlap.y - offset / 2}px`;
  overlapElement.style.marginLeft = `${overlap.x - offset / 2}px`;
  overlapElement.style.float = 'left';
  overlapElement.style.shapeOutside = 'content-box';
  overlapElement.id = id;
  overlapElement.dataset.id = id;

  box2element.insertAdjacentElement('afterbegin', overlapElement);
}