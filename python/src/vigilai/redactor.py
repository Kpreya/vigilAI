"""Data redaction engine for sensitive information"""

import re
from typing import Any, Dict, List, Optional, Union


class RedactionRule:
    """A redaction rule with pattern and replacement"""
    
    def __init__(self, pattern: str, replacement: str = '[REDACTED]'):
        self.pattern = re.compile(pattern)
        self.replacement = replacement


# Default PII redaction patterns
DEFAULT_PII_PATTERNS = [
    # Email addresses
    RedactionRule(
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        '[EMAIL_REDACTED]'
    ),
    
    # Credit card numbers (various formats)
    RedactionRule(
        r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',
        '[CARD_REDACTED]'
    ),
    
    # Social Security Numbers (US)
    RedactionRule(
        r'\b\d{3}-\d{2}-\d{4}\b',
        '[SSN_REDACTED]'
    ),
    
    # Phone numbers (various formats)
    RedactionRule(
        r'\b(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b',
        '[PHONE_REDACTED]'
    ),
    
    # IP addresses
    RedactionRule(
        r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',
        '[IP_REDACTED]'
    ),
    
    # API keys and tokens (common patterns)
    RedactionRule(
        r'\b[A-Za-z0-9_-]{32,}\b',
        '[TOKEN_REDACTED]'
    ),
    
    # Bearer tokens
    RedactionRule(
        r'Bearer\s+[A-Za-z0-9_-]+',
        'Bearer [TOKEN_REDACTED]'
    ),
    
    # Authorization headers
    RedactionRule(
        r'Authorization:\s*[^\s]+',
        'Authorization: [REDACTED]'
    ),
]

# Sensitive field names that should always be redacted
SENSITIVE_FIELD_NAMES = [
    'password',
    'passwd',
    'pwd',
    'secret',
    'token',
    'api_key',
    'apikey',
    'api-key',
    'auth',
    'authorization',
    'credential',
    'private_key',
    'privatekey',
    'access_token',
    'refresh_token',
    'session_id',
    'sessionid',
]


class Redactor:
    """Redacts sensitive information from data"""
    
    def __init__(
        self,
        custom_rules: Optional[List[str]] = None,
        enable_pii_redaction: bool = True
    ):
        self.enable_pii_redaction = enable_pii_redaction
        
        # Compile custom rules
        compiled_custom_rules = [
            RedactionRule(pattern) for pattern in (custom_rules or [])
        ]
        
        # Combine default PII patterns with custom rules
        self.rules = (
            DEFAULT_PII_PATTERNS + compiled_custom_rules
            if enable_pii_redaction
            else compiled_custom_rules
        )
    
    def redact_string(self, text: str) -> str:
        """Redact sensitive information from a string"""
        if not text:
            return text
        
        redacted = text
        for rule in self.rules:
            redacted = rule.pattern.sub(rule.replacement, redacted)
        
        return redacted
    
    def redact_object(self, obj: Any) -> Any:
        """Redact sensitive information from an object"""
        if obj is None:
            return obj
        
        if isinstance(obj, str):
            return self.redact_string(obj)
        
        if isinstance(obj, (int, float, bool)):
            return obj
        
        if isinstance(obj, list):
            return [self.redact_object(item) for item in obj]
        
        if isinstance(obj, dict):
            redacted = {}
            
            for key, value in obj.items():
                # Check if field name is sensitive
                lower_key = key.lower()
                is_sensitive_field = any(
                    sensitive_key in lower_key
                    for sensitive_key in SENSITIVE_FIELD_NAMES
                )
                
                if is_sensitive_field:
                    redacted[key] = '[REDACTED]'
                else:
                    redacted[key] = self.redact_object(value)
            
            return redacted
        
        return obj
    
    def redact_metrics(self, metrics: List[Any]) -> List[Any]:
        """Redact sensitive information from metrics"""
        return [self.redact_object(metric) for metric in metrics]
    
    def redact_errors(self, errors: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Redact sensitive information from error events"""
        return [
            {
                **error,
                'message': self.redact_string(error.get('message', '')),
                'stack': self.redact_string(error.get('stack', '')),
                'context': (
                    self.redact_object(error['context'])
                    if error.get('context')
                    else None
                ),
            }
            for error in errors
        ]
