"""Monitoring agent for collecting metrics and errors"""

import os
import time
import psutil
import threading
import traceback
import random
from typing import Optional, Dict, Any, List
from .types import Metric, ErrorEvent, MonitoringData, VigilAIConfig
from .api_client import APIClient
from .redactor import Redactor


class CircularBuffer:
    """Circular buffer for storing data with fixed capacity"""
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.buffer: List[Any] = []
        self.head = 0
        self.size = 0
    
    def push(self, item: Any) -> None:
        """Add item to buffer, overwriting oldest if full"""
        if self.size < self.capacity:
            self.buffer.append(item)
            self.size += 1
        else:
            self.buffer[self.head] = item
        self.head = (self.head + 1) % self.capacity
    
    def get_all(self) -> List[Any]:
        """Get all items in chronological order"""
        if self.size < self.capacity:
            return self.buffer[:self.size]
        # Return items in order: from head to end, then from start to head
        return self.buffer[self.head:] + self.buffer[:self.head]
    
    def clear(self) -> None:
        """Clear all items from buffer"""
        self.buffer = []
        self.head = 0
        self.size = 0
    
    def get_size(self) -> int:
        """Get current number of items in buffer"""
        return self.size
    
    def is_full(self) -> bool:
        """Check if buffer is at capacity"""
        return self.size >= self.capacity


class MonitoringAgent:
    """Monitoring agent responsible for collecting metrics and errors"""
    
    def __init__(self, config: VigilAIConfig, api_client: APIClient):
        self.config = config
        self.api_client = api_client
        self.redactor = Redactor(
            config.security.redaction_rules,
            config.security.enable_pii_redaction
        )
        self.metrics_buffer = CircularBuffer(config.monitoring.buffer_size)
        self.errors_buffer = CircularBuffer(config.monitoring.buffer_size)
        self.monitoring_thread: Optional[threading.Thread] = None
        self.flush_thread: Optional[threading.Thread] = None
        self.monitoring_active = False
        self.last_flush_time = time.time()
        self.request_count = 0
        self.last_request_count = 0
        self.last_throughput_check = time.time()
        self.process = psutil.Process(os.getpid())
        self.transmission_attempts = 0
        self.transmission_successes = 0
        self.transmission_failures = 0
        self.last_transmission_error: Optional[str] = None
        self.last_transmission_success: Optional[int] = None
    
    def start_monitoring(self) -> None:
        """Start monitoring system metrics"""
        if self.monitoring_active:
            return  # Already monitoring
        
        self.monitoring_active = True
        
        # Collect metrics immediately on start
        self.collect_system_metrics()
        
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitoring_thread.start()
        
        # Start flush thread to check for time-based flushes
        self.flush_thread = threading.Thread(target=self._flush_loop, daemon=True)
        self.flush_thread.start()
    
    def stop_monitoring(self) -> None:
        """Stop monitoring"""
        self.monitoring_active = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=2.0)
            self.monitoring_thread = None
        if self.flush_thread:
            self.flush_thread.join(timeout=2.0)
            self.flush_thread = None
    
    def _monitoring_loop(self) -> None:
        """Background loop for collecting system metrics"""
        interval_seconds = self.config.monitoring.interval / 1000.0
        
        while self.monitoring_active:
            self.collect_system_metrics()
            time.sleep(interval_seconds)
    
    def _flush_loop(self) -> None:
        """Background loop for checking flush conditions"""
        interval_seconds = self.config.monitoring.interval / 1000.0
        
        while self.monitoring_active:
            if self.should_flush():
                try:
                    self.transmit_data()
                except Exception as e:
                    # Log error but don't throw - monitoring should continue
                    print(f"Failed to transmit data: {str(e)}")
            time.sleep(interval_seconds)
    
    def capture_request(
        self,
        endpoint: str,
        method: str,
        status_code: int,
        duration: float
    ) -> None:
        """Capture HTTP request metrics"""
        self.request_count += 1
        
        # Apply sampling rate
        if random.random() > self.config.monitoring.sampling_rate:
            return
        
        timestamp = int(time.time() * 1000)
        
        # Capture response time metric
        self.metrics_buffer.push(Metric(
            name='http.response_time',
            value=duration,
            timestamp=timestamp,
            tags={
                'endpoint': endpoint,
                'method': method,
                'status': str(status_code),
            }
        ))
        
        # Capture status code metric
        self.metrics_buffer.push(Metric(
            name='http.status',
            value=float(status_code),
            timestamp=timestamp,
            tags={
                'endpoint': endpoint,
                'method': method,
            }
        ))
        
        # Check if buffer should be flushed due to capacity
        if self.should_flush():
            try:
                self.transmit_data()
            except Exception as e:
                print(f"Failed to transmit data: {str(e)}")
    
    def capture_error(self, error: Exception, context: Optional[Dict[str, Any]] = None) -> None:
        """Capture error with stack trace"""
        error_event = ErrorEvent(
            message=str(error),
            stack=traceback.format_exc(),
            timestamp=int(time.time() * 1000),
            context=context
        )
        
        self.errors_buffer.push(error_event)
        
        # Check if buffer should be flushed due to capacity
        if self.should_flush():
            try:
                self.transmit_data()
            except Exception as e:
                print(f"Failed to transmit data: {str(e)}")
    
    def collect_system_metrics(self) -> None:
        """Collect system metrics (CPU, memory, throughput)"""
        timestamp = int(time.time() * 1000)
        
        # Memory usage
        memory_info = self.process.memory_info()
        self.metrics_buffer.push(Metric(
            name='system.memory.rss',
            value=round(memory_info.rss / 1024 / 1024, 2),  # Convert to MB
            timestamp=timestamp
        ))
        
        # CPU usage (percentage)
        try:
            cpu_percent = self.process.cpu_percent(interval=0.1)
            self.metrics_buffer.push(Metric(
                name='system.cpu.usage',
                value=round(cpu_percent, 2),
                timestamp=timestamp
            ))
        except Exception:
            # cpu_percent can fail on first call, ignore
            pass
        
        # Request throughput (requests per second)
        now = time.time()
        time_diff = now - self.last_throughput_check
        if time_diff > 0:
            throughput = (self.request_count - self.last_request_count) / time_diff
            self.metrics_buffer.push(Metric(
                name='http.throughput',
                value=round(throughput, 2),
                timestamp=timestamp
            ))
            
            self.last_request_count = self.request_count
            self.last_throughput_check = now
    
    def get_buffered_data(self) -> MonitoringData:
        """Get all buffered data, filtering out data older than retention period"""
        now = int(time.time() * 1000)
        retention_cutoff = now - self.config.security.data_retention_period
        
        all_metrics = self.metrics_buffer.get_all()
        all_errors = self.errors_buffer.get_all()
        
        return MonitoringData(
            metrics=[m for m in all_metrics if m.timestamp >= retention_cutoff],
            errors=[e for e in all_errors if e.timestamp >= retention_cutoff]
        )
    
    def clear_buffer(self) -> None:
        """Clear all buffered data"""
        self.metrics_buffer.clear()
        self.errors_buffer.clear()
        self.last_flush_time = time.time()
    
    def should_flush(self) -> bool:
        """Check if buffer should be flushed"""
        time_since_flush = (time.time() - self.last_flush_time) * 1000  # Convert to ms
        time_threshold = self.config.monitoring.interval
        
        return (
            self.metrics_buffer.is_full() or
            self.errors_buffer.is_full() or
            time_since_flush >= time_threshold
        )
    
    def transmit_data(self) -> None:
        """Transmit buffered data to backend in batches"""
        data = self.get_buffered_data()
        
        # Only transmit if there's data
        if len(data.metrics) == 0 and len(data.errors) == 0:
            return
        
        # Batch size limit (up to 100 events per transmission)
        BATCH_SIZE = 100
        total_events = len(data.metrics) + len(data.errors)
        
        if total_events <= BATCH_SIZE:
            # Single batch transmission
            self._transmit_batch(data)
        else:
            # Multiple batch transmissions
            metrics_offset = 0
            errors_offset = 0
            
            while metrics_offset < len(data.metrics) or errors_offset < len(data.errors):
                metrics_in_batch = min(BATCH_SIZE, len(data.metrics) - metrics_offset)
                remaining_space = BATCH_SIZE - metrics_in_batch
                errors_in_batch = min(remaining_space, len(data.errors) - errors_offset)
                
                batch = MonitoringData(
                    metrics=data.metrics[metrics_offset:metrics_offset + metrics_in_batch],
                    errors=data.errors[errors_offset:errors_offset + errors_in_batch]
                )
                
                self._transmit_batch(batch)
                
                metrics_offset += metrics_in_batch
                errors_offset += errors_in_batch
        
        # Clear buffer after all batches transmitted successfully
        self.clear_buffer()
    
    def _transmit_batch(self, data: MonitoringData) -> None:
        """Transmit a single batch of data"""
        self.transmission_attempts += 1
        
        try:
            # Apply redaction before transmission
            redacted_data = MonitoringData(
                metrics=self.redactor.redact_metrics([
                    {
                        'name': m.name,
                        'value': m.value,
                        'timestamp': m.timestamp,
                        'tags': m.tags
                    } for m in data.metrics
                ]),
                errors=self.redactor.redact_errors([
                    {
                        'message': e.message,
                        'stack': e.stack,
                        'timestamp': e.timestamp,
                        'context': e.context
                    } for e in data.errors
                ])
            )
            
            self.api_client.transmit_monitoring_data(redacted_data)
            self.transmission_successes += 1
            self.last_transmission_success = int(time.time() * 1000)
        except Exception as e:
            self.transmission_failures += 1
            self.last_transmission_error = str(e)
            raise
    
    def get_buffer_stats(self) -> Dict[str, int]:
        """Get buffer statistics"""
        return {
            'metrics_count': self.metrics_buffer.get_size(),
            'errors_count': self.errors_buffer.get_size(),
        }
    
    def is_monitoring(self) -> bool:
        """Check if monitoring is active"""
        return self.monitoring_active
    
    def get_transmission_stats(self) -> Dict[str, Any]:
        """Get transmission statistics"""
        success_rate = (
            self.transmission_successes / self.transmission_attempts
            if self.transmission_attempts > 0
            else 1.0
        )
        
        stats = {
            'attempts': self.transmission_attempts,
            'successes': self.transmission_successes,
            'failures': self.transmission_failures,
            'success_rate': success_rate,
        }
        
        if self.last_transmission_error:
            stats['last_error'] = self.last_transmission_error
        if self.last_transmission_success:
            stats['last_success'] = self.last_transmission_success
        
        return stats
