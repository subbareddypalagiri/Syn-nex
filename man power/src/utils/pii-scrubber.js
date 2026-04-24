/**
 * PII Scrubber Utility
 * Sanitizes sensitive data before sending to external APIs
 */

const PIIScrubber = {
  /**
   * Comprehensive PII scrubbing
   * @param {string} text
   * @returns {string}
   */
  scrub(text) {
    let scrubbed = text;

    // Email addresses
    scrubbed = this.scrubEmails(scrubbed);

    // Phone numbers
    scrubbed = this.scrubPhoneNumbers(scrubbed);

    // Credit card numbers
    scrubbed = this.scrubCreditCards(scrubbed);

    // Social Security numbers
    scrubbed = this.scrubSSN(scrubbed);

    // IP addresses
    scrubbed = this.scrubIPAddresses(scrubbed);

    // Names (optional - patterns for common name formats)
    scrubbed = this.scrubCommonNames(scrubbed);

    // URLs with credentials
    scrubbed = this.scrubURLCredentials(scrubbed);

    return scrubbed;
  },

  scrubEmails(text) {
    return text.replace(/[\w\.-]+@[\w\.-]+\.\w+/g, '[EMAIL]');
  },

  scrubPhoneNumbers(text) {
    // US format: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
    // International: +1 123 456 7890, +44 20 7946 0958
    return text.replace(
      /\b(?:\+?\d{1,3}[-.\s]?)?\(?(?:\d{3})\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      '[PHONE]'
    );
  },

  scrubCreditCards(text) {
    // Visa, Mastercard, Amex, Discover
    return text.replace(
      /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
      '[CREDIT_CARD]'
    );
  },

  scrubSSN(text) {
    // Format: XXX-XX-XXXX
    return text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
  },

  scrubIPAddresses(text) {
    // IPv4 addresses
    return text.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP]');
  },

  scrubCommonNames(text) {
    // This is a basic approach - only scrub if explicitly enabled
    // Disabled by default as it might over-scrub legitimate words
    return text;
  },

  scrubURLCredentials(text) {
    // URLs with embedded credentials: http://user:pass@domain.com
    return text.replace(
      /https?:\/\/[^\s:/@]+:[^\s/@]+@/g,
      'https://[CREDENTIALS]@'
    );
  },
};

// Export for use in service worker
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PIIScrubber;
}

// Make available globally if needed
window.PIIScrubber = PIIScrubber;
