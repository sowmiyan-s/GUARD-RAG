"""
GuardRAG — PII Redactor Test Suite
"""

import unittest
from guardrag.utils.redactor import redact_text

class TestPIIRedactor(unittest.TestCase):

    def test_email_redaction(self):
        text = "Contact me at john.doe@example.com for details."
        redacted = redact_text(text)
        self.assertNotIn("john.doe@example.com", redacted)
        self.assertIn("[EMAIL_REDACTED]", redacted)

    def test_phone_redaction(self):
        text = "My phone number is 123-456-7890 or +1 (555) 019-2834."
        redacted = redact_text(text)
        self.assertNotIn("123-456-7890", redacted)
        self.assertNotIn("555", redacted)
        self.assertIn("[PHONE_REDACTED]", redacted)

    def test_ssn_redaction(self):
        text = "Social security code: 000-12-3456."
        redacted = redact_text(text)
        self.assertNotIn("000-12-3456", redacted)
        self.assertIn("[SSN_REDACTED]", redacted)

    def test_credit_card_redaction(self):
        text = "Visa card: 1111-2222-3333-4444."
        redacted = redact_text(text)
        self.assertNotIn("1111-2222-3333-4444", redacted)
        self.assertIn("[CREDIT_CARD_REDACTED]", redacted)

    def test_credential_redaction(self):
        text = "Secret key: sk-abcdefghijklmnopqrstuvwxyz0123456789ABCDabcd."
        redacted = redact_text(text)
        self.assertNotIn("sk-abcdef", redacted)
        self.assertIn("[CREDENTIAL_REDACTED]", redacted)

    def test_name_redaction_enabled(self):
        text = "Mr. John Smith visited Dr. Alice last Tuesday. John went to the market."
        redacted = redact_text(text, redact_names=True)
        self.assertNotIn("John Smith", redacted)
        self.assertNotIn("Alice", redacted)
        self.assertIn("[NAME_REDACTED]", redacted)

    def test_name_redaction_disabled(self):
        text = "John Smith visited Dr. Alice last Tuesday."
        # If redact_names is False, names should be preserved but other PII (e.g. emails) redacted
        redacted = redact_text(text + " Email: test@example.com", redact_names=False)
        self.assertIn("John Smith", redacted)
        self.assertIn("Dr. Alice", redacted)
        self.assertIn("[EMAIL_REDACTED]", redacted)

if __name__ == "__main__":
    unittest.main()
