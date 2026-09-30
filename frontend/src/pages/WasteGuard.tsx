import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle, ArrowRight, Award, BarChart3, Bell, Bot, BrainCircuit, Camera,
  Check, CheckCircle2, ChevronRight, CircleUserRound, Clock3, Compass, FileCheck2,
  Gift, History, Home, Languages, Leaf, LocateFixed, LogIn, LogOut, Map, MapPin,
  Menu, Navigation, PackageCheck, Play, Recycle, Route, Search, ShieldCheck,
  Sparkles, Trash2, Truck, Upload, Users, X, Zap,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import { encodeImage } from "@/lib/image";
import type { EncodedImage } from "@/lib/image";
import type {
  AIAnalysis, AppNotification, AuthResponse, Hotspot, Pickup, RewardSummary, Role,
  SmartRoute, User, WasteGuardMetrics, WasteReport, Worker,
} from "@/lib/types";

const DEMO_ACCOUNTS: Record<Role, { email: string; password: string; label: string }> = {
  citizen: { email: "citizen@example.com", password: "citizen123", label: "Citizen" },
  admin: { email: "admin@example.com", password: "admin123", label: "Admin" },
  worker: { email: "worker@example.com", password: "worker123", label: "Worker" },
};

const STATUS_LABELS: Record<string, string> = {
  reported: "Reported", assigned: "Assigned", in_progress: "In Progress",
  cleanup_submitted: "Cleanup Submitted", resolved: "Resolved",
};

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const detail = (error.body as { detail?: unknown } | null)?.detail;
    if (typeof detail === "string") return detail;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function Brand({ light = false }: { light?: boolean }) {
  return <div data-testid="wasteguard-brand" className={`wg-brand ${light ? "wg-brand-light" : ""}`}><span><ShieldCheck size={20} /></span><div><strong>WasteGuard</strong><small>Predict. Prevent. Resolve.</small></div></div>;
}

function DemoBadge() {
  return <span data-testid="demo-mode-badge" className="demo-label"><Sparkles size={12} /> Hackathon Demo Mode</span>;
}

function Landing() {
  const navigate = useNavigate();
  const features = [
    [Bot, "AI Waste Detection", "Photo-based issue, waste type and severity analysis."],
    [BrainCircuit, "Predictive Hotspots", "Identify likely overflow before a complaint surge."],
    [Route, "Smart Route Optimization", "Prioritize severe locations and reduce distance."],
    [History, "Complaint Tracking", "Transparent progress from report to resolution."],
    [FileCheck2, "Cleanup Verification", "Before/after evidence closes the accountability loop."],
    [Leaf, "Waste Awareness", "Practical segregation guidance in English and Hindi."],
  ] as const;
  return <main data-testid="landing-page" className="landing-page">
    <header className="landing-nav"><Brand /><nav><button data-testid="landing-login-link" onClick={() => navigate("/login")}>Login</button><Button data-testid="landing-demo-button" onClick={() => navigate("/login?demo=1")} className="wg-primary">Launch Demo <ArrowRight size={15} /></Button></nav></header>
    <section className="hero-section">
      <div className="hero-copy"><DemoBadge /><p className="hero-kicker">AI-POWERED SMART CITY OPERATIONS</p><h1>Predict waste problems <em>before they overflow.</em></h1><p>Don't wait for waste complaints. Predict, prioritize and verify every cleanup from one command center.</p><div className="hero-actions"><Button data-testid="hero-report-button" onClick={() => navigate("/login?demo=1")} className="wg-primary wg-large">Report Waste <Camera size={17} /></Button><Button data-testid="hero-dashboard-button" onClick={() => navigate("/login?role=admin")} className="wg-outline wg-large">View Smart Dashboard <BarChart3 size={17} /></Button></div><div className="hero-trust"><span><CheckCircle2 size={14} /> End-to-end demo flow</span><span><CheckCircle2 size={14} /> Real image analysis + fallback</span></div></div>
      <div data-testid="smart-city-visual" className="city-visual"><div className="city-grid" /><div className="city-orbit orbit-one" /><div className="city-orbit orbit-two" /><div className="city-core"><ShieldCheck size={42} /><strong>92%</strong><span>DEMO RISK · AREA A</span></div><div className="city-card city-card-top"><AlertTriangle size={17} /><span>Overflow predicted</span><strong>8 hours</strong></div><div className="city-card city-card-bottom"><Truck size={17} /><span>Truck 03 ready</span><strong>8.4 km</strong></div><span className="map-pulse pulse-a" /><span className="map-pulse pulse-b" /><span className="map-pulse pulse-c" /></div>
    </section>
    <section className="landing-section problem-section"><div className="section-intro"><span>THE PROBLEM</span><h2>Cities react late. Waste doesn't wait.</h2></div><div className="problem-grid">{["Overflowing garbage bins", "Missed collection", "Illegal dumping", "Poor waste segregation", "Lack of centralized data"].map((item, index) => <article data-testid={`problem-card-${index}`} key={item}><span>0{index + 1}</span><p>{item}</p></article>)}</div></section>
    <section className="landing-section solution-section"><div className="section-intro"><span>OUR SOLUTION</span><h2>One intelligence loop. Cleaner outcomes.</h2></div><div className="process-line">{["DETECT", "PREDICT", "PRIORITIZE", "COLLECT", "VERIFY", "LEARN"].map((step, index) => <div data-testid={`solution-step-${index}`} key={step}><span>{index + 1}</span><strong>{step}</strong>{index < 5 && <ChevronRight size={18} />}</div>)}</div></section>
    <section className="landing-section feature-section"><div className="section-intro"><span>WASTEGUARD PLATFORM</span><h2>From street report to verified resolution.</h2></div><div className="feature-grid">{features.map(([Icon, title, text], index) => <article data-testid={`feature-card-${index}`} key={title}><span><Icon size={21} /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <footer className="landing-footer"><Brand light /><p>Built for cities, campuses, societies and public places.</p><button data-testid="footer-demo-button" onClick={() => navigate("/login?demo=1")}>Start judge demo <ArrowRight size={14} /></button></footer>
  </main>;
}

function AuthPage({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(location.search);
  const requestedRole = (params.get("role") as Role | null) ?? "citizen";
  const [role, setRole] = useState<Role>(requestedRole);
  const [email, setEmail] = useState(DEMO_ACCOUNTS[requestedRole].email);
  const [password, setPassword] = useState(DEMO_ACCOUNTS[requestedRole].password);
  const [name, setName] = useState("");
  const mutation = useMutation({
    mutationFn: () => mode === "login" ? apiPost<AuthResponse>("/auth/login", { email, password }) : apiPost<AuthResponse>("/auth/register", { name, email, password, role }),
    onSuccess: (data) => { queryClient.setQueryData(["wg-me"], data.user); toast.success(`Welcome to WasteGuard, ${data.user.name.split(" ")[0]}`); navigate(data.user.role === "admin" ? "/admin" : data.user.role === "worker" ? "/worker" : "/citizen"); },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const selectRole = (nextRole: Role) => { setRole(nextRole); setEmail(DEMO_ACCOUNTS[nextRole].email); setPassword(DEMO_ACCOUNTS[nextRole].password); };
  return <main data-testid={`${mode}-page`} className="auth-layout"><div className="auth-showcase"><Brand light /><DemoBadge /><h1>One city.<br />One clean-up loop.</h1><p>Citizen reporting, predictive dispatch and verified cleanup — connected in real time.</p><div className="auth-flow"><span>PHOTO</span><ArrowRight size={14} /><span>AI</span><ArrowRight size={14} /><span>DISPATCH</span><ArrowRight size={14} /><span>VERIFY</span></div></div><Card className="auth-panel"><CardHeader><p className="wg-eyebrow">{mode === "login" ? "SECURE ACCESS" : "CREATE ACCOUNT"}</p><CardTitle>{mode === "login" ? "Sign in to WasteGuard" : "Join WasteGuard"}</CardTitle><p>{mode === "login" ? "Use a demo persona to explore the complete flow." : "Create a citizen or worker account."}</p></CardHeader><CardContent><div className="role-picker">{(["citizen", "admin", "worker"] as Role[]).map((item) => <button data-testid={`auth-role-${item}`} key={item} type="button" onClick={() => selectRole(item)} className={role === item ? "active" : ""}>{item === "citizen" ? <CircleUserRound size={16} /> : item === "admin" ? <ShieldCheck size={16} /> : <Truck size={16} />}{DEMO_ACCOUNTS[item].label}</button>)}</div><form data-testid={`${mode}-form`} onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }} className="wg-form">{mode === "register" && <div><Label htmlFor="register-name">Full name</Label><Input data-testid="register-name-input" id="register-name" value={name} onChange={(event) => setName(event.target.value)} required /></div>}<div><Label htmlFor="auth-email">Email</Label><Input data-testid="auth-email-input" id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div><div><Label htmlFor="auth-password">Password</Label><Input data-testid="auth-password-input" id="auth-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div><Button data-testid="auth-submit-button" type="submit" disabled={mutation.isPending} className="wg-primary wg-full">{mutation.isPending ? "Opening workspace..." : mode === "login" ? "Enter WasteGuard" : "Create account"}<ArrowRight size={16} /></Button></form><button data-testid="auth-mode-link" className="auth-mode-link" onClick={() => navigate(mode === "login" ? "/register" : "/login")}>{mode === "login" ? "New here? Create an account" : "Already registered? Sign in"}</button><button data-testid="back-home-link" className="back-home-link" onClick={() => navigate("/")}><ChevronRight size={13} /> Back to home</button></CardContent></Card></main>;
}

type NavItem = { label: string; path: string; icon: typeof Home };
const CITIZEN_NAV: NavItem[] = [{ label: "Dashboard", path: "/citizen", icon: Home }, { label: "Report Waste", path: "/report", icon: Camera }, { label: "My Complaints", path: "/complaints", icon: History }, { label: "Pickup Request", path: "/pickup", icon: Truck }, { label: "Waste Awareness", path: "/awareness", icon: Leaf }, { label: "Rewards", path: "/rewards", icon: Award }];
const ADMIN_NAV: NavItem[] = [{ label: "Command Center", path: "/admin", icon: BarChart3 }, { label: "Predictive Hotspots", path: "/hotspots", icon: BrainCircuit }, { label: "Smart Routes", path: "/routes", icon: Route }, { label: "Cleanup Verification", path: "/verification", icon: FileCheck2 }, { label: "Complaint History", path: "/complaints", icon: History }];
const WORKER_NAV: NavItem[] = [{ label: "Today's Tasks", path: "/worker", icon: Truck }, { label: "Smart Route", path: "/routes", icon: Navigation }, { label: "Cleanup Evidence", path: "/verification", icon: Camera }, { label: "Task History", path: "/complaints", icon: History }];

function AppShell({ user, children }: { user: User; children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const nav = user.role === "admin" ? ADMIN_NAV : user.role === "worker" ? WORKER_NAV : CITIZEN_NAV;
  const notifications = useQuery({ queryKey: ["wg-notifications", user.id], queryFn: () => apiGet<AppNotification[]>("/wasteguard/notifications"), retry: false });
  const switchMutation = useMutation({ mutationFn: (role: Role) => apiPost<AuthResponse>("/auth/switch-role", { role }), onSuccess: (data) => { queryClient.clear(); queryClient.setQueryData(["wg-me"], data.user); toast.success(`${DEMO_ACCOUNTS[data.user.role].label} workspace opened`); navigate(data.user.role === "admin" ? "/admin" : data.user.role === "worker" ? "/worker" : "/citizen"); }, onError: (error) => toast.error(errorMessage(error)) });
  const logout = useMutation({ mutationFn: () => apiPost<{ message: string }>("/auth/logout"), onSuccess: () => { queryClient.clear(); navigate("/login"); } });
  return <div className="wg-app"><aside data-testid="app-sidebar" className={`wg-sidebar ${open ? "open" : ""}`}><div className="sidebar-top"><Brand light /><button data-testid="close-menu-button" className="sidebar-close" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="sidebar-role"><span>{user.name.slice(0, 1)}</span><div><strong>{user.name}</strong><small>{DEMO_ACCOUNTS[user.role].label} workspace</small></div></div><nav>{nav.map(({ label, path, icon: Icon }) => <button data-testid={`nav-${label.toLowerCase().replaceAll(" ", "-")}`} key={path} onClick={() => { navigate(path); setOpen(false); }} className={location.pathname === path || (path === "/complaints" && location.pathname.startsWith("/complaints/")) ? "active" : ""}><Icon size={17} />{label}</button>)}</nav><div className="sidebar-demo"><DemoBadge /><p>Complete the citizen → admin → worker → verify flow.</p></div><button data-testid="logout-button" onClick={() => logout.mutate()} className="sidebar-logout"><LogOut size={16} /> Sign out</button></aside>{open && <button aria-label="Close navigation overlay" className="sidebar-overlay" onClick={() => setOpen(false)} />}<div className="wg-main"><header className="wg-topbar"><button data-testid="open-menu-button" className="menu-button" onClick={() => setOpen(true)}><Menu size={20} /></button><div className="mobile-brand"><Brand /></div><div className="workspace-switch">{(["citizen", "admin", "worker"] as Role[]).map((role) => <button data-testid={`role-tab-${role}`} key={role} onClick={() => role !== user.role && switchMutation.mutate(role)} className={user.role === role ? "active" : ""}>{role === "citizen" ? <CircleUserRound size={14} /> : role === "admin" ? <ShieldCheck size={14} /> : <Truck size={14} />}{DEMO_ACCOUNTS[role].label}</button>)}</div><div className="topbar-actions"><button data-testid="notification-button" onClick={() => setNotificationsOpen((value) => !value)} className="notification-button"><Bell size={18} />{(notifications.data?.length ?? 0) > 0 && <span>{notifications.data?.length}</span>}</button><div className="topbar-user"><span>{user.name.slice(0, 1)}</span><div><strong>{user.name}</strong><small>{DEMO_ACCOUNTS[user.role].label}</small></div></div></div>{notificationsOpen && <div data-testid="notification-panel" className="notification-panel"><div><strong>Notifications</strong><button onClick={() => setNotificationsOpen(false)}><X size={15} /></button></div>{notifications.data?.length ? notifications.data.slice(0, 5).map((item) => <article data-testid={`notification-${item.id}`} key={item.id}><span><Bell size={13} /></span><div><strong>{item.title}</strong><p>{item.message}</p></div></article>) : <p className="notification-empty">No notifications yet.</p>}</div>}</header><main className="wg-content">{children}</main></div><Toaster richColors /></div>;
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-title"><div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function Metric({ label, value, icon: Icon, tone = "green" }: { label: string; value: string | number; icon: typeof Home; tone?: string }) {
  return <Card className="metric-card"><CardContent><div><span>{label}</span><i className={`metric-icon ${tone}`}><Icon size={18} /></i></div><strong>{value}</strong></CardContent></Card>;
}

function Status({ status }: { status: string }) {
  return <span data-testid={`status-${status}`} className={`wg-status status-${status}`}>{STATUS_LABELS[status] ?? status.replaceAll("_", " ")}</span>;
}

function CitizenDashboard({ user }: { user: User }) {
  const navigate = useNavigate();
  const reports = useQuery({ queryKey: ["wg-reports", user.id], queryFn: () => apiGet<WasteReport[]>("/wasteguard/reports") });
  const rewards = useQuery({ queryKey: ["wg-rewards", user.id], queryFn: () => apiGet<RewardSummary>("/wasteguard/rewards") });
  const pickups = useQuery({ queryKey: ["wg-pickups", user.id], queryFn: () => apiGet<Pickup[]>("/pickups") });
  const items = reports.data ?? [];
  return <div data-testid="citizen-dashboard"><PageTitle eyebrow="CITIZEN / LIVE" title={`Namaste, ${user.name.split(" ")[0]} 👋`} description="Your neighbourhood's cleanliness at a glance." action={<Button data-testid="report-waste-main-button" onClick={() => navigate("/report")} className="wg-primary"><Camera size={16} /> Report Waste with AI</Button>} /><div className="metric-grid four"><Metric label="Active Complaints" value={items.filter((item) => item.status !== "resolved").length} icon={Clock3} tone="amber" /><Metric label="Resolved Complaints" value={items.filter((item) => item.status === "resolved").length} icon={CheckCircle2} /><Metric label="Pickup Requests" value={pickups.data?.length ?? 0} icon={Truck} tone="blue" /><Metric label="Reward Points" value={rewards.data?.points ?? 140} icon={Sparkles} tone="lime" /></div><div className="dashboard-split"><Card className="wg-card"><CardHeader><div className="card-heading"><div><span>RECENT ACTIVITY</span><CardTitle>My complaints</CardTitle></div><button data-testid="view-all-complaints" onClick={() => navigate("/complaints")}>View all <ArrowRight size={13} /></button></div></CardHeader><CardContent><ReportRows reports={items.slice(0, 4)} /></CardContent></Card><Card className="wg-card action-panel"><CardContent><span className="action-panel-icon"><Bot size={25} /></span><p>AI WASTE REPORTER</p><h2>Spot waste?<br />Turn it into action.</h2><small>Upload a photo. WasteGuard analyzes severity and sends it to the command center.</small><Button data-testid="citizen-report-cta" onClick={() => navigate("/report")} className="wg-light">Open AI Reporter <ArrowRight size={15} /></Button></CardContent></Card></div></div>;
}

function FileDrop({ id, image, onImage, label }: { id: string; image: EncodedImage | null; onImage: (image: EncodedImage) => void; label: string }) {
  const handle = async (file?: File) => { if (!file) return; try { onImage(await encodeImage(file)); } catch (error) { toast.error(errorMessage(error)); } };
  return <label data-testid={`${id}-dropzone`} htmlFor={id} className={`file-drop ${image ? "has-image" : ""}`}>{image ? <><img src={image.dataUrl} alt={label} /><span><Camera size={15} /> Replace photo</span></> : <><span><Upload size={26} /></span><strong>{label}</strong><p>JPEG, PNG or WEBP · max 4 MB</p></>}<input data-testid={`${id}-input`} id={id} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void handle(event.target.files?.[0])} /></label>;
}

function ReportWaste({ user }: { user: User }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [image, setImage] = useState<EncodedImage | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [location, setLocation] = useState("Area A, Smart City Zone");
  const [area, setArea] = useState("Area A");
  const [description, setDescription] = useState("");
  const analyze = useMutation({ mutationFn: (value: EncodedImage) => apiPost<AIAnalysis>("/ai/analyze", { image_base64: value.base64, mime_type: value.mimeType }), onSuccess: (data) => { setAnalysis(data); toast.success(data.analysis_mode === "real_ai" ? "Live AI analysis complete" : "Demo AI analysis ready"); }, onError: (error) => toast.error(errorMessage(error)) });
  const create = useMutation({ mutationFn: () => apiPost<WasteReport>("/wasteguard/reports", { location_address: location, area, description, latitude: 28.6139, longitude: 77.209, image_data_url: image?.dataUrl, analysis }), onSuccess: (data) => { void queryClient.invalidateQueries({ queryKey: ["wg-reports"] }); toast.success(`Complaint ${data.complaint_code} created successfully.`); navigate(`/complaints/${data.id}`); }, onError: (error) => toast.error(errorMessage(error)) });
  return <div data-testid="report-waste-page"><PageTitle eyebrow="CITIZEN / AI REPORTER" title="AI Waste Reporter" description="Upload a waste photo and turn a street-level problem into an actionable smart complaint." /><div className="report-layout"><Card className="wg-card upload-card"><CardHeader><CardTitle>1. Upload waste photo</CardTitle><p>Your image is previewed locally and analyzed after you continue.</p></CardHeader><CardContent><FileDrop id="waste-photo" image={image} onImage={(value) => { setImage(value); setAnalysis(null); }} label="Drop or choose a waste photo" /><div className="report-fields"><div><Label htmlFor="report-location">Location</Label><div className="input-with-icon"><MapPin size={15} /><Input data-testid="report-location-input" id="report-location" value={location} onChange={(event) => setLocation(event.target.value)} /></div></div><div><Label htmlFor="report-area">Area</Label><select data-testid="report-area-select" id="report-area" value={area} onChange={(event) => setArea(event.target.value)}><option>Area A</option><option>Area B</option><option>Area C</option><option>Area D</option><option>Area F</option></select></div><div className="full"><Label htmlFor="report-description">Optional description</Label><Textarea data-testid="report-description-input" id="report-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add access details or context for the field team..." /></div></div><Button data-testid="analyze-image-button" onClick={() => image && analyze.mutate(image)} disabled={!image || analyze.isPending} className="wg-primary wg-full">{analyze.isPending ? <><span className="ai-spinner" /> AI is inspecting waste type, fill and severity...</> : <><BrainCircuit size={17} /> Analyze Waste Photo</>}</Button></CardContent></Card><Card className="wg-card analysis-card"><CardHeader><div className="card-heading"><div><span>AI ANALYSIS</span><CardTitle>Smart issue assessment</CardTitle></div>{analysis && <Badge className={analysis.analysis_mode === "real_ai" ? "mode-real" : "mode-demo"}>{analysis.analysis_mode === "real_ai" ? "LIVE AI" : "DEMO AI"}</Badge>}</div></CardHeader><CardContent>{analysis ? <div data-testid="ai-analysis-result" className="analysis-results"><div><span>Detected Issue</span><strong>{analysis.detected_issue}</strong></div><div><span>Waste Type</span><strong>{analysis.waste_type}</strong></div><div><span>Severity</span><strong className={`severity-${analysis.severity.toLowerCase()}`}>{analysis.severity}</strong></div><div><span>Estimated Fill Level</span><strong>{analysis.estimated_fill_level}%</strong><i><span style={{ width: `${analysis.estimated_fill_level}%` }} /></i></div><div><span>Recommended Action</span><strong>{analysis.recommended_action}</strong></div><div><span>Confidence</span><strong>{analysis.confidence}%</strong></div><p data-testid="analysis-disclaimer"><AlertTriangle size={13} /> {analysis.disclaimer}</p><Button data-testid="submit-smart-complaint-button" onClick={() => create.mutate()} disabled={create.isPending} className="wg-primary wg-full"><Zap size={17} /> {create.isPending ? "Creating smart complaint..." : "Submit Smart Complaint"}</Button></div> : <div className="analysis-empty"><span><Bot size={34} /></span><h3>Analysis appears here</h3><p>Upload a photo and run analysis to see issue type, severity, fill level and recommended action.</p><div><i /> Image understanding<i /> Municipal triage<i /> Dispatch recommendation</div></div>}</CardContent></Card></div></div>;
}

function ReportRows({ reports }: { reports: WasteReport[] }) {
  const navigate = useNavigate();
  if (!reports.length) return <div className="wg-empty"><Trash2 size={25} /><p>No reports yet. Your first smart complaint will appear here.</p></div>;
  return <div className="report-rows">{reports.map((report) => <button data-testid={`report-row-${report.id}`} key={report.id} onClick={() => navigate(`/complaints/${report.id}`)}><span className={`report-marker severity-bg-${report.severity.toLowerCase()}`}><Trash2 size={16} /></span><div><strong>{report.detected_issue}</strong><small>{report.complaint_code} · {report.area}</small></div><b>{report.severity}</b><Status status={report.status} /><ChevronRight size={15} /></button>)}</div>;
}

function ComplaintsPage({ user }: { user: User }) {
  const reports = useQuery({ queryKey: ["wg-reports", user.id, user.role], queryFn: () => apiGet<WasteReport[]>("/wasteguard/reports") });
  return <div data-testid="complaints-page"><PageTitle eyebrow={`${user.role.toUpperCase()} / HISTORY`} title={user.role === "worker" ? "Task History" : user.role === "admin" ? "Complaint History" : "My Complaints"} description="Track every report from AI analysis through verified resolution." /><Card className="wg-card"><CardContent><ReportRows reports={reports.data ?? []} /></CardContent></Card></div>;
}

function ComplaintDetails({ user, id }: { user: User; id: string }) {
  const navigate = useNavigate();
  const report = useQuery({ queryKey: ["wg-report", id, user.role], queryFn: () => apiGet<WasteReport>(`/wasteguard/reports/${id}`) });
  const item = report.data;
  if (!item) return <div className="page-loading"><span className="ai-spinner" /> Loading complaint...</div>;
  return <div data-testid="complaint-details-page"><PageTitle eyebrow="COMPLAINT DETAILS" title={`${item.complaint_code} · ${item.detected_issue}`} description={`${item.area} · ${item.location_address}`} action={<Status status={item.status} />} /><div className="details-grid"><Card className="wg-card evidence-preview"><CardHeader><CardTitle>Waste evidence</CardTitle></CardHeader><CardContent>{item.before_image ? <img src={item.before_image} alt="Waste evidence before cleanup" /> : <div className="image-placeholder"><Camera size={26} /> Evidence pending</div>}<div className="detail-pills"><span>{item.severity} severity</span><span>{item.estimated_fill_level}% fill</span><span>{item.waste_type}</span></div><p>{item.description || "No additional description provided."}</p></CardContent></Card><Card className="wg-card timeline-card"><CardHeader><CardTitle>Status timeline</CardTitle></CardHeader><CardContent>{item.timeline.map((event, index) => <div data-testid={`timeline-${index}`} key={`${event.label}-${index}`} className="timeline-event"><span><Check size={13} /></span><div><strong>{event.label}</strong><small>{new Date(event.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small></div></div>)}{["Cleanup Completed", "Verified", "Resolved"].filter((label) => !item.timeline.some((event) => event.label === label)).map((label) => <div key={label} className="timeline-event future"><span /><div><strong>{label}</strong><small>Pending</small></div></div>)}</CardContent></Card><Card className="wg-card detail-summary"><CardHeader><CardTitle>Smart assessment</CardTitle></CardHeader><CardContent><dl><div><dt>AI mode</dt><dd>{item.analysis_mode === "real_ai" ? "Live Gemini analysis" : "DEMO / SIMULATED"}</dd></div><div><dt>Recommended</dt><dd>{item.recommended_action}</dd></div><div><dt>Assigned team</dt><dd>{item.assigned_worker_name ?? "Awaiting dispatch"}</dd></div><div><dt>Vehicle</dt><dd>{item.assigned_vehicle ?? "Not assigned"}</dd></div><div><dt>Verification</dt><dd>{item.verification_status}</dd></div></dl>{user.role === "worker" && item.status !== "resolved" && <Button data-testid="details-open-verification" onClick={() => navigate(`/verification/${item.id}`)} className="wg-primary wg-full">Open cleanup task <ArrowRight size={15} /></Button>}{user.role === "admin" && item.status === "cleanup_submitted" && <Button data-testid="details-verify-button" onClick={() => navigate(`/verification/${item.id}`)} className="wg-primary wg-full">Verify cleanup evidence</Button>}</CardContent></Card></div></div>;
}

function PickupPage() {
  const queryClient = useQueryClient();
  const [itemType, setItemType] = useState("Bulk household waste"); const [address, setAddress] = useState("Area A, Smart City Zone"); const [date, setDate] = useState(""); const [notes, setNotes] = useState("");
  const mutation = useMutation({ mutationFn: () => apiPost<Pickup>("/pickups", { item_type: itemType, address, preferred_date: date, notes, latitude: 28.6139, longitude: 77.209 }), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["wg-pickups"] }); toast.success("Pickup request scheduled successfully"); }, onError: (error) => toast.error(errorMessage(error)) });
  return <div data-testid="pickup-page"><PageTitle eyebrow="CITIZEN SERVICE" title="Schedule a Pickup" description="Request doorstep collection for bulk, garden or electronic waste." /><div className="simple-two-col"><Card className="wg-card"><CardContent><form onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }} className="wg-form"><div><Label htmlFor="pickup-type">Waste type</Label><select data-testid="pickup-type-select" id="pickup-type" value={itemType} onChange={(event) => setItemType(event.target.value)}><option>Bulk household waste</option><option>Old furniture</option><option>Garden waste</option><option>Electronics</option></select></div><div><Label htmlFor="pickup-address">Collection address</Label><Input data-testid="pickup-address-input" id="pickup-address" value={address} onChange={(event) => setAddress(event.target.value)} /></div><div><Label htmlFor="pickup-date">Preferred date</Label><Input data-testid="pickup-date-input" id="pickup-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></div><div><Label htmlFor="pickup-notes">Access notes</Label><Textarea data-testid="pickup-notes-input" id="pickup-notes" value={notes} onChange={(event) => setNotes(event.target.value)} /></div><Button data-testid="submit-pickup-button" type="submit" className="wg-primary wg-full"><Truck size={16} /> Request Pickup</Button></form></CardContent></Card><Card className="wg-card pickup-info"><CardContent><span><PackageCheck size={30} /></span><h2>Responsible pickup,<br />without the guesswork.</h2><p>Your request enters the same operations system used for complaints and routes.</p><ul><li><Check size={14} /> Digital request record</li><li><Check size={14} /> Preferred collection date</li><li><Check size={14} /> Location-aware dispatch</li></ul></CardContent></Card></div></div>;
}

const AWARENESS = [
  { name: "Banana Peel", hi: "केले का छिलका", category: "Wet Waste", hindi: "गीला कचरा", action: "Compost or place in the green bin." },
  { name: "Plastic Bottle", hi: "प्लास्टिक की बोतल", category: "Dry Waste", hindi: "सूखा कचरा", action: "Rinse, dry and place in recyclable dry waste." },
  { name: "Battery", hi: "बैटरी", category: "E-Waste / Hazardous", hindi: "ई-कचरा / खतरनाक", action: "Keep separate and take to an authorized collection point." },
  { name: "Cardboard", hi: "गत्ता", category: "Dry Waste", hindi: "सूखा कचरा", action: "Flatten, keep dry and recycle." },
  { name: "Glass Bottle", hi: "कांच की बोतल", category: "Dry / Recyclable", hindi: "सूखा / पुनर्चक्रण", action: "Rinse and place safely in recyclable waste." },
];

function AwarenessPage() {
  const [hindi, setHindi] = useState(false); const [search, setSearch] = useState("");
  const items = AWARENESS.filter((item) => `${item.name} ${item.hi} ${item.category}`.toLowerCase().includes(search.toLowerCase()));
  return <div data-testid="awareness-page"><PageTitle eyebrow="WASTE AWARENESS" title={hindi ? "अपने कचरे को जानें" : "Know Your Waste"} description={hindi ? "सही अलगाव स्वच्छ शहर की शुरुआत है।" : "Correct segregation is the first step toward a cleaner city."} action={<button data-testid="language-toggle" onClick={() => setHindi((value) => !value)} className="language-toggle"><Languages size={16} /> {hindi ? "English" : "हिंदी"}</button>} /><div className="awareness-search"><Search size={18} /><Input data-testid="waste-search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={hindi ? "इस कचरे का क्या करें?" : "What should I do with this waste?"} /></div><div className="awareness-grid">{items.map((item, index) => <Card data-testid={`awareness-item-${index}`} key={item.name} className="wg-card"><CardContent><span className={`awareness-icon awareness-${index}`}><Recycle size={21} /></span><h3>{hindi ? item.hi : item.name}</h3><strong>{hindi ? item.hindi : item.category}</strong><p>{hindi ? "इसे अलग रखें और अधिकृत कचरा संग्रह प्रणाली में दें।" : item.action}</p></CardContent></Card>)}</div></div>;
}

function RewardsPage({ user }: { user: User }) {
  const rewards = useQuery({ queryKey: ["wg-rewards", user.id], queryFn: () => apiGet<RewardSummary>("/wasteguard/rewards") });
  const summary = rewards.data ?? { points: 140, badges: ["Waste Warrior"], rank: 4 };
  return <div data-testid="rewards-page"><PageTitle eyebrow="CITIZEN REWARDS" title="Clean City Rewards" description="Positive action earns recognition across the WasteGuard community." /><div className="reward-hero"><div><span>CURRENT BALANCE</span><strong>{summary.points}</strong><p>eco points</p></div><div><Award size={55} /><strong>Rank #{summary.rank}</strong><span>City leaderboard</span></div></div><div className="reward-grid"><Card className="wg-card"><CardHeader><CardTitle>Earn more points</CardTitle></CardHeader><CardContent><div className="points-list"><span><Camera size={17} /><b>Waste Report</b><strong>+10</strong></span><span><BrainCircuit size={17} /><b>Segregation Quiz</b><strong>+20</strong></span><span><CheckCircle2 size={17} /><b>Verified Cleanup</b><strong>+30</strong></span></div></CardContent></Card><Card className="wg-card"><CardHeader><CardTitle>Your badges</CardTitle></CardHeader><CardContent><div className="badge-wall">{["Waste Warrior", "Eco Champion", "Clean City Hero"].map((badge, index) => <div key={badge} className={summary.badges.includes(badge) ? "earned" : "locked"}><span>{index === 0 ? <ShieldCheck size={22} /> : index === 1 ? <Leaf size={22} /> : <Award size={22} />}</span><strong>{badge}</strong><small>{summary.badges.includes(badge) ? "Earned" : "Keep contributing"}</small></div>)}</div></CardContent></Card><Card className="wg-card leaderboard"><CardHeader><CardTitle>Demo leaderboard</CardTitle></CardHeader><CardContent>{[["1", "Meera Shah", "420"], ["2", "Arjun Rao", "350"], ["3", "Kabir Singh", "280"], [String(summary.rank), user.name, String(summary.points)]].map(([rank, name, points]) => <div key={`${rank}-${name}`}><span>#{rank}</span><strong>{name}</strong><b>{points} pts</b></div>)}</CardContent></Card></div></div>;
}

const CHART_AREA = [{ name: "Area A", reports: 34 }, { name: "Area B", reports: 23 }, { name: "Area C", reports: 18 }, { name: "Area D", reports: 27 }, { name: "Area F", reports: 13 }];
const CHART_WEEK = [{ name: "Mon", reports: 12 }, { name: "Tue", reports: 18 }, { name: "Wed", reports: 14 }, { name: "Thu", reports: 24 }, { name: "Fri", reports: 21 }, { name: "Sat", reports: 28 }, { name: "Sun", reports: 19 }];
const CHART_WASTE = [{ name: "Mixed", value: 42 }, { name: "Dry", value: 27 }, { name: "Wet", value: 19 }, { name: "Hazardous", value: 12 }];
const COLORS = ["#22c783", "#16304c", "#f5b942", "#ef6156"];

function HotspotMap({ hotspots, selected, onSelect }: { hotspots: Hotspot[]; selected: Hotspot | null; onSelect: (hotspot: Hotspot) => void }) {
  return <div data-testid="hotspot-map" className="hotspot-map"><div className="map-roads" />{hotspots.map((spot, index) => <button data-testid={`hotspot-${spot.area.replaceAll(" ", "-").toLowerCase()}`} key={spot.area} onClick={() => onSelect(spot)} className={`hotspot-pin risk-${spot.risk_level.toLowerCase()} pin-${index} ${selected?.area === spot.area ? "selected" : ""}`}><span>{spot.risk_score}</span><small>{spot.area}</small></button>)}<div className="map-legend"><span><i className="red" /> High risk</span><span><i className="yellow" /> Medium risk</span><span><i className="green" /> Low risk</span></div></div>;
}

function AdminDashboard({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const metrics = useQuery({ queryKey: ["wg-metrics"], queryFn: () => apiGet<WasteGuardMetrics>("/wasteguard/metrics") });
  const reports = useQuery({ queryKey: ["wg-reports", user.id, "admin"], queryFn: () => apiGet<WasteReport[]>("/wasteguard/reports") });
  const workers = useQuery({ queryKey: ["wg-workers"], queryFn: () => apiGet<Worker[]>("/admin/workers") });
  const hotspots = useQuery({ queryKey: ["wg-hotspots"], queryFn: () => apiGet<Hotspot[]>("/wasteguard/hotspots") });
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const assign = useMutation({ mutationFn: ({ reportId, workerId }: { reportId: string; workerId: string }) => apiPost<WasteReport>(`/wasteguard/reports/${reportId}/assign`, { worker_id: workerId }), onSuccess: (data) => { void queryClient.invalidateQueries({ queryKey: ["wg-reports"] }); toast.success(`${data.complaint_code} assigned to ${data.assigned_vehicle ?? "Truck 03"}`); }, onError: (error) => toast.error(errorMessage(error)) });
  const m = metrics.data ?? { total_reports: 128, pending: 24, resolved: 91, high_risk_areas: 7, active_workers: 12 };
  const list = reports.data ?? [];
  const selectedSpot = selected ?? hotspots.data?.[0] ?? null;
  return <div data-testid="admin-dashboard"><PageTitle eyebrow="ADMIN / LIVE OPERATIONS" title="Smart Waste Command Center" description="Real-time complaint intelligence, predictive hotspots and crew dispatch." action={<div className="live-chip"><span /> Live command</div>} /><div className="metric-grid five"><Metric label="Total Reports" value={m.total_reports} icon={BarChart3} tone="navy" /><Metric label="Pending" value={m.pending} icon={Clock3} tone="amber" /><Metric label="Resolved" value={m.resolved} icon={CheckCircle2} /><Metric label="High Risk Areas" value={m.high_risk_areas} icon={AlertTriangle} tone="red" /><Metric label="Active Workers" value={m.active_workers} icon={Users} tone="blue" /></div><div className="command-grid"><Card className="wg-card map-card"><CardHeader><div className="card-heading"><div><span>LIVE WASTE HEATMAP</span><CardTitle>Predictive city risk</CardTitle></div><Badge className="mode-demo">DEMO / SIMULATED</Badge></div></CardHeader><CardContent><HotspotMap hotspots={hotspots.data ?? []} selected={selectedSpot} onSelect={setSelected} /></CardContent></Card><Card className="wg-card risk-card"><CardHeader><span>HOTSPOT INTELLIGENCE</span><CardTitle>{selectedSpot?.area ?? "Area A"}</CardTitle></CardHeader><CardContent>{selectedSpot && <><div className={`risk-score risk-${selectedSpot.risk_level.toLowerCase()}`}><strong>{selectedSpot.risk_score}%</strong><span>{selectedSpot.risk_level} DEMO RISK</span></div><dl><div><dt>Predicted overflow</dt><dd>{selectedSpot.predicted_overflow_hours} hours</dd></div><div><dt>Complaints</dt><dd>{selectedSpot.complaints}</dd></div><div><dt>Missed pickups</dt><dd>{selectedSpot.missed_pickups}</dd></div></dl><div className="recommendation"><BrainCircuit size={18} /><div><span>RECOMMENDED ACTION</span><strong>{selectedSpot.recommended_action}</strong></div></div></>}</CardContent></Card></div><div className="chart-grid"><Card className="wg-card"><CardHeader><CardTitle>Complaints by Area</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={210}><BarChart data={CHART_AREA}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="reports" fill="#22c783" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card><Card className="wg-card"><CardHeader><CardTitle>Weekly Complaints</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={210}><LineChart data={CHART_WEEK}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line type="monotone" dataKey="reports" stroke="#16304c" strokeWidth={3} dot={{ fill: "#22c783", r: 4 }} /></LineChart></ResponsiveContainer></CardContent></Card><Card className="wg-card"><CardHeader><CardTitle>Waste Type Distribution</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={210}><PieChart><Pie data={CHART_WASTE} dataKey="value" nameKey="name" innerRadius={45} outerRadius={78} paddingAngle={3}>{CHART_WASTE.map((item, index) => <Cell key={item.name} fill={COLORS[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card></div><Card className="wg-card dispatch-card"><CardHeader><div className="card-heading"><div><span>COMPLAINT INTAKE</span><CardTitle>Live dispatch queue</CardTitle></div><Badge>{list.filter((item) => !item.assigned_worker_id).length} unassigned</Badge></div></CardHeader><CardContent><div className="dispatch-table">{list.slice(0, 6).map((report) => <div data-testid={`dispatch-${report.id}`} key={report.id}><span className={`report-marker severity-bg-${report.severity.toLowerCase()}`}><Trash2 size={15} /></span><div><strong>{report.complaint_code} · {report.detected_issue}</strong><small>{report.area} · {report.estimated_fill_level}% full</small></div><b>{report.severity}</b><Status status={report.status} />{report.assigned_worker_id ? <span className="assigned-worker">{report.assigned_vehicle ?? report.assigned_worker_name}</span> : <select data-testid={`assign-worker-${report.id}`} defaultValue="" onChange={(event) => event.target.value && assign.mutate({ reportId: report.id, workerId: event.target.value })}><option value="">Assign worker</option>{workers.data?.map((worker) => <option key={worker.id} value={worker.id}>{worker.name} · {worker.vehicle}</option>)}</select>}</div>)}</div></CardContent></Card></div>;
}

function HotspotsPage() {
  const hotspots = useQuery({ queryKey: ["wg-hotspots"], queryFn: () => apiGet<Hotspot[]>("/wasteguard/hotspots") });
  const [selected, setSelected] = useState<Hotspot | null>(null); const current = selected ?? hotspots.data?.[0] ?? null;
  return <div data-testid="hotspots-page"><PageTitle eyebrow="PREDICTIVE INTELLIGENCE" title="Predictive Waste Intelligence" description="WasteGuard combines historical complaints, collection frequency, missed pickups, volume, location patterns and footfall." action={<Badge className="mode-demo">DEMO / SIMULATED PREDICTIONS</Badge>} /><div className="intelligence-grid"><Card className="wg-card map-card"><CardContent><HotspotMap hotspots={hotspots.data ?? []} selected={current} onSelect={setSelected} /></CardContent></Card><div className="hotspot-list">{hotspots.data?.map((spot) => <button data-testid={`hotspot-card-${spot.area.replaceAll(" ", "-").toLowerCase()}`} key={spot.area} onClick={() => setSelected(spot)} className={current?.area === spot.area ? "active" : ""}><div className={`risk-orb risk-${spot.risk_level.toLowerCase()}`}>{spot.risk_score}%</div><div><strong>{spot.area}</strong><span>{spot.risk_level} DEMO RISK</span><small>Predicted overflow: {spot.predicted_overflow_hours} hours</small></div><ChevronRight size={17} /></button>)}</div></div>{current && <Card className="recommendation-banner"><CardContent><span><BrainCircuit size={23} /></span><div><p>RECOMMENDED ACTION</p><h2>Schedule collection for {current.area} before predicted overflow.</h2><small>{current.recommended_action} · Based on simulated hackathon risk data.</small></div></CardContent></Card>}</div>;
}

function RoutesPage() {
  const route = useQuery({ queryKey: ["wg-route"], queryFn: () => apiGet<SmartRoute>("/wasteguard/smart-route") });
  const [generated, setGenerated] = useState(true);
  const data = route.data;
  return <div data-testid="routes-page"><PageTitle eyebrow="ROUTE INTELLIGENCE" title="AI-Assisted Collection Route" description="High-severity stops are prioritized first to reduce distance and response time." action={<Badge className="mode-demo">DEMO / SIMULATED CALCULATION</Badge>} /><div className="route-layout"><Card className="wg-card route-map-card"><CardHeader><div className="card-heading"><div><span>OPTIMIZED PATH</span><CardTitle>Truck 03 · Today's route</CardTitle></div><Navigation size={21} /></div></CardHeader><CardContent><div className={`route-map ${generated ? "generated" : ""}`}><div className="route-line" />{data?.stops.map((stop, index) => <div data-testid={`route-stop-${index}`} key={`${stop.area}-${index}`} className={`route-stop stop-${index}`}><span>{stop.label}</span><div><strong>{stop.area}</strong><small>{stop.severity}</small></div></div>)}</div><Button data-testid="generate-route-button" onClick={() => { setGenerated(false); window.setTimeout(() => setGenerated(true), 80); toast.success("Optimized demo route generated"); }} className="wg-primary wg-full"><Route size={17} /> Generate Optimized Route</Button></CardContent></Card><div className="route-stats"><Metric label="Traditional Route" value={`${data?.traditional_distance_km ?? 12.7} km`} icon={Map} tone="navy" /><Metric label="Optimized Route" value={`${data?.optimized_distance_km ?? 8.4} km`} icon={Navigation} /><Metric label="Demo Distance Saved" value={`${data?.saved_distance_km ?? 4.3} km`} icon={Zap} tone="lime" /><Card className="wg-card route-order"><CardHeader><CardTitle>Priority order</CardTitle></CardHeader><CardContent>{data?.stops.map((stop, index) => <div key={`${stop.area}-${index}`}><span>{index + 1}</span><strong>{stop.area}</strong><small>{stop.severity}</small></div>)}</CardContent></Card></div></div></div>;
}

function WorkerDashboard({ user }: { user: User }) {
  const navigate = useNavigate(); const queryClient = useQueryClient();
  const reports = useQuery({ queryKey: ["wg-reports", user.id, "worker"], queryFn: () => apiGet<WasteReport[]>("/wasteguard/reports") });
  const start = useMutation({ mutationFn: (id: string) => apiPost<WasteReport>(`/wasteguard/reports/${id}/start`), onSuccess: (data) => { void queryClient.invalidateQueries({ queryKey: ["wg-reports"] }); toast.success(`${data.complaint_code} started`); }, onError: (error) => toast.error(errorMessage(error)) });
  const tasks = reports.data ?? [];
  return <div data-testid="worker-dashboard"><PageTitle eyebrow="WORKER / TRUCK 03" title="Today's Collection Tasks" description={`${user.name} · Shift 08:00–16:00 · High-severity tasks first.`} action={<Button data-testid="view-optimized-route-button" onClick={() => navigate("/routes")} className="wg-outline"><Navigation size={16} /> View optimized route</Button>} /><div className="metric-grid three"><Metric label="Open Tasks" value={tasks.filter((item) => item.status !== "resolved").length} icon={Clock3} tone="amber" /><Metric label="Completed" value={tasks.filter((item) => item.status === "resolved").length} icon={CheckCircle2} /><Metric label="Distance Today" value="8.4 km" icon={Route} tone="blue" /></div><div className="task-grid">{tasks.map((task) => <Card data-testid={`worker-task-${task.id}`} key={task.id} className={`wg-card worker-task severity-border-${task.severity.toLowerCase()}`}><CardContent>{task.before_image ? <img src={task.before_image} alt={`Waste at ${task.area}`} /> : <div className="task-image-placeholder"><Trash2 size={26} /></div>}<div className="task-top"><span className={`severity-text-${task.severity.toLowerCase()}`}>{task.severity} PRIORITY</span><Status status={task.status} /></div><h2>{task.detected_issue} <small>· {task.complaint_code}</small></h2><p><MapPin size={15} /> {task.area} · {task.location_address}</p><div className="task-meta"><span><Clock3 size={14} /> ETA 12 min</span><span><Truck size={14} /> Truck 03</span></div>{task.status === "assigned" && <Button data-testid={`start-task-${task.id}`} onClick={() => start.mutate(task.id)} className="wg-primary wg-full"><Play size={16} /> Start Task</Button>}{task.status === "in_progress" && <Button data-testid={`upload-evidence-${task.id}`} onClick={() => navigate(`/verification/${task.id}`)} className="wg-primary wg-full"><Camera size={16} /> Upload Before & After</Button>}{task.status === "cleanup_submitted" && <Button disabled className="wg-outline wg-full"><Clock3 size={16} /> Awaiting Admin Verification</Button>}{task.status === "resolved" && <Button disabled className="wg-success wg-full"><CheckCircle2 size={16} /> Verified & Resolved</Button>}</CardContent></Card>)}</div></div>;
}

function VerificationPage({ user, reportId }: { user: User; reportId?: string }) {
  const queryClient = useQueryClient(); const navigate = useNavigate();
  const reports = useQuery({ queryKey: ["wg-reports", user.id, user.role], queryFn: () => apiGet<WasteReport[]>("/wasteguard/reports") });
  const target = reportId ? reports.data?.find((item) => item.id === reportId) : reports.data?.find((item) => user.role === "admin" ? item.status === "cleanup_submitted" : item.status === "in_progress") ?? reports.data?.[0];
  const [before, setBefore] = useState<EncodedImage | null>(null); const [after, setAfter] = useState<EncodedImage | null>(null); const [note, setNote] = useState("");
  const evidence = useMutation({ mutationFn: () => apiPost<WasteReport>(`/wasteguard/reports/${target?.id}/evidence`, { before_image: before?.dataUrl, after_image: after?.dataUrl, resolution_note: note }), onSuccess: (data) => { void queryClient.invalidateQueries({ queryKey: ["wg-reports"] }); toast.success(`Cleanup evidence submitted for ${data.complaint_code}`); navigate("/worker"); }, onError: (error) => toast.error(errorMessage(error)) });
  const verify = useMutation({ mutationFn: () => apiPost<WasteReport>(`/wasteguard/reports/${target?.id}/verify`), onSuccess: (data) => { void queryClient.invalidateQueries({ queryKey: ["wg-reports"] }); toast.success(`${data.complaint_code} resolved successfully`); }, onError: (error) => toast.error(errorMessage(error)) });
  if (!target) return <div data-testid="verification-page"><PageTitle eyebrow="CLEANUP CONTROL" title="Cleanup Verification" description="No task currently needs evidence or verification." /><div className="wg-empty large"><FileCheck2 size={32} /><p>Complete the citizen and assignment steps to unlock verification.</p></div></div>;
  return <div data-testid="verification-page"><PageTitle eyebrow="CLEANUP CONTROL" title="Cleanup Verification" description={`${target.complaint_code} · ${target.detected_issue} · ${target.area}`} action={<Status status={target.status} />} />{user.role === "worker" ? <Card className="wg-card"><CardContent><div className="before-after"><div><p>BEFORE</p><FileDrop id="before-photo" image={before} onImage={setBefore} label="Upload before photo" /></div><div className="verification-arrow"><ArrowRight size={22} /></div><div><p>AFTER</p><FileDrop id="after-photo" image={after} onImage={setAfter} label="Upload after photo" /></div></div><div className="verification-note"><Label htmlFor="cleanup-note">Cleanup note</Label><Textarea data-testid="cleanup-note-input" id="cleanup-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Describe what was collected and how the area was left..." /></div><Button data-testid="submit-evidence-button" onClick={() => evidence.mutate()} disabled={!before || !after || note.length < 3 || evidence.isPending} className="wg-primary wg-full"><Upload size={16} /> Submit Cleanup Evidence</Button></CardContent></Card> : <Card className="wg-card"><CardContent><div className="before-after review"><div><p>BEFORE</p>{target.before_image ? <img src={target.before_image} alt="Before cleanup" /> : <div className="image-placeholder">No before image</div>}</div><div className="verification-arrow"><ArrowRight size={22} /></div><div><p>AFTER</p>{target.after_image ? <img src={target.after_image} alt="After cleanup" /> : <div className="image-placeholder">Evidence not submitted</div>}</div></div><div className="verification-status"><span><CheckCircle2 size={20} /></span><div><p>VERIFICATION</p><h3>{target.status === "resolved" ? "Demo Verification Complete" : "Cleanup Evidence Submitted"}</h3><small>{target.resolution_note ?? "Review visual evidence before resolving."}</small></div></div><Button data-testid="mark-verified-button" onClick={() => verify.mutate()} disabled={target.status !== "cleanup_submitted" || verify.isPending} className="wg-primary wg-full"><FileCheck2 size={17} /> {target.status === "resolved" ? "Complaint Resolved Successfully" : "Mark as Verified"}</Button></CardContent></Card>}</div>;
}

function ProtectedApp({ user }: { user: User }) {
  const location = useLocation();
  const id = location.pathname.startsWith("/complaints/") || location.pathname.startsWith("/verification/") ? location.pathname.split("/")[2] : undefined;
  let content: ReactNode;
  if (location.pathname === "/report") content = <ReportWaste user={user} />;
  else if (location.pathname === "/complaints") content = <ComplaintsPage user={user} />;
  else if (location.pathname.startsWith("/complaints/")) content = <ComplaintDetails user={user} id={id ?? ""} />;
  else if (location.pathname === "/pickup") content = <PickupPage />;
  else if (location.pathname === "/awareness") content = <AwarenessPage />;
  else if (location.pathname === "/rewards") content = <RewardsPage user={user} />;
  else if (location.pathname === "/admin") content = <AdminDashboard user={user} />;
  else if (location.pathname === "/hotspots") content = <HotspotsPage />;
  else if (location.pathname === "/routes") content = <RoutesPage />;
  else if (location.pathname.startsWith("/verification")) content = <VerificationPage user={user} reportId={id} />;
  else if (location.pathname === "/worker") content = <WorkerDashboard user={user} />;
  else content = user.role === "admin" ? <AdminDashboard user={user} /> : user.role === "worker" ? <WorkerDashboard user={user} /> : <CitizenDashboard user={user} />;
  return <AppShell user={user}>{content}</AppShell>;
}

export default function WasteGuard() {
  const location = useLocation();
  const me = useQuery({ queryKey: ["wg-me"], queryFn: () => apiGet<User | null>("/auth/me"), retry: false });
  if (location.pathname === "/") return <><Landing /><Toaster richColors /></>;
  if (location.pathname === "/login") return <><AuthPage mode="login" /><Toaster richColors /></>;
  if (location.pathname === "/register") return <><AuthPage mode="register" /><Toaster richColors /></>;
  if (me.isPending) return <div className="page-loading"><span className="ai-spinner" /> Preparing WasteGuard command network...</div>;
  if (!me.data) return <AuthPage mode="login" />;
  return <ProtectedApp user={me.data} />;
}