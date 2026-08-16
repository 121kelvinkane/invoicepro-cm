import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatFCFA } from "../lib/api";
import Layout from "../components/Layout";
import { TableRowSkeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { FileText, Plus, Eye, Trash2, Search } from "lucide-react";

export default function Invoices() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    api("/invoices")
      .then((res) => setInvoices(res.invoices || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: "bg-gray-100 text-gray-700",
      SENT: "bg-blue-100 text-blue-700",
      PAID: "bg-green-100 text-green-700",
      OVERDUE: "bg-red-100 text-red-700",
      VOID: "bg-gray-100 text-gray-500",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700";
  };

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await api(`/invoices/${id}`, { method: "DELETE" });
      await api("/invoices").then((res) => setInvoices(res.invoices || []));
    } catch (err: any) {
      showToast(err.message, "error");
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header with BIG ADD Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-500 mt-1">Create and manage your invoices.</p>
          </div>
          <Link
            to="/invoices/new"
            className="flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <Plus size={24} className="mr-3" />
            ADD INVOICE
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoices or customers..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="VOID">Void</option>
          </select>
        </div>

        {/* Invoices Table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
              </tbody>
            </table>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-500 mb-6">Create your first invoice to get started.</p>
            <Link
              to="/invoices/new"
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl shadow-lg"
            >
              <Plus size={24} className="inline mr-3" />
              ADD INVOICE
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{invoice.customer?.name}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{formatFCFA(invoice.total)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/invoices/${invoice.id}`}
                            className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                          >
                            <Eye size={16} />
                          </Link>
                          {invoice.status === "DRAFT" && (
                            <button
                              onClick={() => handleDelete(invoice.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}