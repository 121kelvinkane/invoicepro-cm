import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api, formatFCFA } from "../lib/api";
import Layout from "../components/Layout";
import { StatCardSkeleton } from "../components/Skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, CreditCard, AlertTriangle, Plus, ArrowUpRight , AlertCircle, FileText} from "lucide-react";

export default function Dashboard() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/invoices")
      .then((res) => setInvoices(res.invoices || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const paidInvoices = invoices.filter((i) => i.status === "PAID");
  const revenue = paidInvoices.reduce((sum, i) => sum + Number(i.total || 0), 0);
  const unpaidAmount = invoices.filter((i) => ["SENT", "OVERDUE", "DRAFT"].includes(i.status)).reduce((sum, i) => sum + Number(i.balanceDue || 0), 0);
  const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;

  const monthlyRevenue: { [key: string]: number } = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyRevenue[key] = 0;
  }
  paidInvoices.forEach((inv) => {
    const d = new Date(inv.paidAt || inv.issueDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyRevenue.hasOwnProperty(key)) monthlyRevenue[key] += Number(inv.total || 0);
  });
  const chartData = Object.keys(monthlyRevenue).map((key) => {
    const [year, month] = key.split("-");
    const monthName = new Date(Number(year), Number(month) - 1).toLocaleString("default", { month: "short" });
    return { month: monthName, revenue: monthlyRevenue[key] };
  });

  const stats = [
    { label: "Total Revenue", value: formatFCFA(revenue), icon: TrendingUp, bg: "bg-emerald-50", text: "text-emerald-600" },
    { label: "Unpaid Amount", value: formatFCFA(unpaidAmount), icon: CreditCard, bg: "bg-blue-50", text: "text-blue-600" },
    { label: "Overdue Invoices", value: overdueCount, icon: AlertTriangle, bg: "bg-red-50", text: "text-red-600" },
  ];

  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">

      {/* PREMIUM STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total This Month */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500">Total This Month</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatFCFA(stats.monthRevenue)}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl"><TrendingUp className="text-emerald-600" size={24} /></div>
        </div>

        {/* Unpaid Amount */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500">Unpaid Amount</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatFCFA(stats.unpaidTotal)}</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-xl"><AlertCircle className="text-orange-600" size={24} /></div>
        </div>

        {/* Invoices This Week */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500">Invoices This Week</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.weekCount}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl"><FileText className="text-blue-600" size={24} /></div>
        </div>
      </div>
        {/* Header with BIG ADD Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back! Here's your business overview.</p>
          </div>
          <Link
            to="/invoices/new"
            className="flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <Plus size={24} className="mr-3" />
            ADD INVOICE
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : stats.map((stat) => {
            const Icon = stat.icon;
            
  return (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={stat.text} size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
            <span className="text-sm text-gray-500">Last 6 Months</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value) => formatFCFA(Number(value))}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
            <Link to="/invoices" className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all <ArrowUpRight size={14} className="ml-1" />
            </Link>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="animate-pulse h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-6 text-gray-500">No invoices yet. Create your first invoice.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.slice(0, 10).map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <Link className="text-primary-600 hover:text-primary-700 font-medium" to={`/invoices/${invoice.id}`}>
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{invoice.customer?.name}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{formatFCFA(invoice.total)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === 'PAID' ? 'bg-green-100 text-green-700' :
                          invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                          invoice.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}





