import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Activity, FileText, User, CreditCard } from "lucide-react";

export default function ActivityFeed() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/activity")
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getIcon = (action: string) => {
    if (action.includes("INVOICE")) return <FileText size={16} className="text-blue-500" />;
    if (action.includes("PAYMENT")) return <CreditCard size={16} className="text-green-500" />;
    return <User size={16} className="text-purple-500" />;
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase());
  };

  if (loading) return <div className="bg-white p-6 rounded-xl border border-gray-100 animate-pulse h-64"></div>;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center gap-2">
        <Activity size={20} className="text-primary-600" />
        <h3 className="font-bold text-gray-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="p-6 text-center text-gray-400 text-sm">No activity yet. Try updating your profile!</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
              <div className="p-2 bg-gray-100 rounded-lg mt-0.5">
                {getIcon(log.action)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{formatAction(log.action)}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(log.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
