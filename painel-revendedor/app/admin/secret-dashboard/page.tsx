'use client';
import { useState, useEffect } from 'react';
import { Shield, Power, RefreshCw, X, Eye } from 'lucide-react';

export default function AdminDashboard() {
    const [resellers, setResellers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedResellerKeys, setSelectedResellerKeys] = useState<any[] | null>(null);
    const [viewingResellerName, setViewingResellerName] = useState('');

    const fetchResellers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/list');
            const data = await res.json();
            if (data.resellers) {
                setResellers(data.resellers);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchResellers();
    }, []);

    const toggleReseller = async (id: string, currentStatus: boolean) => {
        await fetch('/api/admin/toggle', {
            method: 'POST',
            body: JSON.stringify({ resellerId: id, isActive: !currentStatus }),
        });
        fetchResellers();
    };

    const viewKeys = async (resellerId: string, name: string) => {
        setViewingResellerName(name);
        // Fetch keys for this reseller
        const res = await fetch(`/api/admin/keys?resellerId=${resellerId}`);
        const data = await res.json();
        if (data.keys) {
            setSelectedResellerKeys(data.keys);
        } else {
            setSelectedResellerKeys([]);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white font-mono p-8 relative">
            <h1 className="text-3xl font-bold mb-8 text-red-500 border-b border-red-900 pb-4 flex items-center gap-2">
                <Shield /> ADMIN KILL SWITCH
            </h1>

            <div className="grid gap-4">
                {resellers.map((r) => (
                    <div key={r.id} className={`p-4 border rounded flex flex-col md:flex-row justify-between items-center gap-4 ${r.is_active ? 'border-green-500/50 bg-green-900/10' : 'border-red-500/50 bg-red-900/10'}`}>
                        <div className="flex-1">
                            <div className="font-bold text-lg">{r.name}</div>
                            <div className="text-xs opacity-50 font-mono bg-black/30 p-1 rounded inline-block mt-1">{r.secret_key}</div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => viewKeys(r.id, r.name)}
                                className="px-4 py-2 rounded font-bold border border-blue-500 text-blue-500 hover:bg-blue-500/10 transition flex items-center gap-2 text-sm"
                            >
                                <Eye size={16} /> VER KEYS
                            </button>

                            <button
                                onClick={() => toggleReseller(r.id, r.is_active)}
                                className={`px-4 py-2 rounded font-bold flex items-center gap-2 transition text-sm ${r.is_active ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}
                            >
                                <Power size={16} />
                                {r.is_active ? 'BLOQUEAR' : 'ATIVAR'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {resellers.length === 0 && !loading && <div className="text-gray-500">Nenhum revendedor encontrado. Use o banco de dados para adicionar o primeiro.</div>}

            {/* MODAL DE VISUALIZACAO */}
            {selectedResellerKeys && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-green-500/30 rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gray-800/50">
                            <h2 className="font-bold text-xl text-green-400">Keys de: {viewingResellerName}</h2>
                            <button onClick={() => setSelectedResellerKeys(null)} className="text-gray-400 hover:text-white transition">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-black/40">
                            {selectedResellerKeys.length === 0 ? (
                                <div className="text-center opacity-50 py-20">Este revendedor ainda não gerou nenhuma key.</div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="text-gray-500 border-b border-gray-700 uppercase text-xs">
                                        <tr>
                                            <th className="pb-3 pl-2">Key</th>
                                            <th className="pb-3 text-center">Tipo</th>
                                            <th className="pb-3 text-center">Data</th>
                                            <th className="pb-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {selectedResellerKeys.map((k) => (
                                            <tr key={k.id} className="hover:bg-white/5 transition">
                                                <td className="py-3 pl-2 text-green-400 font-mono font-bold tracking-wider">{k.license_key}</td>
                                                <td className="py-3 text-center opacity-70 uppercase text-xs">{k.duration_type}</td>
                                                <td className="py-3 text-center opacity-50">{new Date(k.created_at).toLocaleDateString()}</td>
                                                <td className="py-3 text-center">
                                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${k.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-500'}`}>
                                                        {k.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="p-3 border-t border-white/10 bg-gray-800/50 text-right text-xs opacity-50">
                            Total: {selectedResellerKeys.length} chaves
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
