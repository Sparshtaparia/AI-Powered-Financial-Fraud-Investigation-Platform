import os
import textwrap

def write_file(path, content):
    if os.path.dirname(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(textwrap.dedent(content))

# Tailwind Config
write_file('frontend/tailwind.config.js', """\
    /** @type {import('tailwindcss').Config} */
    export default {
      content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
      ],
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              DEFAULT: '#0ea5e9',
              dark: '#0284c7',
            },
            soc: {
              bg: '#0f172a',
              panel: '#1e293b',
              border: '#334155'
            }
          }
        },
      },
      plugins: [],
    }
""")

write_file('frontend/postcss.config.js', """\
    export default {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    }
""")

write_file('frontend/src/index.css', """\
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    @layer base {
      body {
        @apply bg-soc-bg text-slate-200 antialiased h-screen overflow-hidden;
      }
      
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        @apply bg-soc-bg;
      }
      ::-webkit-scrollbar-thumb {
        @apply bg-slate-600 rounded;
      }
    }
    
    .glass-panel {
      @apply bg-soc-panel/80 backdrop-blur-md border border-soc-border rounded-xl shadow-xl;
    }
""")

# Zustand Stores
write_file('frontend/src/store/authStore.ts', """\
    import { create } from 'zustand'
    import { jwtDecode } from 'jwt-decode'

    interface AuthState {
        token: string | null;
        user: any | null;
        login: (token: string) => void;
        logout: () => void;
    }

    export const useAuthStore = create<AuthState>((set) => ({
        token: localStorage.getItem('aegis_token'),
        user: localStorage.getItem('aegis_token') ? jwtDecode(localStorage.getItem('aegis_token') as string) : null,
        login: (token) => {
            localStorage.setItem('aegis_token', token);
            set({ token, user: jwtDecode(token) });
        },
        logout: () => {
            localStorage.removeItem('aegis_token');
            set({ token: null, user: null });
        }
    }))
""")

write_file('frontend/src/store/investigationStore.ts', """\
    import { create } from 'zustand'

    interface InvestigationState {
        currentCaseId: string | null;
        caseData: any | null;
        setCurrentCase: (id: string, data: any) => void;
    }

    export const useInvestigationStore = create<InvestigationState>((set) => ({
        currentCaseId: null,
        caseData: null,
        setCurrentCase: (id, data) => set({ currentCaseId: id, caseData: data })
    }))
""")

# API Client
write_file('frontend/src/api/client.ts', """\
    import axios from 'axios'
    import { useAuthStore } from '../store/authStore'

    export const apiClient = axios.create({
        baseURL: 'http://localhost:8080/api/v1',
    });

    apiClient.interceptors.request.use((config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
""")

# Dashboard Layout
write_file('frontend/src/layouts/DashboardLayout.tsx', """\
    import { ReactNode } from 'react'
    import { Link, useLocation } from 'react-router-dom'
    import { Shield, Activity, FileSearch, Share2, Server, Settings, LogOut, FileCode } from 'lucide-react'
    import { useAuthStore } from '../store/authStore'

    export default function DashboardLayout({ children }: { children: ReactNode }) {
        const location = useLocation();
        const logout = useAuthStore(s => s.logout);
        
        const navItems = [
            { path: '/', icon: Activity, label: 'Dashboard' },
            { path: '/investigations', icon: FileSearch, label: 'Investigations' },
            { path: '/new', icon: Shield, label: 'New Case' },
            { path: '/evidence', icon: FileCode, label: 'Evidence Vault' },
            { path: '/graph', icon: Share2, label: 'Graph Explorer' },
            { path: '/health', icon: Server, label: 'Platform Health' },
            { path: '/settings', icon: Settings, label: 'Settings' }
        ];

        return (
            <div className="flex h-screen w-screen overflow-hidden bg-soc-bg text-slate-300 font-sans">
                {/* Sidebar */}
                <aside className="w-64 glass-panel m-4 flex flex-col justify-between">
                    <div>
                        <div className="p-6 flex items-center space-x-3 text-brand">
                            <Shield className="w-8 h-8" />
                            <h1 className="text-xl font-bold tracking-wider">AEGIS<span className="text-slate-100">AML</span></h1>
                        </div>
                        <nav className="mt-6 px-4 space-y-2">
                            {navItems.map(item => {
                                const active = location.pathname === item.path;
                                return (
                                    <Link key={item.path} to={item.path} className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${active ? 'bg-brand/20 text-brand font-semibold shadow-[0_0_15px_rgba(14,165,233,0.3)]' : 'hover:bg-slate-800/50 hover:text-slate-100'}`}>
                                        <item.icon className={`w-5 h-5 mr-3 ${active ? 'text-brand' : 'text-slate-400'}`} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    <div className="p-4 border-t border-soc-border">
                        <button onClick={logout} className="flex items-center w-full px-4 py-2 text-sm text-slate-400 hover:text-red-400 transition-colors">
                            <LogOut className="w-4 h-4 mr-2" /> Sign Out
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col h-full overflow-hidden p-4 pl-0">
                    <header className="glass-panel w-full h-16 flex items-center justify-between px-6 mb-4">
                        <div className="text-lg font-medium tracking-wide">SOC Analyst Console</div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-sm text-slate-400">Gateway Connected</span>
                            </div>
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto">
                        {children}
                    </div>
                </main>
            </div>
        )
    }
""")

# Pages
write_file('frontend/src/pages/Login.tsx', """\
    import { useState } from 'react'
    import { Shield } from 'lucide-react'
    import { useAuthStore } from '../store/authStore'
    import * as jose from 'jose' // We can just mock a token for demo if needed, but since we rely on Gateway, we will hardcode a valid signed token for the demo user using the local secret.
    
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
""")

write_file('frontend/src/pages/Dashboard.tsx', """\
    import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

    export default function Dashboard() {
        return (
            <div className="h-full space-y-6">
                <div className="grid grid-cols-4 gap-6">
                    <MetricCard title="Active Cases" value="24" icon={Activity} color="text-brand" />
                    <MetricCard title="High Risk Alerts" value="7" icon={AlertTriangle} color="text-red-500" />
                    <MetricCard title="Avg Latency" value="1.2s" icon={Clock} color="text-yellow-500" />
                    <MetricCard title="System Health" value="100%" icon={CheckCircle} color="text-green-500" />
                </div>
                
                <div className="grid grid-cols-3 gap-6 h-96">
                    <div className="col-span-2 glass-panel p-6">
                        <h2 className="text-lg font-semibold mb-4 text-slate-200 border-b border-soc-border pb-2">Recent Investigations</h2>
                        {/* Placeholder for table */}
                        <div className="text-slate-400 text-sm italic mt-10 text-center">Awaiting data pipeline...</div>
                    </div>
                    <div className="glass-panel p-6">
                        <h2 className="text-lg font-semibold mb-4 text-slate-200 border-b border-soc-border pb-2">Planner Events</h2>
                        <div className="text-slate-400 text-sm italic mt-10 text-center">Stream idle...</div>
                    </div>
                </div>
            </div>
        )
    }

    function MetricCard({title, value, icon: Icon, color}: any) {
        return (
            <div className="glass-panel p-6 flex items-center justify-between hover:-translate-y-1 transition-transform duration-300">
                <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-100">{value}</h3>
                </div>
                <div className={`p-4 rounded-full bg-slate-800/50 ${color}`}>
                    <Icon className="w-8 h-8" />
                </div>
            </div>
        )
    }
""")

write_file('frontend/src/pages/NewInvestigation.tsx', """\
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
""")

write_file('frontend/src/pages/InvestigationDetails.tsx', """\
    import { useInvestigationStore } from '../store/investigationStore'
    import { CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react'

    export default function InvestigationDetails() {
        const { currentCaseId, caseData } = useInvestigationStore();

        if (!caseData) {
            return <div className="text-center mt-20 text-slate-400">No active investigation loaded.</div>;
        }

        const riskLabel = caseData.summary?.risk?.label || "UNKNOWN";
        const riskScore = caseData.summary?.risk?.risk || 0;
        const isHigh = riskLabel === 'HIGH';

        return (
            <div className="h-full flex flex-col space-y-4 pb-4">
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100">{caseData.case_id}</h1>
                        <p className="text-slate-400 font-mono mt-1">Target: CUST_521 | Status: {caseData.status}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full border ${isHigh ? 'bg-red-900/20 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-green-900/20 border-green-500/50 text-green-500'}`}>
                        <span className="font-bold flex items-center">
                            {isHigh ? <ShieldAlert className="w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                            RISK LEVEL: {riskLabel} ({(riskScore * 100).toFixed(1)}%)
                        </span>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-4 flex-1 h-full min-h-0">
                    {/* Left Col: Timeline */}
                    <div className="col-span-3 glass-panel p-4 overflow-y-auto">
                        <h2 className="text-lg font-medium border-b border-soc-border pb-2 mb-4">Execution Timeline</h2>
                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                            {caseData.summary?.audit?.[0]?.errors?.length > 0 ? (
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-red-500 bg-red-900/50 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-panel p-4 rounded border border-red-500/30">
                                        <div className="font-bold text-slate-100">Partial Failure</div>
                                        <div className="text-slate-400 text-sm mt-1">{caseData.summary.audit[0].errors[0]}</div>
                                    </div>
                                </div>
                            ) : null}
                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-green-500 bg-green-900/50 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-panel p-4 rounded">
                                    <div className="font-bold text-slate-100">Orchestration Complete</div>
                                    <div className="text-slate-400 text-sm mt-1">Planner executed all capabilities successfully.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Center Col: Graph */}
                    <div className="col-span-6 glass-panel p-4 flex flex-col">
                        <h2 className="text-lg font-medium border-b border-soc-border pb-2 mb-4">Graph Topology</h2>
                        <div className="flex-1 bg-slate-900/50 rounded-lg border border-slate-800 flex items-center justify-center text-slate-500 italic">
                            (Neo4j Render Canvas)
                        </div>
                    </div>

                    {/* Right Col: Evidence & Actions */}
                    <div className="col-span-3 glass-panel p-4 flex flex-col space-y-4">
                        <h2 className="text-lg font-medium border-b border-soc-border pb-2">Evidence Commit</h2>
                        <div className="bg-slate-900 rounded p-4 border border-slate-700 font-mono text-xs overflow-hidden break-all text-slate-300">
                            <strong>Merkle Root:</strong><br/>
                            {caseData.summary?.evidence?.merkle_root || 'N/A'}
                        </div>
                        <h2 className="text-lg font-medium border-b border-soc-border pb-2 mt-4">Recommendations</h2>
                        <div className="text-sm text-slate-300 space-y-2">
                            {caseData.summary?.recommendations?.map((r: string, i: number) => (
                                <div key={i} className="bg-slate-800/50 p-3 rounded border border-slate-700">{r}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
""")

write_file('frontend/src/App.tsx', """\
    import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
    import DashboardLayout from './layouts/DashboardLayout'
    import Login from './pages/Login'
    import Dashboard from './pages/Dashboard'
    import NewInvestigation from './pages/NewInvestigation'
    import InvestigationDetails from './pages/InvestigationDetails'
    import { useAuthStore } from './store/authStore'

    function ProtectedRoute({ children }: { children: React.ReactNode }) {
        const token = useAuthStore(s => s.token);
        if (!token) return <Navigate to="/login" />;
        return <DashboardLayout>{children}</DashboardLayout>;
    }

    export default function App() {
        return (
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/new" element={<ProtectedRoute><NewInvestigation /></ProtectedRoute>} />
                    <Route path="/investigations/:id" element={<ProtectedRoute><InvestigationDetails /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </BrowserRouter>
        )
    }
""")

write_file('frontend/src/main.tsx', """\
    import React from 'react'
    import ReactDOM from 'react-dom/client'
    import App from './App.tsx'
    import './index.css'

    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
""")

# Dockerfile for frontend
write_file('docker/frontend.Dockerfile', """\
    FROM node:18-alpine AS builder
    WORKDIR /app
    COPY frontend/package*.json ./
    RUN npm install
    COPY frontend/ ./
    RUN npm run build

    FROM nginx:alpine
    COPY --from=builder /app/dist /usr/share/nginx/html
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]
""")

# Add frontend to docker-compose.yml
write_file('docker-compose.yml', """\
version: "3.9"

services:
  frontend:
    build:
      context: .
      dockerfile: docker/frontend.Dockerfile
    ports:
      - "3000:80"
    networks:
      - aegis_net

  gateway-service:
    build:
      context: .
      dockerfile: docker/gateway-service.Dockerfile
    ports:
      - "8080:8080"
    environment:
      - AEGIS_PLANNER_SERVICE_URL=http://planner-service:8003
    depends_on:
      - planner-service
    networks:
      - aegis_net

  ml-service:
    build:
      context: .
      dockerfile: docker/ml-service.Dockerfile
    environment:
      - AEGIS_MODEL_ARTIFACTS_PATH=/app/artifacts/models
      - AEGIS_FEATURE_STORE_PATH=/app/artifacts/feature_store
    networks:
      - aegis_net
      
  graph-service:
    build:
      context: .
      dockerfile: docker/graph-service.Dockerfile
    environment:
      - AEGIS_NEO4J_URI=bolt://neo4j:7687
    depends_on:
      - neo4j
    networks:
      - aegis_net

  evidence-service:
    build:
      context: .
      dockerfile: docker/evidence-service.Dockerfile
    environment:
      - AEGIS_POSTGRES_DSN=postgresql://postgres:aegis@postgres:5432/postgres
    depends_on:
      - postgres
    networks:
      - aegis_net

  planner-service:
    build:
      context: .
      dockerfile: docker/planner-service.Dockerfile
    environment:
      - AEGIS_ML_SERVICE_URL=http://ml-service:8000
      - AEGIS_GRAPH_SERVICE_URL=http://graph-service:8001
      - AEGIS_EVIDENCE_SERVICE_URL=http://evidence-service:8002
    depends_on:
      - ml-service
      - graph-service
      - evidence-service
    networks:
      - aegis_net

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=aegis
      - POSTGRES_DB=postgres
    networks:
      - aegis_net

  neo4j:
    image: neo4j:5.12.0
    environment:
      - NEO4J_AUTH=neo4j/password
    networks:
      - aegis_net

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./docker/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    networks:
      - aegis_net

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
    volumes:
      - ./docker/grafana/provisioning:/etc/grafana/provisioning
      - ./docker/grafana/dashboards:/var/lib/grafana/dashboards
    depends_on:
      - prometheus
    networks:
      - aegis_net

networks:
  aegis_net:
""")

print("Successfully generated all files for Phase 7 (React Frontend Foundation)")
