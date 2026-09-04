"""
PII detection and redaction utility for GuardRAG.
Runs offline to replace sensitive patterns before indexing or retrieval.
"""

import re

# Email regex
EMAIL_REGEX = re.compile(
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
)

# Phone number regex (various international and local formats)
PHONE_REGEX = re.compile(
    r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'
)

# Social Security Number (SSN) regex
SSN_REGEX = re.compile(
    r'\b\d{3}-\d{2}-\d{4}\b'
)

# Credit Card regex (13 to 16 digits, with potential spaces/dashes)
CREDIT_CARD_REGEX = re.compile(
    r'\b(?:\d[ -]*?){13,16}\b'
)

# Common credential/API key formats (e.g. OpenAI keys, GitHub tokens, Google API keys, key assignments)
CREDENTIAL_REGEX = re.compile(
    r'\b(?:sk-[a-zA-Z0-9]{20,64}|AIzaSy[a-zA-Z0-9-_]{32,48}|ghp_[a-zA-Z0-9]{36}|xox[baprs]-[a-zA-Z0-9-]{10,48}|(?:api[-_]?key|client[-_]?secret|bearer[-_]?token)\s*[:=]\s*[\'"]?[a-zA-Z0-9_\-]{8,}[\'"]?)\b',
    re.IGNORECASE
)

# Regex to identify common name titles + capitalized names
TITLE_NAME_REGEX = re.compile(
    r'\b(?:Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.)\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?\b'
)

# General pattern for capitalized names (e.g., John Smith, Alice Brown)
# Matches two consecutive title-case words, ignoring sentence-starting capitalization when possible
# by avoiding matching if preceded by a sentence terminal (period, exclamation, question mark) plus space.
CAPITALIZED_NAME_REGEX = re.compile(
    r'(?<![.!?]\s)\b[A-Z][a-z]+\s+[A-Z][a-zA-Z]*(?=\s|\b)'
)

def redact_text(text: str, redact_names: bool = True) -> str:
    """
    Scan text and replace sensitive info with redacted placeholders.
    """
    if not text:
        return ""

    # Redact Emails
    text = EMAIL_REGEX.sub("[EMAIL_REDACTED]", text)

    # Redact Phones
    text = PHONE_REGEX.sub("[PHONE_REDACTED]", text)

    # Redact SSNs
    text = SSN_REGEX.sub("[SSN_REDACTED]", text)

    # Redact Credit Cards
    text = CREDIT_CARD_REGEX.sub("[CREDIT_CARD_REDACTED]", text)

    # Redact API Keys / Credentials
    text = CREDENTIAL_REGEX.sub("[CREDENTIAL_REDACTED]", text)

    # Redact Names if requested
    if redact_names:
        text = TITLE_NAME_REGEX.sub("[NAME_REDACTED]", text)
        text = CAPITALIZED_NAME_REGEX.sub("[NAME_REDACTED]", text)

    return text

def redact_and_map(text: str, redact_names: bool = True, existing_map: dict = None) -> tuple[str, dict]:
    """
    Redact PII from text, mapping sensitive strings to numbered placeholder tokens.
    Returns (redacted_text, mapping_dict) where mapping_dict maps token -> original_value.
    """
    if not text:
        return "", {}

    mapping = existing_map.copy() if existing_map else {}

    # Helper to get reverse mapping (original_value -> token)
    reverse_map = {v: k for k, v in mapping.items()}

    # Helper to count placeholders
    counts = {
        "EMAIL": sum(1 for k in mapping if k.startswith("[EMAIL_")),
        "PHONE": sum(1 for k in mapping if k.startswith("[PHONE_")),
        "SSN": sum(1 for k in mapping if k.startswith("[SSN_")),
        "CREDIT_CARD": sum(1 for k in mapping if k.startswith("[CREDIT_CARD_")),
        "CREDENTIAL": sum(1 for k in mapping if k.startswith("[CREDENTIAL_")),
        "NAME": sum(1 for k in mapping if k.startswith("[NAME_")),
    }

    def get_token(val: str, category: str) -> str:
        if val in reverse_map:
            return reverse_map[val]
        counts[category] += 1
        tok = f"[{category}_{counts[category]}]"
        mapping[tok] = val
        reverse_map[val] = tok
        return tok

    categories = [
        ("EMAIL", EMAIL_REGEX),
        ("PHONE", PHONE_REGEX),
        ("SSN", SSN_REGEX),
        ("CREDIT_CARD", CREDIT_CARD_REGEX),
        ("CREDENTIAL", CREDENTIAL_REGEX),
    ]

    if redact_names:
        categories.extend([
            ("NAME", TITLE_NAME_REGEX),
            ("NAME", CAPITALIZED_NAME_REGEX)
        ])

    for cat, regex in categories:
        matches = regex.findall(text)
        # Normalize and filter matches
        normalized_matches = []
        for match in matches:
            if isinstance(match, tuple):
                match = match[0]
            m_str = str(match).strip()
            if len(m_str) >= 3:
                normalized_matches.append(m_str)
        
        # Unique list, sorted by length descending
        unique_matches = sorted(list(set(normalized_matches)), key=len, reverse=True)
        for val in unique_matches:
            tok = get_token(val, cat)
            text = text.replace(val, tok)

    return text, mapping

def rehydrate_text(text: str, mapping: dict) -> str:
    """
    Replace placeholder tokens back with their original values in the output text.
    """
    if not text or not mapping:
        return text
    # Sort tokens by length descending to avoid partial replacement issues (e.g. [NAME_10] vs [NAME_1])
    for tok in sorted(mapping.keys(), key=len, reverse=True):
        text = text.replace(tok, mapping[tok])
    return text

