import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600 mt-2">
            Manage your monitored applications
          </p>
        </div>
        <Button>Add Application</Button>
      </div>

      <Card className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">📱</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No applications yet
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by adding your first application to monitor.
          </p>
          <Button>Create Your First Application</Button>
        </div>
      </Card>
    </div>
  );
}
