import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import Layout from "../components/Layout";

function todayISODate() { return new Date().toISOString().slice(0, 10); }
function defaultDueDate() { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().slice(0, 10); }

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { id } = useParams<any>();
  const isEditing = Boolean(id);

  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(todayISODate());
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [vatEnabled, setVatEnabled] = useState(true);
  const [vatRate, setVatRate] = useState("19.25");
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Payment due within 14 days.");
  const [lineItems, setLineItems] = useState<any[]>([{ description: "", quantity: "1", unitPrice: "0" }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);

  useEffect(() => {
    api("/customers").then(res => setCustomers(res.customers || [])).catch(console.error);
    
    if (isEditing) {
      api(`/invoices/${id}`).then(res => {
        const inv = res.invoice;
        setCustomerId(inv.customerId || inv.customer?.id);
        setIssueDate(new Date(inv.issueDate).toISOString().slice(0, 10));
        setDueDate(new Date(inv.dueDate).toISOString().slice(0, 10));
        setVatEnabled(inv.vatRate > 0);
        setVatRate(String(inv.vatRate || 0));
        setNotes(inv.notes || "");
        setPaymentTerms(inv.paymentTerms || "");
        setLineItems(inv.lineItems.map((li: any) => ({
          description: li.description,
          quantity: String(li.quantity),
          unitPrice: String(li.unitPrice),
        })));
        setLoadingData(false);
      }).catch(err => { setError(err.message); setLoadingData(false); });
    }
  }, [id]);

  function updateItem(index: number, field: string, value: string) {
    setLineItems(items => items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function addLineItem() { setLineItems(items => [...items, { description: "", quantity: "1", unitPrice: "0" }]); }
  function removeLineItem(index: number) { setLineItems(items => items.filter((_, i) => i !== index)); }

  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  const vatAmount = vatEnabled && Number(vatRate) > 0 ? Math.round((subtotal * Number(vatRate)) / 100) : 0;
  const total = subtotal + vatAmount;

  async function submit(e: any) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const payload = {
        customerId,
        issueDate: new Date(issueDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        vatEnabled,
        vatRate: vatEnabled ? Number(vatRate) : null,
        notes,
        paymentTerms,
        lineItems: lineItems.map(item => ({
          description: item.description,
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.unitPrice || 0),
        })),
      };

      if (isEditing) {
        await api(`/invoices/${id}`, { method: "PUT", body: JSON.stringify(payload) });
        navigate(`/invoices/${id}`);
      } else {
        const res = await api("/invoices", { method: "POST", body: JSON.stringify(payload) });
        navigate(`/invoices/${res.invoice.id}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  if (loadingData) return <Layout><div className="text-gray-500">Loading invoice...</div></Layout>;

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">{isEditing ? "Edit Invoice" : "Create Invoice"}</h1>
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold mb-4">Customer</h2>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">Select customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Line Items</h2>
              <button type="button" onClick={addLineItem} className="text-blue-600 text-sm hover:underline">Add Item</button>
            </div>
            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 border border-gray-100 rounded-lg p-3">
                  <div className="md:col-span-6">
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Description" value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} required />
                  </div>
                  <div className="md:col-span-2">
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2" type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} />
                  </div>
                  <div className="md:col-span-3">
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2" type="number" min="0" placeholder="Unit Price" value={item.unitPrice} onChange={(e) => updateItem(index, "unitPrice", e.target.value)} />
                  </div>
                  <div className="md:col-span-1 flex items-center justify-center">
                    <button type="button" onClick={() => removeLineItem(index)} className="text-red-600 text-sm">X</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold mb-4">Dates and Notes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Issue Date</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Terms</label>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={2} value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold mb-4">Tax</h2>
            <label className="flex items-center gap-2 mb-4">
              <input type="checkbox" checked={vatEnabled} onChange={(e) => setVatEnabled(e.target.checked)} />
              <span className="text-sm">Enable VAT</span>
            </label>
            {vatEnabled && (
              <div>
                <label className="block text-sm font-medium mb-1">VAT Rate %</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2" type="number" step="0.01" value={vatRate} onChange={(e) => setVatRate(e.target.value)} />
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{subtotal.toLocaleString()} FCFA</span></div>
              <div className="flex justify-between"><span className="text-gray-600">VAT</span><span>{vatAmount.toLocaleString()} FCFA</span></div>
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>{total.toLocaleString()} FCFA</span></div>
            </div>
            <button disabled={loading} className="mt-6 w-full bg-blue-600 text-white rounded-lg px-4 py-2 disabled:opacity-60">
              {loading ? "Saving..." : isEditing ? "Update Invoice" : "Create Invoice"}
            </button>
          </div>
        </div>
      </form>
    </Layout>
  );
}