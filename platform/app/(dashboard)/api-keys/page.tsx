import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ApiKeysPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-600 mt-2">
            Manage API keys for your applications
          </p>
        </div>
        <Button>Generate New Key</Button>
      </div>

      <Card className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">🔑</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No API keys yet
          </h3>
          <p className="text-gray-600 mb-4">
            Generate an API key to start sending data from your applications.
          </p>
          <Button>Generate Your First API Key</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          How to use API Keys
        </h3>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            1. Generate an API key for each application you want to monitor
          </p>
          <p>
            2. Install the VigilAI SDK in your application
          </p>
          <p>
            3. Configure the SDK with your API key
          </p>
          <p>
            4. Start monitoring errors and performance metrics automatically
          </p>
        </div>
      </Card>
    </div>
  );
}
