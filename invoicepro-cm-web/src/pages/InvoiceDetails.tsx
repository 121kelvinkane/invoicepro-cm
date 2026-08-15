import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, formatFCFA } from "../lib/api";
import Layout from "../components/Layout";

export default function InvoiceDetails() {
  const { id } = useParams<any>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [method, setMethod] = useState("MTN_MOMO");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  async function loadInvoice() {
    const res = await api(`/invoices/${id}`);
    setInvoice(res.invoice);
  }

  useEffect(() => { loadInvoice().catch(console.error); }, [id]);

  async function markAsSent() {
    setError(""); setSuccess("");
    try {
      await api(`/invoices/${id}/send`, { method: "POST" });
      setSuccess("Invoice marked as sent.");
      await loadInvoice();
    } catch (err: any) { setError(err.message); }
  }

  async function sendEmail() {
    setError(""); setSuccess("");
    try {
      const res = await api(`/invoices/${id}/send-email`, { method: "POST" });
      setSuccess(res.message || "Invoice email sent.");
      await loadInvoice();
    } catch (err: any) { setError(err.message); }
  }

  async function deleteInvoice() {
    if (!confirm("Are you sure you want to delete this draft invoice?")) return;
    try {
      await api(`/invoices/${id}`, { method: "DELETE" });
      navigate("/invoices");
    } catch (err: any) { setError(err.message); }
  }

  async function voidInvoice() {
    if (!confirm("Are you sure you want to void this invoice? It cannot be undone.")) return;
    try {
      await api(`/invoices/${id}/void`, { method: "POST" });
      await loadInvoice();
    } catch (err: any) { setError(err.message); }
  }

  async function recordPayment(e: any) {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      await api(`/invoices/${id}/manual-payment`, {
        method: "POST",
        body: JSON.stringify({ method, amount: Number(amount || invoice.balanceDue), reference: reference || null, note: note || null }),
      });
      setSuccess("Payment recorded successfully.");
      setAmount(""); setReference(""); setNote("");
      await loadInvoice();
    } catch (err: any) { setError(err.message); }
  }

  if (!invoice) return <Layout><div className="text-gray-500">Loading invoice...</div></Layout>;

  const publicLink = `${window.location.origin}/i/${invoice.publicToken}`;
  const pdfLink = `http://localhost:4000/api/v1/public/invoices/${invoice.publicToken}/pdf`;
  let phoneDigits = (invoice.customer?.phone || "").replace(/[^0-9]/g, "");
  if (phoneDigits.startsWith("0")) phoneDigits = phoneDigits.slice(1);
  if (phoneDigits.length === 9 && phoneDigits.startsWith("6")) phoneDigits = `237${phoneDigits}`;
  const whatsappText = encodeURIComponent(`Hello ${invoice.customer?.name || ""},\n\nPlease find invoice ${invoice.invoiceNumber}.\n\nAmount due: FCFA ${Number(invoice.balanceDue || 0).toLocaleString()}.\nDue date: ${new Date(invoice.dueDate).toLocaleDateString()}.\n\nView and pay: ${publicLink}`);
  const whatsappLink = phoneDigits ? `https://wa.me/${phoneDigits}?text=${whatsappText}` : `https://wa.me/?text=${whatsappText}`;

  return (
    <Layout>
      <div className="mb-6"><Link to="/invoices" className="text-blue-600 hover:underline text-sm">Back to invoices</Link></div>
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}
      {success && <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
                <p className="text-gray-500 text-sm">Status: {invoice.status}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/invoices/${id}/edit`} className="bg-gray-100 text-gray-800 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200">Edit Invoice</Link>
                <button onClick={sendEmail} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Send Email</button>
                <button onClick={markAsSent} className="bg-gray-900 text-white px-4 py-2 rounded-lg">Mark as Sent</button>
                
                {invoice.status === 'DRAFT' && (
                  <button onClick={deleteInvoice} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Delete</button>
                )}
                {['SENT', 'OVERDUE'].includes(invoice.status) && (
                  <button onClick={voidInvoice} className="bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-200">Void Invoice</button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Customer</div>
                <div className="font-medium">{invoice.customer?.name}</div>
                <div>{invoice.customer?.email}</div>
                <div>{invoice.customer?.phone}</div>
              </div>
              <div>
                <div className="text-gray-500">Issue Date</div>
                <div className="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</div>
                <div className="text-gray-500 mt-3">Due Date</div>
                <div className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 font-semibold">Line Items</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems?.map((item: any) => (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatFCFA(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right">{formatFCFA(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-200 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{formatFCFA(invoice.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">VAT</span><span>{formatFCFA(invoice.vatAmount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Amount Paid</span><span>{formatFCFA(invoice.amountPaid)}</span></div>
              <div className="flex justify-between font-bold text-base"><span>Balance Due</span><span>{formatFCFA(invoice.balanceDue)}</span></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold mb-3">Public Invoice Link</h2>
            <div className="text-sm text-gray-600 break-all mb-3">{publicLink}</div>
            <div className="flex flex-wrap gap-2">
              <a href={publicLink} target="_blank" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg">Open Public Invoice</a>
              <a href={pdfLink} target="_blank" className="inline-block bg-gray-900 text-white px-4 py-2 rounded-lg">Download PDF</a>
              <a href={whatsappLink} target="_blank" className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg">Share WhatsApp</a>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold mb-4">Record Manual Payment</h2>
            <form onSubmit={recordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="MTN_MOMO">MTN Mobile Money</option>
                  <option value="ORANGE_MONEY">Orange Money</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(invoice.balanceDue)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reference</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2" value={reference} onChange={(e) => setReference(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Note</label>
                <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <button className="w-full bg-green-600 text-white rounded-lg px-4 py-2">Record Payment</button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}