import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { api, formatFCFA } from "../lib/api";
import { CheckCircle, Clock, XCircle, Download, MessageCircle, Lock, PenTool } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

export default function PublicInvoice() {
  const { token } = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [method, setMethod] = useState("MTN_MOMO");
  const [phone, setPhone] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  
  // Signature states
  const sigRef = useRef<any>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [signing, setSigning] = useState(false);

  async function loadInvoice() {
    try {
      const res = await api(`/public/invoices/${token}`);
      setInvoice(res.invoice);
      if (res.invoice?.customerSignature) setIsSigned(true);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => { loadInvoice(); }, [token]);

  async function handleSign() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      alert("Please draw your signature first");
      return;
    }
    setSigning(true);
    try {
      const dataUrl = sigRef.current.toDataURL("image/png");
      const res = await api(`/public/invoices/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: dataUrl })
      });
      if (res.success) {
        setIsSigned(true);
        await loadInvoice();
      } else {
        alert(res.message || "Failed to save signature");
      }
    } catch (err: any) {
      alert(err.message || "Error saving signature");
    } finally {
      setSigning(false);
    }
  }

  async function handlePayment(e: any) {
    e.preventDefault();
    setProcessing(true);
    setPaymentError("");
    try {
      const res = await api(`/public/invoices/${token}/pay`, {
        method: "POST",
        body: JSON.stringify({ phoneNumber: phone, method }),
      });
      if (res.success) {
        setPaymentSuccess(true);
        setShowModal(false);
        await loadInvoice();
      } else {
        setPaymentError(res.message || "Payment failed");
      }
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setProcessing(false);
    }
  }

      if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4"><div className="bg-white border border-red-200 text-red-700 rounded-xl px-6 py-4">{error}</div></div>;
  if (!invoice) return <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  
  const pdfUrl = `${import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1"}/public/invoices/${token}/pdf`;


  const numberToWords = (num: number): string => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const two = (n: number): string => (n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? "-" + ones[n % 10] : ""));
    const three = (n: number): string => {
      const h = Math.floor(n / 100);
      const r = n % 100;
      if (h && r) return ones[h] + " Hundred and " + two(r);
      if (h) return ones[h] + " Hundred";
      return two(r);
    };
    if (num === 0) return "Zero";
    const scales = ["", "Thousand", "Million", "Billion", "Trillion"];
    let parts: string[] = [];
    let i = 0;
    while (num > 0 && i < scales.length) {
      const chunk = num % 1000;
      if (chunk) parts.unshift(three(chunk) + (scales[i] ? " " + scales[i] : ""));
      num = Math.floor(num / 1000);
      i++;
    }
    return parts.join(", ");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4">
      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â HIDDEN PREMIUM INVOICE (for PDF only) Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
      <div className="fixed left-[-9999px] top-0 w-[800px] bg-white">
        <div ref={invoiceRef} className="bg-white">
          {/* Dark Slate Header */}
          <div className="bg-slate-900 px-10 py-10">
            <div className="flex justify-between items-start gap-6">
              <div>
                <h2 className="text-xl font-bold text-white">{invoice.business?.businessName || "InvoicePro CM"}</h2>
                {invoice.business?.phone && <p className="text-sm text-slate-300 mt-1">{invoice.business.phone}</p>}
                {invoice.business?.email && <p className="text-sm text-slate-300">{invoice.business.email}</p>}
                {invoice.business?.address && <p className="text-sm text-slate-300">{invoice.business.address}</p>}
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-bold text-white tracking-wide">INVOICE</h1>
                <p className="text-emerald-400 font-bold mt-1">{invoice.invoiceNumber}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-white bg-emerald-600">{invoice.status}</span>
              </div>
            </div>
          </div>
          <div className="h-1 bg-emerald-600"></div>

          <div className="px-10 py-10">
            {/* Billed To + Dates */}
            <div className="flex justify-between items-start gap-8 mb-12 flex-wrap">
              <div>
                <h3 className="text-xs font-bold text-emerald-600 tracking-widest mb-2">BILLED TO</h3>
                <p className="font-bold text-slate-900 text-lg">{invoice.customer?.name || "Walk-in Customer"}</p>
                {invoice.customer?.email && <p className="text-sm text-slate-500">{invoice.customer.email}</p>}
                {invoice.customer?.phone && <p className="text-sm text-slate-500">{invoice.customer.phone}</p>}
              </div>
              <div className="bg-slate-50 rounded-lg px-6 py-4 w-72">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest">ISSUE DATE</span>
                  <span className="text-sm font-bold text-slate-900">{new Date(invoice.issueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest">DUE DATE</span>
                  <span className="text-sm font-bold text-red-600">{new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              </div>
            </div>

            {/* Premium Table */}
            <table className="w-full mb-10">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="text-left py-3 px-4 text-[10px] font-bold tracking-widest rounded-l-md">DESCRIPTION</th>
                  <th className="text-right py-3 px-2 text-[10px] font-bold tracking-widest w-14">QTY</th>
                  <th className="text-right py-3 px-4 text-[10px] font-bold tracking-widest rounded-r-md w-28">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems?.map((item: any, idx: number) => (
                  <tr key={item.id} className={idx % 2 === 0 ? "bg-slate-50" : ""}>
                    <td className="py-3 px-4 text-sm text-slate-900">{item.description}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{item.quantity}</td>
                    <td className="py-3 px-4 text-sm text-slate-900 font-bold text-right">{formatFCFA(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-72">
                <div className="flex justify-between py-1.5 text-sm border-b border-slate-200"><span className="text-slate-500">Subtotal</span><span className="text-slate-900">{formatFCFA(invoice.subtotal)}</span></div>
                {Number(invoice.vatAmount || 0) > 0 && <div className="flex justify-between py-1.5 text-sm border-b border-slate-200"><span className="text-slate-500">VAT</span><span className="text-slate-900">{formatFCFA(invoice.vatAmount)}</span></div>}
                <div className="flex justify-between py-1.5 text-sm border-b border-slate-200"><span className="text-slate-500">Amount Paid</span><span className="text-emerald-600">{formatFCFA(invoice.amountPaid)}</span></div>
                <div className="bg-slate-900 rounded-md px-4 py-3 flex justify-between items-center mt-2">
                  <span className="text-white font-bold text-sm tracking-wide">BALANCE DUE</span>
                  <span className="text-emerald-400 font-bold">{formatFCFA(invoice.balanceDue)}</span>
                </div>
              </div>
            </div>

            {/* Amount in Words */}
            <div className="mb-8">
              <div className="bg-slate-50 rounded-lg px-6 py-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Amount in Words</p>
                <p className="text-sm font-extrabold text-emerald-700 leading-relaxed uppercase break-words">{amountInWords}</p>
              </div>
            </div>

            {/* Signature Lines */}
            <div className="flex justify-between gap-16 mt-14">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-14">BUSINESS OWNER</p>
                <div className="border-t border-slate-300 pt-1.5"><p className="text-[10px] text-slate-400 text-center">Authorized Signature</p></div>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-14">CUSTOMER</p>
                <div className="border-t border-slate-300 pt-1.5"><p className="text-[10px] text-slate-400 text-center">Customer Signature</p></div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-10 pt-4 border-t-2 border-emerald-600">
              <p className="text-xs text-slate-400 text-center">Generated with InvoicePro CM</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">IP</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{invoice.business?.businessName || "Invoice"}</h1>
          <p className="text-gray-500 mt-1">Invoice {invoice.invoiceNumber}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {paymentSuccess || invoice.status === "PAID" ? (
            <div className="bg-green-50 border-b border-green-200 p-6 text-center">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
              <h2 className="text-xl font-bold text-green-700">Payment Successful!</h2>
              <p className="text-green-600 mt-1">Thank you for your payment.</p>
            </div>
          ) : (
            <div className="bg-primary-50 border-b border-primary-200 p-6 text-center">
              <Clock size={48} className="mx-auto text-primary-500 mb-3" />
              <h2 className="text-xl font-bold text-primary-700">Payment Due</h2>
              <p className="text-primary-600 mt-1">Amount due: {formatFCFA(invoice.balanceDue)}</p>
            </div>
          )}

          {/* ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â PREMIUM INVOICE (matches Admin PDF) ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â */}
          <div ref={invoiceRef} className="bg-white">

            {/* Dark Slate Header */}
            <div className="bg-slate-900 px-8 py-8">
              <div className="flex justify-between items-start gap-6">
                <div>
                  <h2 className="text-lg font-bold text-white">{invoice.business?.businessName || "InvoicePro CM"}</h2>
                  {invoice.business?.phone && <p className="text-sm text-slate-300 mt-1">{invoice.business.phone}</p>}
                  {invoice.business?.email && <p className="text-sm text-slate-300">{invoice.business.email}</p>}
                  {invoice.business?.address && <p className="text-sm text-slate-300">{invoice.business.address}</p>}
                </div>
                <div className="text-right">
                  <h1 className="text-2xl font-bold text-white tracking-wide">INVOICE</h1>
                  <p className="text-emerald-400 font-bold mt-1">{invoice.invoiceNumber}</p>
                  <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-white bg-emerald-600">{invoice.status}</span>
                </div>
              </div>
            </div>
            <div className="h-1 bg-emerald-600"></div>

            <div className="px-8 py-8">
              {/* Billed To + Dates */}
              <div className="flex justify-between items-start gap-8 mb-10 flex-wrap">
                <div>
                  <h3 className="text-xs font-bold text-emerald-600 tracking-widest mb-2">BILLED TO</h3>
                  <p className="font-bold text-slate-900 text-lg">{invoice.customer?.name || "Walk-in Customer"}</p>
                  {invoice.customer?.email && <p className="text-sm text-slate-500">{invoice.customer.email}</p>}
                  {invoice.customer?.phone && <p className="text-sm text-slate-500">{invoice.customer.phone}</p>}
                </div>
                <div className="bg-slate-50 rounded-lg px-6 py-4 w-64">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest">ISSUE DATE</span>
                    <span className="text-sm font-bold text-slate-900">{new Date(invoice.issueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest">DUE DATE</span>
                    <span className="text-sm font-bold text-red-600">{new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              </div>

              {/* Premium Table */}
              <table className="w-full mb-10">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="text-left py-3 px-4 text-[10px] font-bold tracking-widest rounded-l-md">DESCRIPTION</th>
                    <th className="text-right py-3 px-2 text-[10px] font-bold tracking-widest w-14">QTY</th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold tracking-widest rounded-r-md w-28">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems?.map((item: any, idx: number) => (
                    <tr key={item.id} className={idx % 2 === 0 ? "bg-slate-50" : ""}>
                      <td className="py-3 px-4 text-sm text-slate-900">{item.description}</td>
                      <td className="py-3 px-2 text-sm text-slate-900 text-right">{item.quantity}</td>
                      <td className="py-3 px-4 text-sm text-slate-900 font-bold text-right">{formatFCFA(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-6">
                <div className="w-72">
                  <div className="flex justify-between py-1.5 text-sm border-b border-slate-200"><span className="text-slate-500">Subtotal</span><span className="text-slate-900">{formatFCFA(invoice.subtotal)}</span></div>
                  {Number(invoice.vatAmount || 0) > 0 && <div className="flex justify-between py-1.5 text-sm border-b border-slate-200"><span className="text-slate-500">VAT</span><span className="text-slate-900">{formatFCFA(invoice.vatAmount)}</span></div>}
                  <div className="flex justify-between py-1.5 text-sm border-b border-slate-200"><span className="text-slate-500">Amount Paid</span><span className="text-emerald-600">{formatFCFA(invoice.amountPaid)}</span></div>
                  <div className="bg-slate-900 rounded-md px-4 py-3 flex justify-between items-center mt-2">
                    <span className="text-white font-bold text-sm tracking-wide">BALANCE DUE</span>
                    <span className="text-emerald-400 font-bold">{formatFCFA(invoice.balanceDue)}</span>
                  </div>
                </div>
              </div>

              {/* Amount in Words */}
              <div className="mb-8">
                <div className="bg-slate-50 rounded-lg px-6 py-4 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Amount in Words</p>
                  <p className="text-sm font-extrabold text-emerald-700 leading-relaxed uppercase break-words">{amountInWords}</p>
                </div>
              </div>

              {/* Signature Lines */}
              <div className="flex justify-between gap-16 mt-10">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-14">BUSINESS OWNER</p>
                  <div className="border-t border-slate-300 pt-1.5"><p className="text-[10px] text-slate-400 text-center">Authorized Signature</p></div>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-14">CUSTOMER</p>
                  <div className="border-t border-slate-300 pt-1.5"><p className="text-[10px] text-slate-400 text-center">Customer Signature</p></div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t-2 border-emerald-600">
                <p className="text-xs text-slate-400 text-center">Generated with InvoicePro CM</p>
              </div>
            </div>
          </div>
            {/* Action Buttons & Signature */}
            {paymentSuccess || invoice.status === "PAID" ? (
              <div className="flex justify-center gap-4">
                <a href={pdfUrl} download className="flex items-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors">
                  <Download size={18} className="mr-2" /> Download PDF
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                
                {/* Signature Section */}
                {!isSigned ? (
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><PenTool size={18}/> Sign to Accept</h3>
                    <p className="text-sm text-gray-600 mb-4">Please sign below to acknowledge receipt of this invoice before paying.</p>
                    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden mb-4">
                      <SignatureCanvas
                        ref={sigRef}
                        penColor="black"
                        canvasProps={{ className: "w-full", style: { height: "150px", width: "100%" } }}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => sigRef.current?.clear()} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">Clear</button>
                      <button onClick={handleSign} disabled={signing} className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shadow-md transition-all disabled:opacity-50">
                        {signing ? "Saving..." : "Save Signature"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-600" size={24}/>
                      <div>
                        <p className="font-bold text-green-800">Signed & Accepted</p>
                        <p className="text-xs text-green-600">{invoice.customerSignedAt ? new Date(invoice.customerSignedAt).toLocaleString() : "Just now"}</p>
                      </div>
                    </div>
                    {invoice.customerSignature && <img src={`${import.meta.env.VITE_API_URL || "http://localhost:4000"}${invoice.customerSignature}`} alt="Sig" className="h-12 object-contain"/>}
                  </div>
                )}

                {/* Pay Button (Only visible if signed) */}
                {isSigned && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
                  >
                    PAY {formatFCFA(invoice.balanceDue)} NOW
                  </button>
                )}

                {/* Locked Download */}
                <div className="flex justify-center items-center gap-2 text-gray-400 bg-gray-50 py-3 rounded-lg border border-gray-200">
                  <Lock size={16} />
                  <span className="text-sm font-medium">PDF download unlocks after payment</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 animate-fade-in">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl animate-slide-up">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Pay with Mobile Money</h2>
              {paymentError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{paymentError}</div>}
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setMethod("MTN_MOMO")} className={`p-3 border rounded-lg text-center font-medium transition-colors ${method === "MTN_MOMO" ? "border-yellow-500 bg-yellow-50 text-yellow-700" : "border-gray-300 text-gray-600"}`}>MTN MoMo</button>
                    <button type="button" onClick={() => setMethod("ORANGE_MONEY")} className={`p-3 border rounded-lg text-center font-medium transition-colors ${method === "ORANGE_MONEY" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-300 text-gray-600"}`}>Orange Money</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{method === "MTN_MOMO" ? "MTN" : "Orange"} Phone Number</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="6XX XXX XXX" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" required/>
                  <p className="text-xs text-gray-500 mt-1">You will receive a prompt on your phone to enter your PIN.</p>
                </div>
                <button type="submit" disabled={processing} className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50">
                  {processing ? "PROCESSING..." : "CONFIRM PAYMENT"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
