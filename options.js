document.addEventListener('DOMContentLoaded', () => {
    // Load saved API key
    chrome.storage.sync.get('openaiApiKey', (result) => {
        if (result.openaiApiKey) {
            document.getElementById('apiKey').value = result.openaiApiKey;
        }
    });

    // Save API key
    document.getElementById('saveButton').addEventListener('click', () => {
        const apiKey = document.getElementById('apiKey').value;
        chrome.storage.sync.set({ openaiApiKey: apiKey }, () => {
            const status = document.getElementById('status');
            status.textContent = 'Settings saved.';
            setTimeout(() => {
                status.textContent = '';
            }, 3000);
        });
    });
});