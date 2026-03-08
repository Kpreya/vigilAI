"""AI Diagnostician for analyzing incidents and determining root causes"""

import json
import os
import time
import boto3
from typing import Optional, Dict, Any, Literal
from dataclasses import dataclass
from .types import Incident


# Type aliases
DiagnosisCategory = Literal[
    'performance',
    'memory_leak',
    'logic_error',
    'resource_exhaustion',
    'configuration',
    'dependency',
    'unknown'
]


@dataclass
class CodeLocation:
    """Code location information"""
    file: str
    line: Optional[int] = None
    function: Optional[str] = None


@dataclass
class Diagnosis:
    """Diagnosis result from AI analysis"""
    incident_id: str
    root_cause: str
    explanation: str
    category: DiagnosisCategory
    confidence: float  # 0-1
    timestamp: int
    code_location: Optional[CodeLocation] = None
    suggested_fix: Optional[str] = None


class AIDiagnostician:
    """AI Diagnostician class for root cause analysis using Amazon Bedrock"""
    
    DEFAULT_TIMEOUT = 30  # 30 seconds
    DEFAULT_MODEL = 'anthropic.claude-3-sonnet-20240229-v1:0'
    
    def __init__(
        self,
        api_key: Optional[str] = None,  # Kept for backward compatibility but not used
        api_endpoint: Optional[str] = None,  # Kept for backward compatibility but not used
        timeout: Optional[int] = None,
        model: Optional[str] = None
    ):
        self.timeout = timeout or self.DEFAULT_TIMEOUT
        self.model = model or self.DEFAULT_MODEL
        
        # Initialize Bedrock client with credentials from environment
        self.client = boto3.client(
            'bedrock-runtime',
            region_name=os.getenv('AWS_REGION', 'us-east-1'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
    
    def diagnose(self, incident: Incident) -> Diagnosis:
        """Diagnose an incident using Amazon Bedrock AI"""
        try:
            # Build the diagnosis prompt
            prompt = self._build_diagnosis_prompt(incident)
            
            # Call Bedrock API
            response = self.client.invoke_model(
                modelId=self.model,
                body=json.dumps({
                    'anthropic_version': 'bedrock-2023-05-31',
                    'max_tokens': 2000,
                    'messages': [{
                        'role': 'user',
                        'content': prompt
                    }],
                    'temperature': 0.3  # Lower temperature for more focused responses
                })
            )
            
            # Parse the response
            response_body = json.loads(response['body'].read())
            diagnosis = self._parse_diagnosis_response(incident.id, response_body)
            return diagnosis
            
        except Exception as e:
            # Log error but don't block incident creation
            print(f"Bedrock AI diagnosis failed: {str(e)}")
            return self._create_generic_diagnosis(incident)
    
    def _build_diagnosis_prompt(self, incident: Incident) -> str:
        """Build diagnosis prompt from incident data for Bedrock"""
        parts = [
            'You are an expert software diagnostician. Analyze the incident data and provide a structured diagnosis.',
            '',
            '# Incident Analysis Request',
            '',
            '## Incident Details',
            f'- ID: {incident.id}',
            f'- Type: {incident.type}',
            f'- Severity: {incident.severity}',
            f'- Timestamp: {incident.timestamp}',
            '',
        ]
        
        # Add metrics information
        if incident.metrics:
            parts.append('## Metrics')
            for metric in incident.metrics[:10]:
                tags_str = f' ({json.dumps(metric.tags)})' if metric.tags else ''
                parts.append(f'- {metric.name}: {metric.value}{tags_str}')
            parts.append('')
        
        # Add error information
        if incident.errors:
            parts.append('## Errors')
            for error in incident.errors[:3]:
                parts.append(f'### Error: {error.message}')
                parts.append('```')
                parts.append('\n'.join(error.stack.split('\n')[:10]))
                parts.append('```')
                parts.append('')
        
        # Add context information
        if incident.context:
            parts.append('## Context')
            for key, value in incident.context.items():
                parts.append(f'- {key}: {json.dumps(value)}')
            parts.append('')
        
        parts.extend([
            '## Required Output Format',
            'Provide your diagnosis in the following JSON format:',
            '```json',
            '{',
            '  "rootCause": "Brief description of the root cause",',
            '  "explanation": "Detailed explanation of what is happening",',
            '  "codeLocation": {',
            '    "file": "path/to/file.py",',
            '    "line": 123,',
            '    "function": "function_name"',
            '  },',
            '  "category": "performance|memory_leak|logic_error|resource_exhaustion|configuration|dependency",',
            '  "confidence": 0.85,',
            '  "suggestedFix": "High-level description of how to fix the issue"',
            '}',
            '```',
        ])
        
        return '\n'.join(parts)
    
    def _parse_diagnosis_response(self, incident_id: str, response: Dict[str, Any]) -> Diagnosis:
        """Parse Bedrock AI response into Diagnosis object"""
        try:
            # Extract content from Bedrock response
            content = response.get('content', [{}])[0].get('text', '')
            
            # Try to extract JSON from the response
            import re
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', content) or \
                        re.search(r'\{[\s\S]*\}', content)
            
            if json_match:
                json_str = json_match.group(1) if json_match.lastindex else json_match.group(0)
                parsed = json.loads(json_str)
                
                # Extract code location if present
                code_location = None
                if parsed.get('codeLocation'):
                    loc = parsed['codeLocation']
                    code_location = CodeLocation(
                        file=loc.get('file', ''),
                        line=loc.get('line'),
                        function=loc.get('function')
                    )
                
                return Diagnosis(
                    incident_id=incident_id,
                    root_cause=parsed.get('rootCause', 'Unable to determine root cause'),
                    explanation=parsed.get('explanation', 'No detailed explanation available'),
                    code_location=code_location,
                    category=self._validate_category(parsed.get('category', 'unknown')),
                    confidence=max(0, min(1, parsed.get('confidence', 0.5))),
                    suggested_fix=parsed.get('suggestedFix'),
                    timestamp=int(time.time() * 1000)
                )
            
            # If no JSON found, try to extract information from text
            return Diagnosis(
                incident_id=incident_id,
                root_cause=content[:200] if content else 'Unable to determine root cause',
                explanation=content or 'AI response could not be parsed',
                category='unknown',
                confidence=0.3,
                timestamp=int(time.time() * 1000)
            )
            
        except Exception as e:
            print(f"Failed to parse Bedrock AI response: {str(e)}")
            return Diagnosis(
                incident_id=incident_id,
                root_cause='Failed to parse AI diagnosis',
                explanation='The AI response could not be parsed into a structured diagnosis',
                category='unknown',
                confidence=0,
                timestamp=int(time.time() * 1000)
            )
    
    def _validate_category(self, category: str) -> DiagnosisCategory:
        """Validate and normalize category"""
        valid_categories = [
            'performance',
            'memory_leak',
            'logic_error',
            'resource_exhaustion',
            'configuration',
            'dependency',
        ]
        
        if category in valid_categories:
            return category  # type: ignore
        
        return 'unknown'
    
    def _create_generic_diagnosis(self, incident: Incident) -> Diagnosis:
        """Create a generic diagnosis when AI fails"""
        root_cause = 'Unable to determine root cause'
        category: DiagnosisCategory = 'unknown'
        explanation = 'AI diagnosis service unavailable. Manual investigation required.'
        
        # Provide basic categorization based on incident type
        if incident.type == 'performance':
            category = 'performance'
            root_cause = 'Performance degradation detected'
            explanation = 'The application is experiencing performance issues. Check response times and resource usage.'
        elif incident.type == 'error':
            category = 'logic_error'
            root_cause = 'Error rate exceeded threshold'
            explanation = 'Multiple errors detected. Review error logs and stack traces for details.'
        elif incident.type == 'resource':
            category = 'resource_exhaustion'
            root_cause = 'Resource usage exceeded threshold'
            explanation = 'System resources (CPU/memory) are being exhausted. Check for memory leaks or inefficient code.'
        
        return Diagnosis(
            incident_id=incident.id,
            root_cause=root_cause,
            explanation=explanation,
            category=category,
            confidence=0,
            timestamp=int(time.time() * 1000)
        )

# Add missing import
import time
