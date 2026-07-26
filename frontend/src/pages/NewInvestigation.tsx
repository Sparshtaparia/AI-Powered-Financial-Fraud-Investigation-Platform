import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { Search, Loader2 } from 'lucide-react'
import { useInvestigationStore } from '../store/investigationStore'

export default function NewInvestigation() {
    const [customerId, setCustomerId] = useState('CUST_521');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const setCase = useInvestigationStore(s => s.setCurrentCase);

    const handleInvestigate = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.post('/investigate', { customer_id: customerId });
            setCase(res.data.case_id, res.data);
            navigate(`/investigations/${res.data.case_id}`);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to trigger investigation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-20">
            <div className="glass-panel p-8">
                <h2 className="text-2xl font-semibold text-slate-100 mb-2">Initiate Investigation</h2>
                <p className="text-slate-400 mb-8">Deploy Aegis Planner to analyze a customer profile.</p>

                <form onSubmit={handleInvestigate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Customer ID</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                            <input 
                                type="text" 
                                value={customerId}
                                onChange={e => setCustomerId(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                                placeholder="e.g. CUST_521"
                            />
                        </div>
                    </div>

                    {error && <div className="p-3 bg-red-900/30 border border-red-800/50 text-red-400 rounded-lg text-sm">{error}</div>}

                    <button 
                        type="submit" 
                        disabled={loading || !customerId}
                        className="w-full bg-brand hover:bg-brand-dark text-white py-3 rounded-lg font-medium transition-all shadow-[0_0_10px_rgba(14,165,233,0.3)] disabled:opacity-50 flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                        {loading ? 'Orchestrating capabilities...' : 'Launch Planner'}
                    </button>
                </form>
            </div>
        </div>
    )
}
