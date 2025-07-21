// multilang.test.js
// Version simplifiée pour débuter

// Si tu exports ton plugin, sinon copie la classe directement
// import { multilang } from './multilang-plugin';

// Pour l'instant, on copie la classe directement
class multilang extends Paged.Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
        this.flowLocation = "samepage";
        this.parallelFLows = [];
        this.flowTracker = [];
        this.parallelImpacts = [];
    }

    onDeclaration(declaration, dItem, dList, rule) {
        if (declaration.property == "--parallel-flow") {
            let sel = csstree.generate(rule.ruleNode.prelude);
            sel = sel.replace('[data-id="', "#");
            sel = sel.replace('"]', "");

            let flow = this.parallelFLows.find((a) => {
                return a.flow == declaration.value.value.trim();
            });

            if (flow) {
                flow.selectors.push({ selector: sel, height: 0 });
            } else {
                this.parallelFLows.push({
                    flow: declaration.value.value.trim(),
                    selectors: [{ selector: sel, height: 0 }],
                });
            }
        }
    }
}

describe('Plugin PagedJS Multi-flows - Tests de base', () => {
    let plugin;
    let mockChunker;

    beforeEach(() => {
        mockChunker = {
            addPage: jest.fn(),
            hooks: {
                afterPageLayout: { trigger: jest.fn() },
                finalizePage: { trigger: jest.fn() }
            },
            emit: jest.fn()
        };

        plugin = new multilang(mockChunker, {}, {});

        // Reset DOM
        document.body.innerHTML = `
        <div class="content">
          <div class="french-content">Contenu français</div>
          <div class="english-content">English content</div>
        </div>
      `;
    });

    test('should initialize plugin correctly', () => {
        expect(plugin.flowLocation).toBe('samepage');
        expect(plugin.parallelFLows).toEqual([]);
        expect(plugin.flowTracker).toEqual([]);
        expect(plugin.parallelImpacts).toEqual([]);
    });

    test('should parse CSS declarations', () => {
        const mockDeclaration = {
            property: '--parallel-flow',
            value: { value: 'french' }
        };

        const mockRule = {
            ruleNode: {
                prelude: {}
            }
        };

        csstree.generate.mockReturnValue('.french-content');

        plugin.onDeclaration(mockDeclaration, null, null, mockRule);

        expect(plugin.parallelFLows).toHaveLength(1);
        expect(plugin.parallelFLows[0].flow).toBe('french');
        expect(plugin.parallelFLows[0].selectors[0].selector).toBe('.french-content');
    });

    test('should find DOM elements', () => {
        const frenchContent = document.querySelector('.french-content');
        const englishContent = document.querySelector('.english-content');

        expect(frenchContent).toBeTruthy();
        expect(englishContent).toBeTruthy();
        expect(frenchContent.textContent).toBe('Contenu français');
        expect(englishContent.textContent).toBe('English content');
    });
});

// Tests des fonctions utilitaires
describe('Utility Functions', () => {
    test('getBiggestHeight should work', () => {
        const arr = [
            { height: 10, selector: '.small' },
            { height: 50, selector: '.big' },
            { height: 30, selector: '.medium' }
        ];

        function getBiggestHeight(arr) {
            return arr.reduce((max, obj) => (obj.height > max.height ? obj : max), arr[0]);
        }

        const result = getBiggestHeight(arr);
        expect(result.height).toBe(50);
        expect(result.selector).toBe('.big');
    });

    test('checkOverlap should detect overlapping rectangles', () => {
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

        const rect1 = { left: 10, top: 10, right: 50, bottom: 50 };
        const rect2 = { left: 30, top: 30, right: 70, bottom: 70 };

        const result = checkOverlap(rect1, rect2);

        expect(result).toBeTruthy();
        expect(result.width).toBe(20);
        expect(result.height).toBe(20);
    });
});