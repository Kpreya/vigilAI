// VigilAI Web SDK for demonstration purposes
class VigilWebSDK {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    captureException(error: Error, context: any) {
        console.log(`[VigilAI SDK] Intercepted Exception: ${error.message}`);

        // In a real SDK, this would POST to the /api/events endpoint
        fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey
            },
            body: JSON.stringify({
                type: 'error',
                message: error.message,
                stack: error.stack,
                context: context,
                timestamp: new Date().toISOString()
            })
        }).catch(e => console.error("VigilAI SDK Background sync failed:", e));
    }
}

// Initialize with the demo API Key
const vigilApp = new VigilWebSDK('vgl_0342b18df8f494ce517f357789c5693299f8df8ce3afd7990071a8dd0f7066a3');
export default vigilApp;
