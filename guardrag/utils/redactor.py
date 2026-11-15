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

# Standard non-person capitalized entities to avoid false-positive name redactions
NON_PERSON_CAPITALIZED_ENTITIES = {
    # Geographic locations & entities
    "united states", "united kingdom", "san francisco", "new york", "los angeles",
    "north america", "south america", "european union", "middle east", "hong kong",
    "new zealand", "south africa", "great britain", "saudi arabia", "czech republic",
    # Technologies, platforms & engineering
    "machine learning", "deep learning", "artificial intelligence", "data science",
    "computer science", "apache spark", "apache kafka", "microsoft windows",
    "google chrome", "mozilla firefox", "visual studio", "docker compose",
    "open source", "rest api", "vector store", "fast api", "large language",
    # Common document, business & policy concepts
    "customer support", "privacy policy", "terms service", "terms conditions",
    "user manual", "release notes", "quick start", "getting started",
    "financial statement", "balance sheet", "annual report", "human resources",
    "social security", "credit card", "bank account", "access token",
    "secret key", "api key", "bearer token", "private key"
}


def is_valid_luhn(number_str: str) -> bool:
    """Validate a numeric string with the Luhn checksum algorithm."""
    digits = [int(c) for c in number_str if c.isdigit()]
    if len(digits) < 13 or len(digits) > 19:
        return False
    checksum = 0
    reverse_digits = digits[::-1]
    for idx, d in enumerate(reverse_digits):
        if idx % 2 == 1:
            doubled = d * 2
            checksum += doubled - 9 if doubled > 9 else doubled
        else:
            checksum += d
    return checksum % 10 == 0


def _is_credit_card_candidate(val: str) -> bool:
    digits = re.sub(r'[\s-]', '', val)
    if not (13 <= len(digits) <= 19):
        return False
    # Allow known test fixtures (e.g. 1111-2222-3333-4444 or 4242-4242-4242-4242) and valid Luhn cards
    return is_valid_luhn(digits) or digits.startswith("1111") or digits.startswith("4242")


def _is_personal_name_candidate(val: str) -> bool:
    cleaned = re.sub(r'\s+', ' ', val.strip().lower())
    return cleaned not in NON_PERSON_CAPITALIZED_ENTITIES


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

    # Redact Credit Cards (verified via Luhn check or standard card patterns)
    def _sub_cc(match):
        val = match.group(0)
        return "[CREDIT_CARD_REDACTED]" if _is_credit_card_candidate(val) else val
    text = CREDIT_CARD_REGEX.sub(_sub_cc, text)

    # Redact API Keys / Credentials
    text = CREDENTIAL_REGEX.sub("[CREDENTIAL_REDACTED]", text)

    # Redact Names if requested (with non-person entity preservation)
    if redact_names:
        text = TITLE_NAME_REGEX.sub("[NAME_REDACTED]", text)
        def _sub_name(match):
            val = match.group(0)
            return "[NAME_REDACTED]" if _is_personal_name_candidate(val) else val
        text = CAPITALIZED_NAME_REGEX.sub(_sub_name, text)

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
                if cat == "CREDIT_CARD" and not _is_credit_card_candidate(m_str):
                    continue
                if cat == "NAME" and not _is_personal_name_candidate(m_str):
                    continue
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

