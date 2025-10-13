/*
 * Paged.js Handler for Typography Enhancement
 * Features: URL cleaning, language-aware smart quotes, micro-typography
 */

class textCleaner extends Paged.Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
        this.pagednotetype = [];

        // Quote styles by language using Unicode escapes to avoid conflicts
        this.quoteStyles = {
            'en': { primary: ['\u201C', '\u201D'], secondary: ['\u2018', '\u2019'] },
            'fr': { primary: ['\u00AB', '\u00BB'], secondary: ['\u2039', '\u203A'] },
            'de': { primary: ['\u201E', '\u201C'], secondary: ['\u201A', '\u2018'] },
            'es': { primary: ['\u00AB', '\u00BB'], secondary: ['\u201C', '\u201D'] },
            'it': { primary: ['\u00AB', '\u00BB'], secondary: ['\u201C', '\u201D'] },
            'pt': { primary: ['\u00AB', '\u00BB'], secondary: ['\u201C', '\u201D'] },
            'ru': { primary: ['\u00AB', '\u00BB'], secondary: ['\u201E', '\u201C'] },
            'pl': { primary: ['\u201E', '\u201C'], secondary: ['\u201A', '\u2018'] },
            'nl': { primary: ['\u201C', '\u201D'], secondary: ['\u2018', '\u2019'] },
            'sv': { primary: ['\u201D', '\u201D'], secondary: ['\u2019', '\u2019'] },
            'default': { primary: ['\u201C', '\u201D'], secondary: ['\u2018', '\u2019'] }
        };
    }

    onDeclaration(declaration, dItem, dList, rule) {
        // Can be used to detect custom CSS properties if needed
    }

    beforeParsed(content) {
        const chapters = content.querySelectorAll(".chapter");

        console.log(`Processing ${chapters.length} chapters`);

        chapters.forEach((chap, index) => {
            console.log(`Processing chapter ${index + 1}`);

            // 1. Detect language
            const lang = this.detectChapterLanguage(chap);
            console.log(`Detected language: ${lang}`);

            // 2. Clean URLs in text
            this.cleanURLsInChapter(chap);

            // 3. Apply language-appropriate smart quotes
            this.applySmartQuotes(chap, lang);

            // 4. Apply micro-typography rules
            // this.applyMicroTypography(chap, lang);

            // 5. Mark as processed
            chap.dataset.typographyProcessed = 'true';
            chap.dataset.language = lang;
        });
    }

    /**
     * Detect the language of a chapter
     */
    detectChapterLanguage(chapter) {
        // Priority 1: Check explicit lang attribute
        if (chapter.lang) {
            return chapter.lang.toLowerCase().split('-')[0];
        }

        // Priority 2: Check parent elements
        let parent = chapter.parentElement;
        while (parent) {
            if (parent.lang) {
                return parent.lang.toLowerCase().split('-')[0];
            }
            parent = parent.parentElement;
        }

        // Priority 3: Check document language
        if (document.documentElement.lang) {
            return document.documentElement.lang.toLowerCase().split('-')[0];
        }

        // Priority 4: Heuristic detection based on common words
        const text = chapter.textContent.toLowerCase();
        const languagePatterns = {
            'fr': /\b(le|la|les|un|une|des|et|dans|pour|que|qui|avec|par)\b/g,
            'de': /\b(der|die|das|und|ist|in|den|von|zu|mit|sich)\b/g,
            'es': /\b(el|la|los|las|un|una|y|en|de|que|por)\b/g,
            'it': /\b(il|la|i|le|un|una|di|da|in|per|con)\b/g,
            'pt': /\b(o|a|os|as|um|uma|de|em|para|que|por)\b/g,
            'en': /\b(the|and|is|in|to|of|a|for|that|with)\b/g
        };

        let maxMatches = 0;
        let detectedLang = 'en';

        for (const [lang, pattern] of Object.entries(languagePatterns)) {
            const matches = (text.match(pattern) || []).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                detectedLang = lang;
            }
        }

        return detectedLang;
    }

    /**
     * Clean URLs in text - make them more readable
     */
    cleanURLsInChapter(chapter) {
        // Find all text nodes
        const walker = document.createTreeWalker(
            chapter,
            NodeFilter.SHOW_TEXT,
            null
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            // Skip nodes that are already in links
            if (node.parentElement.tagName !== 'A') {
                textNodes.push(node);
            }
        }

        // URL patterns to clean
        const urlPatterns = [
            // Match full URLs
            /(https?:\/\/[^\s]+)/g,
            // Match www URLs
            /(www\.[^\s]+)/g
        ];

        textNodes.forEach(textNode => {
            let text = textNode.textContent;
            let modified = false;

            urlPatterns.forEach(pattern => {
                text = text.replace(pattern, (match) => {
                    modified = true;
                    return this.cleanURL(match);
                });
            });

            if (modified) {
                // Create a temporary container
                const temp = document.createElement('span');
                temp.innerHTML = text;

                // Replace the text node with the new content
                const parent = textNode.parentNode;
                while (temp.firstChild) {
                    parent.insertBefore(temp.firstChild, textNode);
                }
                parent.removeChild(textNode);
            }
        });
    }

    /**
     * Clean a single URL for better readability
     */
    cleanURL(url) {
        // Remove protocol for cleaner display
        let cleanUrl = url.replace(/^https?:\/\//, '');

        // Remove www for cleaner display
        cleanUrl = cleanUrl.replace(/^www\./, '');

        // Remove trailing slashes
        cleanUrl = cleanUrl.replace(/\/$/, '');

        // Decode URL encoding
        try {
            cleanUrl = decodeURIComponent(cleanUrl);
        } catch (e) {
            // If decoding fails, keep original
        }

        // Wrap in a link with the original URL
        return `${cleanUrl}`;
    }

    /**
     * Apply smart quotes based on language
     */
    applySmartQuotes(chapter, lang) {
        const quotes = this.quoteStyles[lang] || this.quoteStyles.default;

        // Get all text nodes
        const walker = document.createTreeWalker(
            chapter,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip code blocks, pre elements, and elements with class 'no-typography'
                    const parent = node.parentElement;
                    if (parent.tagName === 'CODE' ||
                        parent.tagName === 'PRE' ||
                        parent.classList.contains('no-typography')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.includes('"') || node.textContent.includes("'")) {
                textNodes.push(node);
            }
        }

        textNodes.forEach(textNode => {
            let text = textNode.textContent;

            // Apply primary quotes (double quotes)
            text = this.replaceQuotes(text, '"', quotes.primary);

            // Apply secondary quotes (single quotes) - but preserve apostrophes
            text = this.replaceQuotes(text, "'", quotes.secondary, true);

            // Fix apostrophes in contractions (only for languages that use them)
            if (['en', 'fr', 'it'].includes(lang)) {
                text = text.replace(/(\w)[\u2018\u2019'](\w)/g, '$1\u2019$2');
            }

            textNode.textContent = text;
        });
    }

    /**
     * Replace straight quotes with smart quotes
     */
    replaceQuotes(text, straightQuote, smartQuotes, isSecondary = false) {
        const [openQuote, closeQuote] = smartQuotes;
        let inQuote = false;
        let result = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const prevChar = i > 0 ? text[i - 1] : ' ';
            const nextChar = i < text.length - 1 ? text[i + 1] : ' ';

            if (char === straightQuote) {
                // If it's a single quote and surrounded by letters, it's likely an apostrophe
                if (isSecondary && /\w/.test(prevChar) && /\w/.test(nextChar)) {
                    result += '\u2019'; // Use typographic apostrophe
                    continue;
                }

                // Determine if it's opening or closing
                if (!inQuote) {
                    // Opening quote: preceded by whitespace or punctuation
                    if (/[\s\(\[\{]/.test(prevChar) || i === 0) {
                        result += openQuote;
                        inQuote = true;
                    } else {
                        result += closeQuote;
                    }
                } else {
                    // Closing quote
                    result += closeQuote;
                    inQuote = false;
                }
            } else {
                result += char;
            }
        }

        return result;
    }

    /**
     * Apply micro-typography rules
     */
    applyMicroTypography(chapter, lang) {
        // Get all paragraph-like elements
        const elements = chapter.querySelectorAll('p, li, blockquote, td, th, dd, dt, figcaption');

        elements.forEach(element => {
            if (element.classList.contains('no-typography')) {
                return;
            }

            // Get all text nodes
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        const parent = node.parentElement;
                        if (parent.tagName === 'CODE' || parent.tagName === 'PRE') {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );

            const textNodes = [];
            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }

            textNodes.forEach(textNode => {
                let text = textNode.textContent;

                // Apply language-specific rules
                text = this.applyLanguageSpecificRules(text, lang);

                // Common rules for all languages
                text = this.applyCommonRules(text);

                textNode.textContent = text;
            });
        });
    }

    /**
     * Apply language-specific typography rules
     */
    applyLanguageSpecificRules(text, lang) {
        switch (lang) {
            case 'fr':
                // French: thin space before : ; ! ?
                text = text.replace(/\s*([;:!?])/g, '\u202F$1'); // NARROW NO-BREAK SPACE
                // French: space after opening guillemet, before closing
                text = text.replace(/\u00AB\s*/g, '\u00AB\u202F');
                text = text.replace(/\s*\u00BB/g, '\u202F\u00BB');
                break;

            case 'de':
            case 'pl':
                // No space before punctuation in German/Polish
                text = text.replace(/\s+([.,;:!?])/g, '$1');
                break;

            case 'es':
            case 'fr':
                // Opening punctuation marks
                text = text.replace(/(\u00BF|\u00A1)\s*/g, '$1\u00A0'); // NO-BREAK SPACE
                break;
        }

        return text;
    }

    /**
     * Apply common typography rules
     */
    applyCommonRules(text) {
        // Em dashes
        text = text.replace(/\s*--\s*/g, '\u2009\u2014\u2009'); // THIN SPACE around em dash
        text = text.replace(/(\w)--(\w)/g, '$1\u2014$2');

        // En dashes for ranges
        text = text.replace(/(\d+)\s*-\s*(\d+)/g, '$1\u2013$2'); // EN DASH

        // Ellipsis
        text = text.replace(/\.{3,}/g, '\u2026');
        text = text.replace(/\.\s\.\s\./g, '\u2026');

        // Non-breaking spaces after short words
        const shortWords = ['a', 'an', 'the', 'at', 'by', 'to', 'in', 'of', 'on', 'or',
            'le', 'la', 'les', 'un', 'une', 'de', 'du', 'des',
            'der', 'die', 'das', 'ein', 'eine',
            'el', 'la', 'los', 'las', 'un', 'una'];

        shortWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\s+`, 'gi');
            text = text.replace(regex, (match) => {
                // Preserve the original case of the matched word
                const matchedWord = match.trim();
                return matchedWord + '\u00A0';
            });
        });

        // Prevent orphans: non-breaking space before last word
        text = text.replace(/\s+(\S+)\s*$/gm, '\u00A0$1');

        return text;
    }

    finalizePage(page, pageMeta) {
        // Optional: Add page-specific adjustments
        // For example, adjust spacing on first/last lines of pages
    }

    afterRendered(pages) {
        console.log(`Typography processing complete. ${pages.length} pages rendered.`);

        // Optional: Post-processing after all pages are rendered
        // Could add widow/orphan detection across page breaks
    }
}

// Register the handler
Paged.registerHandlers(textCleaner);