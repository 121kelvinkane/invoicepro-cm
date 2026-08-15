import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatFCFA } from "../lib/api";
import Layout from "../components/Layout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/invoices")
      .then((res) => setInvoices(res.invoices || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const paidInvoices = invoices.filter((invoice) => invoice.status === "PAID");
  const revenue = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const unpaidAmount = invoices
    .filter((invoice) => ["SENT", "OVERDUE", "DRAFT"].includes(invoice.status))
    .reduce((sum, invoice) => sum + Number(invoice.balanceDue || 0), 0);
  const overdueCount = invoices.filter((invoice) => invoice.status === "OVERDUE").length;

  // Calculate monthly revenue for the last 6 months
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
    if (monthlyRevenue.hasOwnProperty(key)) {
      monthlyRevenue[key] += Number(inv.total || 0);
    }
  });

  const chartData = Object.keys(monthlyRevenue).map((key) => {
    const [year, month] = key.split("-");
    const monthName = new Date(Number(year), Number(month) - 1).toLocaleString("default", { month: "short" });
    return { month: `${monthName} ${year.slice(2)}`, revenue: monthlyRevenue[key] };
  });

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link to="/invoices/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Create Invoice</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm text-gray-500">Total Revenue</div>
          <div className="text-2xl font-bold mt-1">{formatFCFA(revenue)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm text-gray-500">Unpaid Amount</div>
          <div className="text-2xl font-bold mt-1">{formatFCFA(unpaidAmount)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm text-gray-500">Overdue Invoices</div>
          <div className="text-2xl font-bold mt-1">{overdueCount}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8 shadow-sm">
        <h2 className="font-semibold mb-4">Revenue (Last 6 Months)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatFCFA(Number(value))} />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200 font-semibold">Recent Invoices</div>
        {loading ? (
          <div className="p-4 text-gray-500">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-4 text-gray-500">No invoices yet. Create your first invoice.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 10).map((invoice) => (
                  <tr key={invoice.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <Link className="text-blue-600 hover:underline" to={`/invoices/${invoice.id}`}>
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{invoice.customer?.name}</td>
                    <td className="px-4 py-3">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{formatFCFA(invoice.total)}</td>
                    <td className="px-4 py-3">{invoice.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}