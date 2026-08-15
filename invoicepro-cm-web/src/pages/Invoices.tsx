import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatFCFA } from "../lib/api";
import Layout from "../components/Layout";

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/invoices")
      .then((res) => setInvoices(res.invoices || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>

        <Link
          to="/invoices/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Create Invoice
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-4 text-gray-500">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-4 text-gray-500">No invoices yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <Link
                        className="text-blue-600 hover:underline"
                        to={`/invoices/${invoice.id}`}
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{invoice.customer?.name}</td>
                    <td className="px-4 py-3">
                      {new Date(invoice.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{formatFCFA(invoice.total)}</td>
                    <td className="px-4 py-3">
                      {formatFCFA(invoice.balanceDue)}
                    </td>
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