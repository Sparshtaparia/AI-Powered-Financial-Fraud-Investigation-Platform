import { useState } from 'react'
import { Shield } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
// We can just mock a token for demo if needed, but since we rely on Gateway, we will hardcode a valid signed token for the demo user using the local secret.

// In a real app this would hit /login. For the hackathon/demo, we'll synthesize a token locally using a mock function since we know the HS256 secret.
import { SignJWT } from 'jose'

export default function Login() {
    const login = useAuthStore(s => s.login);
    const [loading, setLoading] = useState(false);

    const handleDemoLogin = async () => {
        setLoading(true);
        const secret = new TextEncoder().encode('super-secret-aegis-key-for-local-dev-only');
        const token = await new SignJWT({ "sub": "demo-analyst", "roles": ["investigator"], "iss": "aegis-auth" })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('2h')
            .sign(secret);

        setTimeout(() => {
            login(token);
        }, 800);
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-soc-bg">
            <div className="glass-panel p-10 max-w-md w-full text-center">
                <Shield className="w-20 h-20 text-brand mx-auto mb-6 drop-shadow-[0_0_20px_rgba(14,165,233,0.5)]" />
                <h1 className="text-3xl font-bold mb-2 tracking-widest text-slate-100">AEGIS<span className="text-brand">AML</span></h1>
                <p className="text-slate-400 mb-8 font-mono text-sm uppercase">Financial Crime Operations Center</p>
                <button 
                    onClick={handleDemoLogin}
                    disabled={loading}
                    className="w-full bg-brand hover:bg-brand-dark text-white py-3 rounded-lg font-semibold transition-all shadow-[0_0_15px_rgba(14,165,233,0.4)] disabled:opacity-50"
                >
                    {loading ? 'Authenticating...' : 'Enter Console (Demo Mode)'}
                </button>
            </div>
        </div>
    )
}
