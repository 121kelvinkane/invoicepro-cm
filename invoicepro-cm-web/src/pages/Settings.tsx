import { useEffect, useState } from "react";
import { api, getToken } from "../lib/api";
import Layout from "../components/Layout";

export default function Settings() {
  const [profile, setProfile] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  async function loadProfile() {
    const res = await api("/profile");
    setProfile(res.profile);
  }

  useEffect(() => { loadProfile(); }, []);

  async function handleUpload(e: any) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setMsg("");

    const formData = new FormData();
    formData.append("logo", file);

    try {
      const res = await fetch("http://localhost:4000/api/v1/profile/logo", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMsg("Logo uploaded successfully!");
      await loadProfile();
    } catch (err: any) {
      setMsg("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function togglePlan() {
    await api("/profile/toggle-plan", { method: "POST" });
    await loadProfile();
  }

  if (!profile) return <Layout><div>Loading...</div></Layout>;

  const isPro = profile.plan === "PRO";

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Settings & Branding</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Business Logo</h2>
          
          {profile.logoUrl && (
            <div className="mb-4">
              <img src={`http://localhost:4000/${profile.logoUrl}`} alt="Logo" className="h-20 object-contain border p-2 rounded" />
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            <button disabled={uploading || !file} className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50">
              {uploading ? "Uploading..." : "Upload Logo"}
            </button>
          </form>
          {msg && <p className="mt-3 text-sm text-blue-600">{msg}</p>}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Subscription Plan</h2>
          <div className={`p-4 rounded-lg mb-4 ${isPro ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50 border border-gray-200"}`}>
            <p className="font-bold text-lg">Current Plan: {isPro ? "PRO ✨" : "FREE"}</p>
            <p className="text-sm text-gray-600 mt-1">
              {isPro 
                ? "You have no watermarks on your PDFs and full branding control." 
                : "Your PDFs include the InvoicePro CM watermark."}
            </p>
          </div>
          <button onClick={togglePlan} className={`w-full py-2 rounded-lg font-bold text-white ${isPro ? "bg-gray-600 hover:bg-gray-700" : "bg-yellow-500 hover:bg-yellow-600"}`}>
            {isPro ? "Downgrade to Free" : "Upgrade to Pro (Test)"}
          </button>
        </div>
      </div>
    </Layout>
  );
}