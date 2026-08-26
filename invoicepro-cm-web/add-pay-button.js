const fs = require('fs');
let code = fs.readFileSync('src/pages/InvoiceDetails.tsx', 'utf8');

// 1. Add loading state for simulate payment
code = code.replace(
  'const [paymentForm, setPaymentForm] = useState({ method: "MTN_MOMO", amount: "", reference: "", note: "" });',
  'const [paymentForm, setPaymentForm] = useState({ method: "MTN_MOMO", amount: "", reference: "", note: "" });\n  const [simulating, setSimulating] = useState(false);'
);

// 2. Add the simulate payment function
const simFunc = `
  async function simulatePayment() {
    setSimulating(true);
    try {
      const res = await api(\`/invoices/\${id}/pay\`, { method: "POST" });
      showToast("Payment successful! (Test Mode)", "success");
      await loadInvoice();
    } catch (err: any) {
      showToast(err.message || "Payment failed", "error");
    } finally {
      setSimulating(false);
    }
  }
`;

code = code.replace(
  'async function handlePaymentSubmit(e: any) {',
  simFunc + '\n  async function handlePaymentSubmit(e: any) {'
);

// 3. Add the button next to ADD PAYMENT
const newButton = `          {invoice.status !== "PAID" && (
            <button
              onClick={simulatePayment}
              disabled={simulating}
              className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors"
            >
              {simulating ? "Processing..." : "Simulate Payment"}
            </button>
          )}
`;

code = code.replace(
  '          {invoice.status !== "PAID" && (\n            <button\n              onClick={() => setShowPaymentModal(true)}',
  newButton + '          {invoice.status !== "PAID" && (\n            <button\n              onClick={() => setShowPaymentModal(true)}'
);

fs.writeFileSync('src/pages/InvoiceDetails.tsx', code, 'utf8');
console.log('✅ Simulate Payment button added to InvoiceDetails!');
