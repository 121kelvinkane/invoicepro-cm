const fs = require('fs');
const file = 'src/pages/InvoicePreview.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/\r\n/g, '\n');

// 1. Add PDF snapshot libraries
if (!code.includes('html2canvas-pro')) {
  code = code.replace(
    'import { ArrowLeft, Printer, MessageCircle, Mail } from "lucide-react";',
    'import { ArrowLeft, Printer, MessageCircle, Mail } from "lucide-react";\nimport { jsPDF } from "jspdf";\nimport html2canvas from "html2canvas-pro";'
  );
}

// 2. Amount-in-words helper + pixel-perfect snapshot download
const newFunc = `const numberToWords = (num: number): string => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const two = (n: number): string => (n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : ""));
    const three = (n: number): string => {
      const h = Math.floor(n / 100);
      const r = n % 100;
      return (h ? ones[h] + " Hundred" + (r ? " " : "") : "") + (r ? two(r) : "");
    };
    if (num === 0) return "Zero";
    const scales = ["", "Thousand", "Million", "Billion"];
    let words = "";
    let i = 0;
    while (num > 0 && i < scales.length) {
      const chunk = num % 1000;
      if (chunk) words = three(chunk) + (scales[i] ? " " + scales[i] : "") + (words ? " " + words : "");
      num = Math.floor(num / 1000);
      i++;
    }
    return words;
  };

  const amountInWords = numberToWords(Math.floor(Number(total || 0))) + " " + (currency || "XAF") + " Only";

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !invoice) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
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
      pdf.save("Invoice-" + invoice.invoiceNumber + ".pdf");
      showToast("PDF downloaded!", "success");
    } catch (error: any) {
      console.error("Error generating PDF", error);
      showToast(error.message || "Error generating PDF.", "error");
    } finally {
      setDownloading(false);
    }
  };`;

const startIdx = code.indexOf('const handleDownloadPDF');
const endIdx = code.indexOf('const handleEmailPaymentLink');
if (startIdx > -1 && endIdx > -1) {
  code = code.slice(0, startIdx) + newFunc + '\n\n  ' + code.slice(endIdx);
  console.log('OK: download function replaced with pixel-perfect snapshot');
} else {
  console.log('WARN: download function markers not found');
}

// 3. Add "Amount in Words" line under BALANCE DUE
const anchor = '</div>\n                <p className="text-right text-[11px] text-slate-400 mt-2">';
const wordsRow = '</div>\n                <p className="text-right text-[11px] text-slate-500 mt-2">\n                  <span className="font-bold text-slate-600">Amount in Words:</span> {amountInWords}\n                </p>\n                <p className="text-right text-[11px] text-slate-400 mt-2">';
if (!code.includes('Amount in Words') && code.includes(anchor)) {
  code = code.replace(anchor, wordsRow);
  console.log('OK: Amount in Words added');
} else {
  console.log('WARN: Amount in Words anchor not found');
}

fs.writeFileSync(file, code);
console.log('DONE');
