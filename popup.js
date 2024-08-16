document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['savedRegex', 'searchMode'], (result) => {
        if (result.savedRegex) {
            document.getElementById('regexInput').value = result.savedRegex;
        }
        if (result.searchMode) {
            document.getElementById('searchMode').value = result.searchMode;
        }
    });

    document.getElementById('searchButton').addEventListener('click', () => {
        const regexInput = document.getElementById('regexInput').value;
        const searchMode = document.getElementById('searchMode').value;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['content.js']
            }, () => {
                if (regexInput) {
                    chrome.storage.sync.set({ savedRegex: regexInput, searchMode: searchMode }, () => {
                        console.log('Settings saved:', regexInput, searchMode);
                    });
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'highlight', regex: regexInput, mode: searchMode });
                } else {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'clear' });
                }
            });
        });
    });

    document.getElementById('clearButton').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['content.js']
            }, () => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'clear' });
            });
        });
    });
});