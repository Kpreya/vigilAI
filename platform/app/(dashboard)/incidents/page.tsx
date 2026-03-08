import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function IncidentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Incidents</h1>
        <p className="text-gray-600 mt-2">
          Monitor and manage application incidents
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Open Incidents</div>
          <div className="text-2xl font-bold mt-1">0</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Critical</div>
          <div className="text-2xl font-bold mt-1 text-red-600">0</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">In Progress</div>
          <div className="text-2xl font-bold mt-1 text-yellow-600">0</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Resolved Today</div>
          <div className="text-2xl font-bold mt-1 text-green-600">0</div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No incidents found
          </h3>
          <p className="text-gray-600">
            Your applications are running smoothly. Incidents will appear here when detected.
          </p>
        </div>
      </Card>
    </div>
  );
}
