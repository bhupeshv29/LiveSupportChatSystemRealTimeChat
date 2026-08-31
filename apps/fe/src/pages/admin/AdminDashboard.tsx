import Navbar from "../../components/layout/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useAdminAnalytics } from "../../hooks/admin/useAdminAnalytics";

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const { data: analytics, isLoading, isError } = useAdminAnalytics();

  if (isLoading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  if (isError || !analytics) {
    return <div className="p-6 text-red-600">Failed to load analytics.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="ADMIN" username={user?.name ?? ""} onLogout={logout} />

      <main className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>

          <p className="text-gray-500 mt-1">Overview of your support system</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <StatCard
            title="Total Conversations"
            value={analytics.totalConversations}
          />

          <StatCard
            title="Open Conversations"
            value={analytics.openConversations}
          />

          <StatCard
            title="Closed Conversations"
            value={analytics.closedConversations}
          />
        </div>

        {/* Supervisor analytics */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">Supervisor Statistics</h2>

            <p className="text-sm text-gray-500 mt-1">
              Agents and conversations assigned to each supervisor
            </p>
          </div>

          {analytics.supervisors.length === 0 ? (
            <div className="p-6 text-gray-500">No supervisors found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">
                      Supervisor
                    </th>

                    <th className="text-left px-6 py-3 font-medium">Agents</th>

                    <th className="text-left px-6 py-3 font-medium">
                      Conversations
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {analytics.supervisors.map((supervisor) => (
                    <tr key={supervisor.id} className="border-b last:border-0">
                      <td className="px-6 py-4 font-medium">
                        {supervisor.name}
                      </td>

                      <td className="px-6 py-4">{supervisor.agentCount}</td>

                      <td className="px-6 py-4">
                        {supervisor.conversationCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="bg-white border rounded-xl p-6">
      <p className="text-sm text-gray-500">{title}</p>

      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
