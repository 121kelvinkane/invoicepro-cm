import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, formatFCFA } from "../lib/api";

export default function PublicInvoice() {
  const { token } = useParams<any>();
  const [invoice, setInvoice] = useState<any>(null);
  const [error, setError] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [method, setMethod] = useState("MTN_MOMO");
  const [phone, setPhone] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  async function loadInvoice() {
    try {
      const res = await api(`/public/invoices/${token}`);
      setInvoice(res.invoice);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => { loadInvoice(); }, [token]);

  async function handlePayment(e: any) {
    e.preventDefault();
    setProcessing(true);
    setPaymentError("");
    
    try {
      // Call the simulated endpoint
      const res = await api(`/public/invoices/${token}/pay`, {
        method: "POST",
        body: JSON.stringify({ phoneNumber: phone, method }),
      });
      
      if (res.success) {
        setPaymentSuccess(true);
        setShowModal(false);
        await loadInvoice(); // Refresh to show PAID status
      } else {
        setPaymentError(res.message || "Payment failed");
      }
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-red-200 text-red-700 rounded-xl px-6 py-4">{error}</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-gray-500">Loading invoice...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">{invoice.business?.businessName || "Business"}</h1>
            <div className="text-sm text-gray-600">{invoice.business?.phone}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Invoice</div>
            <div className="text-xl font-bold">{invoice.invoiceNumber}</div>
            <div className="mt-2 text-sm font-medium text-blue-600">{invoice.status}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-sm text-gray-500 mb-1">Billed To</div>
            <div className="font-medium">{invoice.customer?.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Due Date</div>
            <div className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems?.map((item: any) => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">{formatFCFA(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="max-w-sm ml-auto space-y-2 text-sm mb-8">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatFCFA(invoice.subtotal)}</span></div>
          <div className="flex justify-between"><span>VAT</span><span>{formatFCFA(invoice.vatAmount)}</span></div>
          <div className="flex justify-between"><span>Amount Paid</span><span>{formatFCFA(invoice.amountPaid)}</span></div>
          <div className="flex justify-between font-bold text-xl border-t pt-2">
            <span>Balance Due</span>
            <span className="text-blue-600">{formatFCFA(invoice.balanceDue)}</span>
          </div>
        </div>

        {paymentSuccess || invoice.status === "PAID" ? (
          <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-6 text-center text-lg font-semibold">
            Payment Successful! Thank you.
          </div>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg px-4 py-4 text-lg shadow-md transition"
          >
            Pay {formatFCFA(invoice.balanceDue)} Now
          </button>
        )}
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Pay with Mobile Money</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>

            {paymentError && (
              <div className="mb-4 bg-red-50 text-red-600 px-3 py-2 rounded text-sm">{paymentError}</div>
            )}

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setMethod("MTN_MOMO")}
                    className={`p-3 border rounded-lg text-center font-medium ${method === "MTN_MOMO" ? "border-yellow-500 bg-yellow-50 text-yellow-700" : "border-gray-300"}`}
                  >
                    MTN MoMo
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setMethod("ORANGE_MONEY")}
                    className={`p-3 border rounded-lg text-center font-medium ${method === "ORANGE_MONEY" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-300"}`}
                  >
                    Orange Money
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {method === "MTN_MOMO" ? "MTN" : "Orange"} Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="6XX XXX XXX"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">You will receive a prompt on your phone to enter your PIN.</p>
              </div>

              <button 
                type="submit" 
                disabled={processing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
              >
                {processing ? "Processing Payment..." : `Confirm Payment`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}