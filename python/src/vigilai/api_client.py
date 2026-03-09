"""API client for communicating with VigilAI backend"""

import requests
import time
from typing import Any, Dict, List, Optional
from .types import MonitoringData


class DataQueue:
    """Queue for storing data when backend is unavailable"""
    
    def __init__(self, max_size: int = 1000):
        self.queue: List[MonitoringData] = []
        self.max_size = max_size
    
    def enqueue(self, item: MonitoringData) -> None:
        """Add item to queue, dropping oldest if full"""
        if len(self.queue) >= self.max_size:
            # Drop oldest data (FIFO)
            self.queue.pop(0)
        self.queue.append(item)
    
    def dequeue(self) -> Optional[MonitoringData]:
        """Remove and return oldest item from queue"""
        if self.queue:
            return self.queue.pop(0)
        return None
    
    def size(self) -> int:
        """Get current queue size"""
        return len(self.queue)
    
    def is_empty(self) -> bool:
        """Check if queue is empty"""
        return len(self.queue) == 0
    
    def clear(self) -> None:
        """Clear all items from queue"""
        self.queue = []


class APIClient:
    """Client for communicating with VigilAI backend"""

    def __init__(self, api_key: str, base_url: str = "https://api.vigilai.io"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            }
        )
        self.session.timeout = 30
        self.local_queue = DataQueue(max_size=1000)
        self.is_retrying = False

    def validate_api_key(self) -> None:
        """Validate the API key with the backend"""
        try:
            response = self.session.get(f"{self.base_url}/v1/auth/validate")
            if response.status_code != 200:
                raise ValueError("Invalid API key")
        except requests.exceptions.ConnectionError as e:
            raise ConnectionError(
                "Unable to connect to VigilAI backend. Please check your network connection."
            ) from e
        except requests.exceptions.HTTPError as e:
            if e.response and e.response.status_code in (401, 403):
                raise ValueError("Invalid API key: Authentication failed") from e
            raise ValueError(f"API key validation failed: {str(e)}") from e
        except Exception as e:
            raise ValueError(f"API key validation failed: {str(e)}") from e

    def send_data(self, endpoint: str, data: Dict[str, Any]) -> None:
        """Send data to backend with retry logic"""
        self._send_with_retry(endpoint, data)

    def transmit_monitoring_data(self, data: MonitoringData) -> None:
        """Transmit monitoring data with retry logic"""
        try:
            # Convert MonitoringData to dict for JSON serialization
            data_dict = {
                'metrics': [
                    {
                        'name': m.name,
                        'value': m.value,
                        'timestamp': m.timestamp,
                        'tags': m.tags
                    } for m in data.metrics
                ],
                'errors': [
                    {
                        'message': e.message,
                        'stack': e.stack,
                        'timestamp': e.timestamp,
                        'context': e.context
                    } for e in data.errors
                ]
            }
            
            self._send_with_retry('/v1/monitoring/data', data_dict)
            
            # If successful and queue has data, try to flush queue
            if not self.local_queue.is_empty() and not self.is_retrying:
                try:
                    self._flush_queue()
                except Exception:
                    # Ignore queue flush errors - will retry later
                    pass
        except Exception as e:
            # Queue data locally when backend unavailable
            self.local_queue.enqueue(data)
            print(f"Failed to transmit data, queued locally: {str(e)}")

    def _send_with_retry(
        self,
        endpoint: str,
        data: Dict[str, Any],
        max_retries: int = 5
    ) -> None:
        """Send request with exponential backoff retry logic
        
        Retry delays: 1s, 2s, 4s, 8s, 16s, max 32s
        """
        last_error: Optional[Exception] = None
        
        for attempt in range(max_retries + 1):
            try:
                response = self.session.post(f"{self.base_url}{endpoint}", json=data)
                response.raise_for_status()
                return  # Success
            except requests.exceptions.HTTPError as e:
                last_error = e
                # Don't retry on authentication errors
                if e.response and e.response.status_code in (401, 403):
                    raise
                
                # If this was the last attempt, raise
                if attempt == max_retries:
                    raise
                
                # Calculate exponential backoff delay: 1s, 2s, 4s, 8s, 16s, max 32s
                delay = min(1.0 * (2 ** attempt), 32.0)
                time.sleep(delay)
            except Exception as e:
                last_error = e
                
                # If this was the last attempt, raise
                if attempt == max_retries:
                    raise
                
                # Calculate exponential backoff delay
                delay = min(1.0 * (2 ** attempt), 32.0)
                time.sleep(delay)
        
        if last_error:
            raise last_error
        raise Exception("Max retries exceeded")

    def _flush_queue(self) -> None:
        """Flush queued data to backend"""
        if self.is_retrying or self.local_queue.is_empty():
            return
        
        self.is_retrying = True
        
        try:
            while not self.local_queue.is_empty():
                data = self.local_queue.dequeue()
                if data:
                    # Convert MonitoringData to dict
                    data_dict = {
                        'metrics': [
                            {
                                'name': m.name,
                                'value': m.value,
                                'timestamp': m.timestamp,
                                'tags': m.tags
                            } for m in data.metrics
                        ],
                        'errors': [
                            {
                                'message': e.message,
                                'stack': e.stack,
                                'timestamp': e.timestamp,
                                'context': e.context
                            } for e in data.errors
                        ]
                    }
                    self._send_with_retry('/v1/monitoring/data', data_dict)
        finally:
            self.is_retrying = False

    def get_queue_size(self) -> int:
        """Get queue size for monitoring"""
        return self.local_queue.size()
