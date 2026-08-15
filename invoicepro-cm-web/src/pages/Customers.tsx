import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Layout from "../components/Layout";

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadCustomers() {
    const res = await api("/customers");
    setCustomers(res.customers || []);
  }

  useEffect(() => { loadCustomers().catch(console.error); }, []);

  function resetForm() {
    setEditingId(null);
    setName(""); setEmail(""); setPhone(""); setCity("");
    setError(""); setSuccess("");
  }

  function startEdit(customer: any) {
    setEditingId(customer.id);
    setName(customer.name);
    setEmail(customer.email || "");
    setPhone(customer.phone || "");
    setCity(customer.city || "");
    setError(""); setSuccess("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    setError(""); setSuccess("");
    try {
      await api(`/customers/${id}`, { method: "DELETE" });
      setSuccess("Customer deleted successfully.");
      await loadCustomers();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function submit(e: any) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      if (editingId) {
        await api(`/customers/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ name, email: email || null, phone: phone || null, city: city || null }),
        });
        setSuccess("Customer updated successfully.");
      } else {
        await api("/customers", {
          method: "POST",
          body: JSON.stringify({ name, email: email || null, phone: phone || null, city: city || null }),
        });
        setSuccess("Customer created successfully.");
      }
      resetForm();
      await loadCustomers();
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Customers</h1>

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}
      {success && <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 h-fit">
          <h2 className="font-semibold mb-4">{editingId ? "Edit Customer" : "Add Customer"}</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button disabled={loading} className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 disabled:opacity-60">
                {loading ? "Saving..." : editingId ? "Update Customer" : "Save Customer"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 font-semibold">Customer List</div>
          {customers.length === 0 ? (
            <div className="p-4 text-gray-500">No customers yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium">{customer.name}</td>
                      <td className="px-4 py-3 text-gray-500">{customer.phone}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => startEdit(customer)} className="text-blue-600 hover:underline mr-3">Edit</button>
                        <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}