import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, formatFCFA, getToken } from "../lib/api";
import Layout from "../components/Layout";
import { useToast } from "../components/Toast";
import { Download, Mail, MessageCircle, Plus, ArrowLeft, Edit2, Trash2, Ban } from "lucide-react";

export default function InvoiceDetails() {
  const { showToast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ method: "MTN_MOMO", amount: "", reference: "", note: "" });

  async function loadInvoice() {
    try {
      const res = await api(`/invoices/${id}`);
      setInvoice(res.invoice);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadInvoice(); }, [id]);

  async function markAsSent() {
    try {
      await api(`/invoices/${id}/send`, { method: "POST" });
      showToast("Invoice marked as sent!", "success");
      await loadInvoice();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function sendEmail() {
    try {
      await api(`/invoices/${id}/send-email`, { method: "POST" });
      showToast("Email sent successfully!", "success");
      await loadInvoice();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deleteInvoice() {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await api(`/invoices/${id}`, { method: "DELETE" });
      navigate("/invoices");
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function voidInvoice() {
    if (!confirm("Are you sure you want to void this invoice?")) return;
    try {
      await api(`/invoices/${id}/void`, { method: "POST" });
      showToast("Invoice voided!", "info");
      await loadInvoice();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handlePaymentSubmit(e: any) {
    e.preventDefault();
    try {
      await api(`/invoices/${id}/manual-payment`, {
        method: "POST",
        body: JSON.stringify({
          ...paymentForm,
          amount: Number(paymentForm.amount) || invoice.balanceDue,
        }),
      });
      showToast("Payment recorded successfully!", "success");
      setShowPaymentModal(false);
      setPaymentForm({ method: "MTN_MOMO", amount: "", reference: "", note: "" });
      await loadInvoice();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function downloadPdf() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1"}/invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to download PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("Failed to download PDF: " + err.message);
    }
  }

  if (loading) {
    return <Layout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div></Layout>;
  }

  if (!invoice) {
    return <Layout><div className="text-center text-gray-500">Invoice not found.</div></Layout>;
  }

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

  const pdfUrl = `${import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1"}/invoices/${id}/pdf`;
  const whatsappText = encodeURIComponent(`Hello ${invoice.customer?.name},\n\nPlease find invoice ${invoice.invoiceNumber}.\n\nAmount due: FCFA ${Number(invoice.balanceDue || 0).toLocaleString()}.\nDue date: ${new Date(invoice.dueDate).toLocaleDateString()}.\n\nView and pay: ${window.location.origin}/i/${invoice.publicToken}`);
  const whatsappLink = `https://wa.me/?text=${whatsappText}`;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button onClick={() => navigate("/invoices")} className="mr-4 text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
              <p className="text-gray-500 mt-1">Created on {new Date(invoice.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/invoices/${id}/edit`} className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
              <Edit2 size={18} />
            </Link>
            {invoice.status === "DRAFT" && (
              <button onClick={deleteInvoice} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 size={18} />
              </button>
            )}
            {["SENT", "OVERDUE"].includes(invoice.status) && (
              <button onClick={voidInvoice} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                <Ban size={18} />
              </button>
            )}
          </div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}
        {success && <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-lg">{success}</div>}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={downloadPdf}
            className="flex items-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
          >
            <Download size={18} className="mr-2" />
            Download PDF
          </button>
          <button
            onClick={sendEmail}
            className="flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <Mail size={18} className="mr-2" />
            Send Email
          </button>
          <a
            href={whatsappLink}
            target="_blank"
            className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            <MessageCircle size={18} className="mr-2" />
            Share WhatsApp
          </a>
          {invoice.status !== "PAID" && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors"
            >
              <Plus size={18} className="mr-2" />
              ADD PAYMENT
            </button>
          )}
        </div>

        {/* Invoice Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
          {/* Customer & Dates */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Billed To</h3>
                <p className="font-semibold text-gray-900">{invoice.customer?.name}</p>
                {invoice.customer?.email && <p className="text-gray-500 text-sm">{invoice.customer.email}</p>}
                {invoice.customer?.phone && <p className="text-gray-500 text-sm">{invoice.customer.phone}</p>}
              </div>
              <div className="text-right">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Issue Date</h3>
                  <p className="font-medium text-gray-900">{new Date(invoice.issueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Due Date</h3>
                  <p className="font-medium text-gray-900">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Qty</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Unit Price</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.lineItems?.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-gray-900">{item.description}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{item.quantity}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{formatFCFA(item.unitPrice)}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">{formatFCFA(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-3">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatFCFA(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>VAT ({invoice.vatRate}%)</span>
                  <span>{formatFCFA(invoice.vatAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Amount Paid</span>
                  <span className="text-green-600">{formatFCFA(invoice.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-3">
                  <span>Balance Due</span>
                  <span>{formatFCFA(invoice.balanceDue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <p className="text-gray-600 text-sm">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 animate-fade-in">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl animate-slide-up">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Record Payment</h2>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    <option value="MTN_MOMO">MTN Mobile Money</option>
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder={String(invoice.balanceDue)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference (Optional)</label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                  >
                    ADD PAYMENT
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}