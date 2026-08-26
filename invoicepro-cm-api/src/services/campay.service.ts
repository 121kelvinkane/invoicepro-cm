const CAMPAY_API = "https://api.campay.app/api";

export async function getCampayToken(): Promise<string> {
  const res = await fetch(`${CAMPAY_API}/token/auth/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.CAMPAY_CLIENT_ID,
      client_secret: process.env.CAMPAY_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error("Campay auth failed: " + res.status);
  const data: any = await res.json();
  const token = data.access_token || data.token;
  if (!token) throw new Error("No token received from Campay. Check your keys.");
  return token;
}

export async function collectPayment(params: {
  amount: number;
  phone: string;
  reference: string;
  description: string;
}) {
  const token = await getCampayToken();
  
  let phone = params.phone.replace(/\s+/g, "");
  if (!phone.startsWith("237")) phone = "237" + phone;

  const res = await fetch(`${CAMPAY_API}/collect/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount: params.amount,
      phone_number: phone,
      external_reference: params.reference,
      description: params.description,
      notify_url: "https://invoicepro-cm-api.onrender.com/api/v1/webhooks/campay",
    }),
  });
  
  if (!res.ok) {
    const errText = await res.text();
    throw new Error("Campay collect failed: " + errText);
  }
  return res.json();
}

export async function transferToOwner(params: {
  amount: number;
  phone: string;
  reference: string;
  description: string;
}) {
  const token = await getCampayToken();
  
  let phone = params.phone.replace(/\s+/g, "");
  if (!phone.startsWith("237")) phone = "237" + phone;

  console.log(`💸 Transferring ${params.amount} FCFA to ${phone}...`);

  const res = await fetch(`${CAMPAY_API}/transfer/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount: params.amount,
      phone_number: phone,
      external_reference: params.reference,
      description: params.description,
    }),
  });
  
  if (!res.ok) {
    const errText = await res.text();
    throw new Error("Campay transfer failed: " + errText);
  }
  
  const result = await res.json();
  console.log(`✅ Transfer successful:`, result);
  return result;
}
