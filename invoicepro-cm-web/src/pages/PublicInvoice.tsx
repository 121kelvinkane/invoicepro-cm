import { useEffect, useState, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
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

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        windowWidth: 800,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
    } finally {
      setDownloading(false);
    }
  };

  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4"><div className="bg-white border border-red-200 text-red-700 rounded-xl px-6 py-4">{error}</div></div>;
  if (!invoice) return <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  const pdfUrl = `${import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1"}/public/invoices/${token}/pdf`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">IP</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{invoice.business?.businessName || "Invoice"}</h1>
          <p className="text-gray-500 mt-1">Invoice {invoice.invoiceNumber}</p>
        </div>

        <div ref={invoiceRef} className="bg-white rounded-2xl shadow-xl overflow-hidden">
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

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

            <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Qty</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.lineItems?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-gray-900">{item.description}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{formatFCFA(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mb-8">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>{formatFCFA(invoice.subtotal)}</span></div>
                <div className="flex justify-between text-sm text-gray-500"><span>VAT</span><span>{formatFCFA(invoice.vatAmount)}</span></div>
                <div className="flex justify-between text-sm text-gray-500"><span>Amount Paid</span><span className="text-green-600">{formatFCFA(invoice.amountPaid)}</span></div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2"><span>Balance Due</span><span>{formatFCFA(invoice.balanceDue)}</span></div>
              </div>
            </div>

            {/* Action Buttons & Signature */}
            {paymentSuccess || invoice.status === "PAID" ? (
              <div className="flex justify-center gap-4">
                <button onClick={handleDownloadPDF} disabled={downloading} className="flex items-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                  <Download size={18} className="mr-2" /> {downloading ? "Generating..." : "Download PDF"}
                </button>
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
