// Function to get regex from OpenAI API
async function getRegexFromOpenAI(query, apiKey) {
    // Send POST request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: "You are a regex expert. Provide only the regex pattern without explanation."
            }, {
                role: "user",
                content: `Generate a regex pattern for: ${query}`
            }],
            temperature: 0.7
        })
    });

    // Check if the response is successful
    if (!response.ok) {
        throw new Error(`OpenAI API request failed: ${response.statusText}`);
    }

    // Parse the response and return the generated regex
    const data = await response.json();
    return data.choices[0].message.content.trim();
}

// Wait for the DOM to be fully loaded before executing
document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements
    const regexInput = document.getElementById('regexInput');
    const searchButton = document.getElementById('searchButton');
    const searchMode = document.getElementById('searchMode');

    // Load saved settings from chrome storage
    chrome.storage.sync.get(['savedRegex', 'searchMode', 'openaiApiKey'], (result) => {
        if (result.savedRegex) {
            regexInput.value = result.savedRegex;
        }
        if (result.searchMode) {
            searchMode.value = result.searchMode;
        }
        updateInputState(result.searchMode, result.openaiApiKey);
    });

    // Add event listener for search mode change
    searchMode.addEventListener('change', () => {
        chrome.storage.sync.get('openaiApiKey', (result) => {
            updateInputState(searchMode.value, result.openaiApiKey);
        });
    });

    // Function to update input state based on search mode and API key
    function updateInputState(mode, apiKey) {
        if (mode === 'ai') {
            if (!apiKey) {
                regexInput.disabled = true;
                searchButton.disabled = true;
                regexInput.placeholder = "Enter OpenAI API key in Settings";
            } else {
                regexInput.disabled = false;
                searchButton.disabled = false;
                regexInput.placeholder = "Enter your AI-powered search query";
            }
        } else {
            regexInput.disabled = false;
            searchButton.disabled = false;
            regexInput.placeholder = "Enter your search pattern";
        }
    }

    // Add event listener for search button click
    document.getElementById('searchButton').addEventListener('click', async () => {
        const regexInput = document.getElementById('regexInput').value;
        const searchMode = document.getElementById('searchMode').value;

        let regex = regexInput;

        // If AI mode is selected, get regex from OpenAI
        if (searchMode === 'ai') {
            try {
                const apiKey = await new Promise((resolve) => {
                    chrome.storage.sync.get('openaiApiKey', (result) => resolve(result.openaiApiKey));
                });
                if (!apiKey) {
                    alert('Please set your OpenAI API key in the extension settings.');
                    return;
                }
                regex = await getRegexFromOpenAI(regexInput, apiKey);
            } catch (error) {
                alert(`Error getting regex from OpenAI: ${error.message}`);
                return;
            }
        }

        // Execute content script and send message to highlight or clear
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['content.js']
            }, () => {
                if (regex) {
                    // Save settings
                    chrome.storage.sync.set({ savedRegex: regexInput, searchMode: searchMode }, () => {
                        console.log('Settings saved:', regexInput, searchMode);
                    });
                    // Send message to highlight
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'highlight', regex: regex, mode: searchMode });
                } else {
                    // Send message to clear
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'clear' });
                }
            });
        });
    });

    // Add event listener for clear button click
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

    // Add event listener for settings icon click
    document.getElementById('settingsIcon').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});