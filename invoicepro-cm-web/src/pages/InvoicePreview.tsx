import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import { ArrowLeft, Printer, MessageCircle, Mail } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function InvoicePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [business, setBusiness] = useState<any>(null);
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
    api("/business").then(setBusiness).catch(console.error);
  }, [id]);

  if (loading) return <div className="p-12 text-center text-gray-500">Loading invoice...</div>;
  if (!invoice) return <div className="p-12 text-center text-red-500">Invoice not found</div>;

  const { customer, lineItems, invoiceNumber, issueDate, dueDate, subtotal, vatAmount, vatRate, amountPaid, balanceDue, total, currency, publicToken, status } = invoice;

  const paymentLink = `${window.location.origin}/i/${publicToken}`;
  const whatsappMessage = `Hello ${customer?.name || 'Customer'},%0A%0APlease find your invoice *${invoiceNumber}* for *${currency || 'XAF'} ${(total || 0).toLocaleString()}*.%0A%0AView and pay securely here: ${paymentLink}%0A%0AThank you for your business!`;
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  const money = (amount: number) => `${currency || 'XAF'} ${Number(amount || 0).toLocaleString()}`;
  const fmtDate = (d: any) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const handleDownloadPDF = async () => {
    if (!id || !invoice) return;
    setDownloading(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("invoicepro_token");
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
      const res = await fetch(`${baseUrl}/invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to download PDF");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error generating PDF", error);
      showToast(error.message || "Error generating PDF.", "error");
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

  const statusPill = status === "PAID" ? "bg-emerald-600" : status === "OVERDUE" ? "bg-red-600" : "bg-amber-600";

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Toolbar */}
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

      {/* ═══ PREMIUM INVOICE PREVIEW (matches PDF) ═══ */}
      <div className="max-w-4xl mx-auto p-4 my-8">
        <div ref={invoiceRef} className="bg-white shadow-2xl rounded-xl overflow-hidden">

          {/* Header band */}
          <div className="bg-slate-900 px-10 md:px-14 py-10">
            <div className="flex justify-between items-start gap-6">
              <div className="flex items-start gap-4">
                {business?.logoUrl && (
                  <div className="bg-white rounded-xl w-16 h-16 flex items-center justify-center p-2 shrink-0">
                    <img src={business.logoUrl} alt="Logo" className="max-h-12 max-w-12 object-contain" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-white">{business?.name || "InvoicePro CM"}</h2>
                  {business?.phone && <p className="text-sm text-slate-300 mt-1">{business.phone}</p>}
                  {business?.email && <p className="text-sm text-slate-300">{business.email}</p>}
                  {business?.address && <p className="text-sm text-slate-300">{business.address}</p>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <h1 className="text-3xl font-bold text-white tracking-wide">INVOICE</h1>
                <p className="text-emerald-400 font-bold mt-1">{invoiceNumber}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-white ${statusPill}`}>
                  {status}
                </span>
              </div>
            </div>
          </div>
          {/* Emerald accent stripe */}
          <div className="h-1 bg-emerald-600"></div>

          <div className="px-10 md:px-14 py-10">
            {/* Billed To + Dates */}
            <div className="flex justify-between items-start gap-8 mb-12 flex-wrap">
              <div>
                <h3 className="text-xs font-bold text-emerald-600 tracking-widest mb-2">BILLED TO</h3>
                <p className="font-bold text-slate-900 text-lg">{customer?.name || "Walk-in Customer"}</p>
                {customer?.email && <p className="text-sm text-slate-500">{customer.email}</p>}
                {customer?.phone && <p className="text-sm text-slate-500">{customer.phone}</p>}
                {customer?.address && <p className="text-sm text-slate-500">{customer.address}</p>}
              </div>
              <div className="bg-slate-50 rounded-lg px-6 py-4 w-72">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest">ISSUE DATE</span>
                  <span className="text-sm font-bold text-slate-900">{fmtDate(issueDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest">DUE DATE</span>
                  <span className="text-sm font-bold text-red-600">{fmtDate(dueDate)}</span>
                </div>
              </div>
            </div>

            {/* Line items */}
            <table className="w-full mb-10">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="text-left py-3 px-4 text-[10px] font-bold tracking-widest rounded-l-md">DESCRIPTION</th>
                  <th className="text-right py-3 px-2 text-[10px] font-bold tracking-widest w-14">QTY</th>
                  <th className="text-right py-3 px-2 text-[10px] font-bold tracking-widest w-28">UNIT PRICE</th>
                  <th className="text-right py-3 px-4 text-[10px] font-bold tracking-widest rounded-r-md w-28">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {lineItems?.map((item: any, idx: number) => (
                  <tr key={item.id} className={idx % 2 === 0 ? "bg-slate-50" : ""}>
                    <td className="py-3 px-4 text-sm text-slate-900">{item.description}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{item.quantity}</td>
                    <td className="py-3 px-2 text-sm text-slate-500 text-right">{money(item.unitPrice)}</td>
                    <td className="py-3 px-4 text-sm text-slate-900 font-bold text-right">{money(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Notes + Totals */}
            <div className="flex justify-between items-start gap-8 mb-8">
              <div className="max-w-xs">
                {(invoice.notes || invoice.paymentTerms) && (
                  <>
                    <h4 className="text-[10px] font-bold text-emerald-600 tracking-widest mb-2">NOTES & PAYMENT TERMS</h4>
                    <p className="text-sm text-slate-500 whitespace-pre-line">{invoice.notes || invoice.paymentTerms}</p>
                  </>
                )}
              </div>
              <div className="w-72 ml-auto">
                <div className="flex justify-between py-1.5 text-sm border-b border-slate-200">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-900">{money(subtotal)}</span>
                </div>
                {Number(vatAmount || 0) > 0 && (
                  <div className="flex justify-between py-1.5 text-sm border-b border-slate-200">
                    <span className="text-slate-500">VAT {vatRate ? `${vatRate}%` : ""}</span>
                    <span className="text-slate-900">{money(vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 text-sm border-b border-slate-200">
                  <span className="text-slate-500">Amount Paid</span>
                  <span className="text-slate-900">{money(amountPaid)}</span>
                </div>
                <div className="bg-slate-900 rounded-md px-4 py-3 flex justify-between items-center mt-2">
                  <span className="text-white font-bold text-sm tracking-wide">BALANCE DUE</span>
                  <span className="text-emerald-400 font-bold">{money(balanceDue !== undefined && balanceDue !== null ? balanceDue : total)}</span>
                </div>
                <p className="text-right text-[11px] text-slate-400 mt-2">
                  Generated on {new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "medium" })}
                </p>
              </div>
            </div>

            {/* Signatures (bottom) */}
            <div className="flex justify-between gap-16 mt-14">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-14">BUSINESS OWNER</p>
                <div className="border-t border-slate-300 pt-1.5">
                  <p className="text-[10px] text-slate-400 text-center">Business Owner</p>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-14">CUSTOMER</p>
                <div className="border-t border-slate-300 pt-1.5">
                  <p className="text-[10px] text-slate-400 text-center">Customer</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-10 pt-4 border-t-2 border-emerald-600">
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <p className="text-xs text-slate-500 break-all">View and pay online: <a href={paymentLink || "#"} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-medium">{paymentLink || "MISSING LINK"}</a></p>
                <p onClick={() => navigate("/login")} title="Go to login" className={`text-xs whitespace-nowrap cursor-pointer hover:underline transition-colors ${business?.plan === "PRO" ? "text-emerald-600 font-medium" : "text-slate-400"}`}>{business?.plan === "PRO" ? "InvoicePro CM — Pro" : "Generated with InvoicePro CM"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




