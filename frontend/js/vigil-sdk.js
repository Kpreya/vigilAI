/**
 * VigilAI Lightweight JavaScript SDK
 * In a real-world scenario, this would be an NPM package via CDN.
 */

class VigilSDKClient {
    constructor() {
        this.apiKey = null;
        this.endpoint = null;
        this.environment = 'production';
    }

    init(options) {
        this.apiKey = options.apiKey;
        this.endpoint = options.endpoint || '/api/events';
        this.environment = options.environment || 'production';

        if (!this.apiKey) {
            console.error('VigilSDK: apiKey is required initialized');
            return;
        }

        // Auto-capture global uncaught exceptions
        window.addEventListener('error', (event) => {
            this.captureException(event.error || new Error(event.message));
        });

        // Auto-capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason instanceof Error) {
                this.captureException(event.reason);
            } else {
                this.captureException(new Error(String(event.reason)));
            }
        });

        console.log('VigilSDK: Initialized successfully');
    }

    async captureException(error, context = {}) {
        if (!this.apiKey) {
            console.warn('VigilSDK: Cannot capture exception without apiKey');
            return;
        }

        try {
            const payload = {
                message: error.message || String(error),
                stackTrace: error.stack || null,
                environment: this.environment,
                context: context,
                apiKey: this.apiKey, // Include apiKey in payload
                timestamp: new Date().toISOString()
            };

            await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey
                },
                body: JSON.stringify(payload)
            });

            console.log('VigilSDK: Exception captured and sent', payload.message);
        } catch (e) {
            // Failsafe logging so SDK doesn't break app
            console.error('VigilSDK: Failed to send exception', e);
        }
    }
}

// Expose globally
window.VigilSDK = new VigilSDKClient();
