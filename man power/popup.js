/**
 * Popup Settings Page
 * Manages API key configuration and extension settings
 */

const settingsForm = document.getElementById('settingsForm');
const apiKeyInput = document.getElementById('apiKey');
const testBtn = document.getElementById('testBtn');
const statusDiv = document.getElementById('status');

// Load settings on popup open
document.addEventListener('DOMContentLoaded', loadSettings);

/**
 * Load settings from chrome.storage
 */
function loadSettings() {
  chrome.storage.local.get(['geminiApiKey', 'autoScrubPII', 'showStatusText'], result => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
    document.getElementById('autoScrubPII').checked = result.autoScrubPII !== false;
    document.getElementById('showStatusText').checked = result.showStatusText !== false;
  });
}

/**
 * Save settings
 */
settingsForm.addEventListener('submit', e => {
  e.preventDefault();

  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showStatus('API key is required', 'error');
    return;
  }

  chrome.storage.local.set(
    {
      geminiApiKey: apiKey,
      autoScrubPII: document.getElementById('autoScrubPII').checked,
      showStatusText: document.getElementById('showStatusText').checked,
    },
    () => {
      showStatus('✅ Settings saved successfully!', 'success');
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  );
});

/**
 * Test API connection
 */
testBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showStatus('Please enter an API key first', 'error');
    return;
  }

  testBtn.disabled = true;
  testBtn.textContent = 'Testing...';
  showStatus('Testing API connection...', 'info');

  try {
    // Use v1beta endpoint with gemini-2.5-flash-lite (latest free-tier model)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Say "API test successful" in exactly 4 words.',
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (textContent) {
      showStatus('✅ API test successful! Your Gemini API key is valid and the extension is ready.', 'success');
    } else {
      throw new Error('Unexpected API response format');
    }
  } catch (error) {
    showStatus(`❌ API test failed: ${error.message}`, 'error');
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = 'Test API';
  }
});

/**
 * Display status message
 * @param {string} message
 * @param {string} type - 'success', 'error', 'info'
 */
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
}
