'use client';
import { useState, useEffect } from 'react';
import { Terminal, Key, ShieldAlert, LogOut, RefreshCcw } from 'lucide-react';

export default function ResellerPanel() {
    const [secretKey, setSecretKey] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [history, setHistory] = useState<any[]>([]);

    // Carregar sessão
    useEffect(() => {
        const savedKey = localStorage.getItem('reseller_secret');
        if (savedKey) {
            setSecretKey(savedKey);
            setIsAuthenticated(true);
        }
    }, []);

    // Carregar histórico quando autenticado
    useEffect(() => {
        if (isAuthenticated && secretKey) {
            fetchHistory();
        }
    }, [isAuthenticated, secretKey]);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/reseller/my-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secretKey })
            });
            const data = await res.json();
            if (data.keys) {
                setHistory(data.keys);
            }
        } catch (e) {
            console.error('Erro ao carregar histórico');
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (secretKey.length > 3) {
            localStorage.setItem('reseller_secret', secretKey);
            setIsAuthenticated(true);
        }
    };

    const logout = () => {
        localStorage.removeItem('reseller_secret');
        setSecretKey('');
        setIsAuthenticated(false);
        setGeneratedKey(null);
        setHistory([]);
    };

    const generateKey = async (duration: string) => {
        setLoading(true);
        setError('');
        setGeneratedKey(null);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secretKey, durationType: duration }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao gerar key');
            }

            setGeneratedKey(data.key);
            fetchHistory(); // Atualiza histórico do banco
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-black text-green-500 font-mono">
                <div className="w-full max-w-md p-8 border border-green-500/30 rounded-lg bg-gray-900/50 backdrop-blur shadow-[0_0_20px_rgba(0,255,0,0.1)]">
                    <div className="flex justify-center mb-6">
                        <Terminal size={48} />
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-8 uppercase tracking-widest">Acesso Revendedor</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Digite sua Secret Key"
                            value={secretKey}
                            onChange={(e) => setSecretKey(e.target.value)}
                            className="w-full bg-black border border-green-500/50 p-3 rounded text-center focus:outline-none focus:border-green-400 focus:shadow-[0_0_10px_rgba(0,255,0,0.2)] transition"
                        />
                        <button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-500 text-black font-bold p-3 rounded transition uppercase"
                        >
                            Entrar no Sistema
                        </button>
                    </form>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-green-500 font-mono p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-12 border-b border-green-500/30 pb-4">
                    <div className="flex items-center gap-2">
                        <Terminal className="text-green-400" />
                        <span className="text-xl font-bold tracking-widest">LKL RESELLER_V1</span>
                    </div>
                    <button onClick={logout} className="flex items-center gap-2 text-red-500 hover:text-red-400 text-sm font-bold">
                        <LogOut size={16} /> SAIR
                    </button>
                </header>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Generator Section */}
                    <div className="border border-green-500/30 rounded-lg p-6 bg-gray-900/30">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Key size={20} /> GERAR NOVA LICENÇA
                        </h2>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button onClick={() => generateKey('monthly')} disabled={loading} className="bg-green-900/30 hover:bg-green-500/20 border border-green-500/50 p-4 rounded transition text-center hover:scale-[1.02] active:scale-[0.98]">
                                <div className="font-bold">MENSAL</div>
                                <div className="text-xs opacity-70">30 DIAS</div>
                            </button>
                            <button onClick={() => generateKey('weekly')} disabled={loading} className="bg-green-900/30 hover:bg-green-500/20 border border-green-500/50 p-4 rounded transition text-center hover:scale-[1.02] active:scale-[0.98]">
                                <div className="font-bold">SEMANAL</div>
                                <div className="text-xs opacity-70">7 DIAS</div>
                            </button>
                        </div>

                        {loading && <div className="text-center animate-pulse text-green-400">PROCESSANDO CRIPTOGRAFIA...</div>}

                        {error && (
                            <div className="bg-red-900/20 border border-red-500/50 text-red-500 p-4 rounded flex items-center gap-2 animate-shake">
                                <ShieldAlert />
                                <span>{error}</span>
                            </div>
                        )}

                        {generatedKey && (
                            <div className="bg-green-500/10 border border-green-500 p-6 rounded text-center mt-4">
                                <div className="text-sm opacity-70 mb-2">KEY GERADA COM SUCESSO</div>
                                <div className="text-2xl md:text-3xl font-bold select-all cursor-pointer text-white drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]">
                                    {generatedKey}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* History Section */}
                    <div className="border border-green-500/30 rounded-lg p-6 bg-gray-900/30 h-[500px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">MEUS LOGS</h2>
                            <button onClick={fetchHistory} className="p-2 hover:bg-green-500/10 rounded-full transition" title="Atualizar">
                                <RefreshCcw size={16} />
                            </button>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2 pr-2">
                            {history.length === 0 ? (
                                <div className="text-center opacity-30 py-10">NENHUMA KEY ENCONTRADA NO SERVIDOR</div>
                            ) : (
                                history.map((item, idx) => (
                                    <div key={idx} className="flex flex-col p-3 bg-black/50 border border-green-500/20 rounded hover:border-green-500/50 transition">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-green-300 font-bold tracking-wider">{item.license_key}</span>
                                            <span className={`text-[10px] px-1.5 rounded uppercase ${item.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs opacity-50">
                                            <span className="uppercase">{item.duration_type}</span>
                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
