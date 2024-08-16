function removeHighlights(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        // Remove <mark> tags
        if (node.tagName.toLowerCase() === 'mark' && node.classList.contains('smartsearch-highlight')) {
            const parent = node.parentNode;
            while (node.firstChild) {
                parent.insertBefore(node.firstChild, node);
            }
            parent.removeChild(node);
        }

        // Remove <span> wrappers created during highlighting
        if (node.tagName.toLowerCase() === 'span' && node.dataset.originalText) {
            const parent = node.parentNode;
            const textNode = document.createTextNode(node.dataset.originalText);
            parent.replaceChild(textNode, node);
        }

        // Reset input field styles
        if (node.tagName.toLowerCase() === 'input' || node.tagName.toLowerCase() === 'textarea') {
            node.style.backgroundColor = '';
            node.style.color = '';
        }

        // Traverse child nodes
        for (let child of Array.from(node.childNodes)) {
            removeHighlights(child);
        }
    }
}

function traverseAndHighlight(node, regex) {
    if (node.nodeType === Node.TEXT_NODE) {
        const parent = node.parentNode;
        if (parent && isVisible(parent)) {
            const textContent = node.textContent;
            const matches = textContent.match(regex);
            if (matches) {
                const span = document.createElement('span');
                span.dataset.originalText = textContent; // Store original text
                span.innerHTML = textContent.replace(regex, (match) => `<mark class="smartsearch-highlight">${match}</mark>`);
                parent.replaceChild(span, node);
            }
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Check for input values
        if (node.tagName.toLowerCase() === 'input' || node.tagName.toLowerCase() === 'textarea') {
            const value = node.value;
            if (value) {
                const matches = value.match(regex);
                if (matches) {
                    node.style.backgroundColor = 'rgba(255, 255, 0, 0.7)'; 
                    node.style.color = 'black';
                } else {
                    node.style.backgroundColor = '';
                    node.style.color = '';
                }
            }
        }

        // Check for aria-label
        const ariaLabel = node.getAttribute('aria-label');
        if (ariaLabel && regex.test(ariaLabel)) {
            node.style.backgroundColor = 'rgba(255, 255, 0, 0.7)'; // Highlight the element
        }

        // Traverse child nodes
        for (let child of Array.from(node.childNodes)) {
            traverseAndHighlight(child, regex);
        }
    }
}

function isVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && element.offsetParent !== null;
}

function highlightMatches(input, mode) {
    try {
        let regex;

        if (mode === 'regex') {
            if (input[0] === "/") {
                const parts = input.match(/^\/(.*?)\/([gimsuy]*)$/);
                if (parts) {
                    const pattern = parts[1];
                    const flags = parts[2];
                    regex = new RegExp(pattern, flags);
                } else {
                    throw new Error("Invalid regex literal format");
                }
            } else {
                regex = new RegExp(input, 'g');
            }
        } else if (mode === 'plain') {
            const escapedInput = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            regex = new RegExp(escapedInput, 'gi');
        }

        // Remove previous highlights
        removeHighlights(document.body);

        // Start highlighting text nodes and input values
        traverseAndHighlight(document.body, regex);
    } catch (e) {
        alert('Invalid input: ' + e.message);
    }
}

function clearHighlights() {
    removeHighlights(document.body);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'highlight') {
        highlightMatches(request.regex, request.mode);
    } else if (request.action === 'clear') {
        clearHighlights();
    }
});