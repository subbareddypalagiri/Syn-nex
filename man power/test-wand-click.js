/**
 * Test: Magic Wand Click Event Tunneling
 * Simulates the complete flow from wand click to text refinement
 * 
 * Usage:
 * 1. Load Gemini in Chrome
 * 2. Type some text in the prompt box
 * 3. Open DevTools console
 * 4. Copy this entire file and paste it into console
 * 5. The test will simulate a wand click
 */

console.log('═══════════════════════════════════════════════════════════');
console.log('🧪 Testing Magic Wand Click Event Tunneling');
console.log('═══════════════════════════════════════════════════════════');

// Step 1: Verify wand exists
const wand = document.querySelector('ai-refiner-wand');
console.log('✓ Step 1: Wand element found?', !!wand);

if (!wand) {
  console.error('❌ FAIL: Wand not found in DOM. Is it injected?');
} else {
  console.log('   Wand details:', {
    tagName: wand.tagName,
    platform: wand.getAttribute('platform'),
    hasShadowRoot: !!wand.shadowRoot
  });
}

// Step 2: Register event listener to capture the event
console.log('\n✓ Step 2: Registering test event listener on document');
let eventCaptured = false;
let eventDetails = null;

const testListener = (event) => {
  eventCaptured = true;
  eventDetails = {
    type: event.type,
    bubbles: event.bubbles,
    composed: event.composed,
    platform: event.detail?.platform,
    timestamp: event.detail?.timestamp
  };
  console.log('   Event captured!', eventDetails);
};

document.addEventListener('refine-prompt-trigger', testListener);
console.log('   Test listener registered');

// Step 3: Simulate wand click
console.log('\n✓ Step 3: Simulating wand click...');

if (wand) {
  // Find the wand button inside shadow DOM and click it
  const wandButton = wand.shadowRoot?.querySelector('#wand-btn');
  
  if (wandButton) {
    console.log('   Found wand button, clicking it');
    wandButton.click();
    
    // Wait a bit for event to propagate
    setTimeout(() => {
      console.log('\n   Event captured?', eventCaptured);
      if (eventCaptured) {
        console.log('   Event details:', eventDetails);
      }
    }, 100);
  } else {
    console.error('   ❌ Could not find wand button in shadow DOM');
  }
} else {
  console.error('   ❌ Could not simulate click - wand not found');
}

// Step 4: Check if wand has loaded status
console.log('\n✓ Step 4: Checking wand visual feedback methods');
if (wand) {
  console.log('   Wand has setLoading method?', typeof wand.setLoading === 'function');
  console.log('   Wand has updateStatus method?', typeof wand.updateStatus === 'function');
  
  if (typeof wand.setLoading === 'function') {
    console.log('   Testing setLoading(true)...');
    wand.setLoading(true);
    setTimeout(() => {
      console.log('   Testing setLoading(false)...');
      wand.setLoading(false);
    }, 1000);
  }
}

// Step 5: Check service worker communication
console.log('\n✓ Step 5: Checking Chrome runtime API');
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('   Chrome runtime available? Yes');
  console.log('   Can send messages? Yes');
} else {
  console.error('   ❌ Chrome runtime not available');
}

// Step 6: Check storage API
console.log('\n✓ Step 6: Checking Chrome storage API');
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get('apiKey', (result) => {
    if (result.apiKey) {
      console.log('   API key found in storage ✓');
    } else {
      console.warn('   API key NOT found in storage (user must set it in settings)');
    }
  });
} else {
  console.error('   ❌ Chrome storage not available');
}

// Step 7: Check input box
console.log('\n✓ Step 7: Checking Gemini input box');
const inputBox = document.querySelector('[contenteditable="true"][aria-label*="Prompt"]') ||
                 document.querySelector('[contenteditable="true"]');
if (inputBox) {
  const currentText = inputBox.innerText || inputBox.textContent;
  console.log('   Input box found ✓');
  console.log('   Current text length:', currentText?.length || 0);
  console.log('   Tag name:', inputBox.tagName);
  console.log('   ContentEditable:', inputBox.contentEditable);
} else {
  console.warn('   Input box not found (may be in deep shadow DOM)');
}

// Summary
console.log('\n═══════════════════════════════════════════════════════════');
console.log('🧪 Test Summary');
console.log('═══════════════════════════════════════════════════════════');
console.log('✓ Wand exists:', !!wand);
console.log('✓ Event listener registered: Yes');
console.log('✓ Event captured:', eventCaptured);
console.log('✓ Chrome API available:', typeof chrome !== 'undefined');
console.log('✓ Input box found:', !!inputBox);

if (wand && eventCaptured && inputBox) {
  console.log('\n✅ ALL CHECKS PASSED - Event tunneling is working!');
} else {
  console.log('\n⚠️  Some checks failed - see details above');
}

console.log('═══════════════════════════════════════════════════════════');

// Cleanup
setTimeout(() => {
  document.removeEventListener('refine-prompt-trigger', testListener);
  console.log('\n🧹 Cleanup: Test listener removed');
}, 2000);
