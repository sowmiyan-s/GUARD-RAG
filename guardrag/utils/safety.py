"""
Safety and content filtering system for the RAG bot.
Implements tiered data sensitivity levels and guardrails.
"""

from typing import Optional

JAILBREAK_PATTERNS = [
    "ignore previous", "forget your instructions", "ignore all prior",
    "jailbreak", "dan mode", "pretend you are", "act as if you are",
    "you are now", "disregard your", "override your",
]

import json
from pathlib import Path

DEFAULT_SENSITIVITY_PROFILES = {
    "Public": {
        "description": "No data classification restrictions. Basic jailbreak protection only.",
        "input_patterns": [],
        "output_patterns": [],
        "badge": "public",
    },
    "Internal": {
        "description": "Suitable for internal business data. Blocks credential and API key exposure.",
        "input_patterns": [
            "api key", "api_key", "password", "secret key", "access token",
            "private key", "credential"
        ],
        "output_patterns": [
            "api_key", "api key", "password", "access_token", "credential",
            "private_key", "bearer token"
        ],
        "badge": "internal",
    },
    "Confidential": {
        "description": "For confidential data. Adds PII protection.",
        "input_patterns": [
            "api key", "api_key", "password", "secret key", "access token",
            "private key", "credential", "social security", "ssn",
            "date of birth", "home address", "phone number", "email address",
            "credit card", "bank account",
        ],
        "output_patterns": [
            "api_key", "api key", "password", "access_token", "credential",
            "private_key", "bearer token", "ssn", "social security",
            "date of birth", "credit card", "bank account",
        ],
        "badge": "confidential",
    },
    "Restricted": {
        "description": "Maximum protection. For highly sensitive or regulated data (HIPAA, GDPR, financial).",
        "input_patterns": [
            "api key", "api_key", "password", "secret key", "access token",
            "private key", "credential", "social security", "ssn",
            "date of birth", "home address", "phone number", "email address",
            "credit card", "bank account", "medical record", "diagnosis",
            "prescription", "patient", "salary", "tax return",
            "financial statement", "trading", "investment",
        ],
        "output_patterns": [
            "api_key", "api key", "password", "access_token", "credential",
            "private_key", "bearer token", "ssn", "social security",
            "date of birth", "credit card", "bank account", "medical record",
            "diagnosis", "prescription", "patient id", "salary", "tax", "financial",
        ],
        "badge": "restricted",
    },
}

def load_policies() -> dict:
    storage_path = Path(".guardrag_storage")
    policies_path = storage_path / "policies.json"
    if policies_path.exists():
        try:
            return json.loads(policies_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return DEFAULT_SENSITIVITY_PROFILES

def save_policies(policies: dict) -> None:
    storage_path = Path(".guardrag_storage")
    storage_path.mkdir(exist_ok=True)
    policies_path = storage_path / "policies.json"
    policies_path.write_text(json.dumps(policies, indent=2, ensure_ascii=False), encoding="utf-8")

class DynamicSensitivityProfiles(dict):
    def __getitem__(self, key):
        return load_policies()[key]

    def get(self, key, default=None):
        return load_policies().get(key, default)

    def items(self):
        return load_policies().items()

    def keys(self):
        return load_policies().keys()

    def values(self):
        return load_policies().values()

    def __contains__(self, key):
        return key in load_policies()

    def __repr__(self):
        return repr(load_policies())

SENSITIVITY_PROFILES = DynamicSensitivityProfiles()


def _matches_pattern(text: str, pattern: str) -> bool:
    """Helper to check if a pattern matches the text with word boundaries if it's a single word."""
    import re
    pattern_clean = pattern.strip().lower()
    text_clean = text.lower()
    if not pattern_clean:
        return False
    
    # If the pattern is a single alphabetic word, check with word boundaries and optional plural 's'
    if re.match(r'^[a-z]+$', pattern_clean):
        regex = re.compile(r'\b' + re.escape(pattern_clean) + r's?\b')
        return bool(regex.search(text_clean))
    else:
        # Fallback to substring matching for phrases or patterns with symbols
        return pattern_clean in text_clean


def check_input_safety(
    user_input: str,
    sensitivity: str,
    enabled: bool = True,
    custom_rules: list[str] = None
) -> Optional[str]:
    """
    Check user input against jailbreak and sensitivity-level patterns.
    
    Args:
        user_input: The user's input text
        sensitivity: Sensitivity level (Public, Internal, Confidential, Restricted)
        enabled: Whether to enforce guardrails
        custom_rules: List of custom blocked patterns
        
    Returns:
        Error message if blocked, None otherwise
    """
    if not enabled:
        return None
    
    lower = user_input.lower()
    
    # Check jailbreak patterns (always active)
    for pat in JAILBREAK_PATTERNS:
        if pat in lower:
            return "This request has been blocked. Prompt injection and instruction-override attempts are not permitted."
    
    # Check custom safety rules
    if custom_rules:
        for pat in custom_rules:
            if _matches_pattern(user_input, pat):
                return f"This request has been blocked under the custom safety policy rules: '{pat}'."
    
    # Check sensitivity-level patterns
    profile = SENSITIVITY_PROFILES.get(sensitivity, SENSITIVITY_PROFILES["Internal"])
    for pat in profile["input_patterns"]:
        if _matches_pattern(user_input, pat):
            return f"This request has been blocked under the active **{sensitivity}** data sensitivity policy."
    
    return None


def check_output_safety(
    response: str,
    sensitivity: str,
    enabled: bool = True,
    custom_rules: list[str] = None
) -> Optional[str]:
    """
    Check LLM output against sensitivity-level patterns.
    
    Args:
        response: The LLM's response text
        sensitivity: Sensitivity level (Public, Internal, Confidential, Restricted)
        enabled: Whether to enforce guardrails
        custom_rules: List of custom blocked patterns
        
    Returns:
        Redaction message if blocked, None otherwise
    """
    if not enabled:
        return None
    
    # Check custom safety rules
    if custom_rules:
        for pat in custom_rules:
            if _matches_pattern(response, pat):
                return f"[REDACTED — Output blocked by custom safety policy rules: '{pat}']"
                
    profile = SENSITIVITY_PROFILES.get(sensitivity, SENSITIVITY_PROFILES["Internal"])
    
    for pat in profile["output_patterns"]:
        if _matches_pattern(response, pat):
            return f"[REDACTED — Output blocked by {sensitivity} data sensitivity policy.]"
    
    return None


def get_sensitivity_profiles() -> dict[str, dict]:
    """Get all available sensitivity profiles with descriptions."""
    return {
        k: {
            "description": v["description"],
            "badge": v["badge"]
        }
        for k, v in SENSITIVITY_PROFILES.items()
    }
