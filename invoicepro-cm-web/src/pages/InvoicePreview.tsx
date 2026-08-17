import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import { ArrowLeft, Printer, MessageCircle, Calendar, CreditCard, Mail } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

export default function InvoicePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const data = await api(`/invoices/${id}`);
        setInvoice(data.invoice || data.data || data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchInvoice();
  }, [id]);

  if (loading) return <div className="p-12 text-center text-gray-500">Loading invoice...</div>;
  if (!invoice) return <div className="p-12 text-center text-red-500">Invoice not found</div>;

  const { customer, lineItems, invoiceNumber, issueDate, dueDate, subtotal, vatAmount, total, currency, publicToken, status } = invoice;
  
  const paymentLink = `${window.location.origin}/pay/${publicToken}`;
  const whatsappMessage = `Hello ${customer?.name || 'Customer'},%0A%0APlease find your invoice *${invoiceNumber}* for *${currency || 'XAF'} ${(total || 0).toLocaleString()}*.%0A%0AView and pay securely here: ${paymentLink}%0A%0AThank you for your business!`;
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !invoice) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4", true);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      pdf.addImage(imgData, "PNG", 0, 10, canvas.width * ratio, canvas.height * ratio);
      pdf.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF", error);
      showToast("Error generating PDF.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleEmailPaymentLink = async () => {
    if (!customer?.email) {
      showToast("This customer does not have an email address saved!", "error");
      return;
    }
    setEmailing(true);
    try {
      await api("/invoices/send-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: customer.email,
          paymentLink: paymentLink,
          invoiceNumber: invoiceNumber,
          customerName: customer.name,
          total: total,
          currency: currency
        })
      });
      showToast("Payment link sent to " + customer.email + " successfully!", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to send email. Please check backend logs.", "error");
    } finally {
      setEmailing(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-primary-600 font-medium transition-colors">
            <ArrowLeft size={20} className="mr-2" /> Back
          </button>
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleDownloadPDF} disabled={downloading} className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg flex items-center gap-2 font-medium transition-colors shadow-md disabled:opacity-50">
              <Printer size={18} /> {downloading ? "Generating..." : "Download PDF"}
            </button>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all font-semibold">
              <MessageCircle size={18} /> WhatsApp
            </a>
            <button onClick={handleEmailPaymentLink} disabled={emailing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium transition-colors shadow-md disabled:opacity-50">
              <Mail size={18} /> {emailing ? "Sending..." : "Email Link"}
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto p-4 my-8">
        <div ref={invoiceRef} className="bg-white shadow-2xl rounded-xl overflow-hidden">
          <div className="bg-slate-900 text-white p-8 md:p-12 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold tracking-wider uppercase">Invoice</h1>
              <p className="text-slate-300 mt-2 text-xl font-mono">#{invoiceNumber}</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-emerald-400">InvoicePro CM</h2>
              <p className="text-slate-300 text-sm mt-1 max-w-[200px]">Professional Invoicing & Payment Solutions</p>
            </div>
          </div>
          <div className="p-8 md:p-12 relative">
            {status === 'UNPAID' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
                 <span className="text-[12rem] font-black text-red-600 rotate-[-30deg] tracking-widest">UNPAID</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 relative z-10">
              <div>
                <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 border-b-2 border-emerald-100 pb-2">Billed To</h3>
                <p className="font-bold text-gray-900 text-xl mb-1">{customer?.name || 'Walk-in Customer'}</p>
                <p className="text-gray-600 text-sm mb-0.5">{customer?.email || ''}</p>
                <p className="text-gray-600 text-sm">{customer?.phone || ''}</p>
              </div>
              <div className="text-right">
                <div className="inline-block text-left">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider w-24">Issue Date:</span>
                    <span className="font-semibold text-gray-800 flex items-center gap-1"><Calendar size={14}/> {new Date(issueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="mb-6 flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider w-24">Due Date:</span>
                    <span className="font-semibold text-red-600 flex items-center gap-1"><Calendar size={14}/> {new Date(dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className={`inline-block px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider border-2 ${status === 'PAID' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                    {status === 'PAID' ? '✓ ' + status : '⏳ ' + status}
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-12 relative z-10">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y-2 border-gray-200">
                    <th className="text-left py-4 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wider">Description</th>
                    <th className="text-center py-4 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wider">Qty</th>
                    <th className="text-right py-4 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wider">Unit Price</th>
                    <th className="text-right py-4 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems?.map((item: any, idx: number) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-5 px-4 text-gray-800 font-medium">{item.description}</td>
                      <td className="py-5 px-4 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-5 px-4 text-right text-gray-600">{currency} {(item.unitPrice || 0).toLocaleString()}</td>
                      <td className="py-5 px-4 text-right font-semibold text-gray-900">{currency} {(item.amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mb-16 relative z-10">
              <div className="w-full max-w-xs">
                <div className="flex justify-between py-2 text-gray-600 border-b border-gray-100">
                  <span className="font-medium">Subtotal:</span>
                  <span>{currency} {(subtotal || 0).toLocaleString()}</span>
                </div>
                {vatAmount > 0 && (
                  <div className="flex justify-between py-2 text-gray-600 border-b border-gray-100">
                    <span className="font-medium">Tax / VAT:</span>
                    <span>{currency} {(vatAmount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between py-4 mt-2 text-2xl font-bold text-gray-900 border-t-4 border-slate-900">
                  <span>Total Due:</span>
                  <span className="text-emerald-600">{currency} {(total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="relative z-10 pt-8 border-t border-gray-200">
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-6 text-center">
                <h4 className="font-bold text-emerald-800 mb-2 flex items-center justify-center gap-2"><CreditCard size={18}/> Payment Instructions</h4>
                <p className="text-emerald-700 text-sm mb-3">Please pay via Mobile Money to the number below, or use the secure online payment link.</p>
                <p className="text-xs text-gray-500 break-all font-mono bg-white py-2 px-4 rounded border border-gray-200 inline-block">{paymentLink}</p>
              </div>
              <p className="text-center text-gray-400 text-xs mt-8">Generated by InvoicePro CM • Professional Invoicing for Cameroon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



