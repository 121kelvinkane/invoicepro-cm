import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import { useToast } from "./Toast";
import { Upload, Building2, Save, X } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

export default function BusinessProfileCard() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState({
    name: "", tin: "", address: "", phone: "", email: "", logoUrl: "", signatureUrl: "", momoNumber: ""
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const sigRef = useRef<any>(null);

  useEffect(() => {
    api("/business")
      .then(data => {
        if (data && typeof data === "object") {
          setProfile(prev => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.error("Failed to fetch business profile", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("logo", file);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("invoicepro_token");
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
      const res = await fetch(`${baseUrl}/business/logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        const fullUrl = data.url;
        setProfile(prev => ({ ...prev, logoUrl: fullUrl }));
        showToast("Logo uploaded! Click Save to apply.", "success");
      }
    } catch (err) {
      showToast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const saveSignature = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      showToast("Please draw your signature first", "error");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = sigRef.current.toDataURL("image/png");
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "signature.png", { type: "image/png" });
      const formData = new FormData();
      formData.append("signature", file);

      const token = localStorage.getItem("token") || localStorage.getItem("invoicepro_token");
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
      const res = await fetch(`${baseUrl}/business/signature`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        const fullUrl = data.url;
        setProfile(prev => ({ ...prev, signatureUrl: fullUrl }));
        showToast("Signature saved! Click Save Profile to apply.", "success");
      }
    } catch (err) {
      showToast("Failed to save signature", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e?: any) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await api("/business", { 
        method: "PUT", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile) 
      });
      showToast("Business profile saved!", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-50 rounded-lg"><Building2 className="text-primary-600" size={24} /></div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Business Profile</h2>
          <p className="text-sm text-gray-500">This information will appear on your invoices.</p>
        </div>
      </div>

      {/* Logo Section */}
      <div className="mb-6 flex items-center gap-6">
        <div className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
          {profile.logoUrl ? (
            <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <Upload className="text-gray-400" size={24} />
          )}
        </div>
        <div>
          <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
            <Upload size={16} /> {uploading ? "Uploading..." : "Upload Logo"}
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </label>
          <p className="text-xs text-gray-400 mt-2">PNG or JPG. Recommended square.</p>
        </div>
      </div>

      {/* Signature Drawing Section */}
      <div className="mb-6 border-t border-gray-100 pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Signature</label>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 w-full">
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
              <SignatureCanvas
                ref={sigRef}
                penColor="black"
                canvasProps={{ className: "w-full", style: { height: "120px", width: "100%" } }}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => sigRef.current?.clear()}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-1"
              >
                <X size={12} /> Clear
              </button>
              <button
                type="button"
                onClick={saveSignature}
                disabled={uploading}
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50"
              >
                {uploading ? "Saving..." : "Save Signature"}
              </button>
            </div>
          </div>
          <div className="w-48 h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
            {profile.signatureUrl ? (
              <img src={profile.signatureUrl.startsWith("http") ? profile.signatureUrl : (import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1") + profile.signatureUrl} alt="Saved Signature" className="max-w-full max-h-full object-contain p-2" />
            ) : (
              <span className="text-xs text-gray-400 text-center px-2">Saved signature will appear here</span>
            )}
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
          <input name="name" value={profile.name || ""} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Douala Tech Solutions" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">TIN (Tax ID)</label>
          <input name="tin" value={profile.tin || ""} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. 123456789" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input name="address" value={profile.address || ""} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Akwa, Douala, Cameroon" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
          <input name="phone" value={profile.phone || ""} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="+237 6XX XXX XXX" />
        </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MoMo Number (Auto-Payout)</label>
                <input
                  type="text"
                  placeholder="6XX XXX XXX"
                  value={profile.momoNumber || ""}
                  onChange={(e) => setProfile({ ...profile, momoNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Payments will be auto-sent to this number.</p>
              </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
          <input name="email" value={profile.email || ""} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="contact@business.com" />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="mt-8 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-md flex items-center gap-2 disabled:opacity-50">
        <Save size={18} /> {saving ? "Saving..." : "Save Business Profile"}
      </button>
    </div>
  );
}

