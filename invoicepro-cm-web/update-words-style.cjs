const fs = require('fs');
const file = 'src/pages/InvoicePreview.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldPattern = /<p className="text-right text-\[11px\] text-slate-500 mt-2">\s*<span className="font-bold text-slate-600">Amount in Words:<\/span> \{amountInWords\}\s*<\/p>/;
const newBlock = `<p className="text-right text-sm font-bold text-slate-700 mt-3">
                  Amount in Words: <span className="font-extrabold text-slate-900 uppercase">{amountInWords}</span>
                </p>`;

if (code.match(oldPattern)) {
  code = code.replace(oldPattern, newBlock);
  console.log('OK: Amount in Words styling updated!');
} else {
  console.log('WARN: Pattern not found');
}

fs.writeFileSync(file, code);
