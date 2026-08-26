const fs = require('fs');
const file = 'src/pages/InvoicePreview.tsx';
let code = fs.readFileSync(file, 'utf8');

// Match the current amount in words paragraph
const oldPattern = /<p className="text-right text-sm font-bold[^"]*">\s*Amount in Words: <span className="[^"]*">\{amountInWords\}<\/span>\s*<\/p>/;

// New green, bold, single-line version (whitespace-nowrap forces it on one line)
const newBlock = `<p className="text-right text-base font-bold text-emerald-600 mt-3 whitespace-nowrap">
                  Amount in Words: <span className="font-extrabold text-emerald-700 uppercase">{amountInWords}</span>
                </p>`;

if (code.match(oldPattern)) {
  code = code.replace(oldPattern, newBlock);
  console.log('OK: Made green and single line!');
} else {
  console.log('WARN: Applying fallback search...');
  code = code.replace(
    /<p className="text-right text-sm font-bold text-slate-700 mt-3">/g,
    '<p className="text-right text-base font-bold text-emerald-600 mt-3 whitespace-nowrap">'
  );
  code = code.replace(
    /Amount in Words: <span className="font-extrabold text-slate-900 uppercase">\{amountInWords\}<\/span>/g,
    'Amount in Words: <span className="font-extrabold text-emerald-700 uppercase">{amountInWords}</span>'
  );
  console.log('OK: Fallback applied!');
}

fs.writeFileSync(file, code);
