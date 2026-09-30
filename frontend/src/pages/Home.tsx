import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FilePlus2,
  Leaf,
  LocateFixed,
  LogOut,
  MapPin,
  Menu,
  Navigation,
  Recycle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ApiError, apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  AuthResponse,
  Complaint,
  ComplaintInput,
  Metrics,
  Pickup,
  PickupInput,
  Role,
  RoleSwitchInput,
  User,
  Worker,
} from "@/lib/types";

const DEMO_ACCOUNTS: Record<Role, { email: string; password: string; label: string }> = {
  citizen: { email: "citizen@example.com", password: "citizen123", label: "Citizen" },
  worker: { email: "worker@example.com", password: "worker123", label: "Worker" },
  admin: { email: "admin@example.com", password: "admin123", label: "Admin" },
};

const DEFAULT_LOCATION = { address: "Connaught Place, New Delhi", latitude: 28.6139, longitude: 77.209 };

function apiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const detail = (error.body as { detail?: unknown } | null)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((item) => (item as { msg?: string }).msg ?? "").join(" ");
  }
  return "Something went wrong. Please try again.";
}

function StatusPill({ status, testId }: { status: string; testId: string }) {
  const labels: Record<string, string> = {
    reported: "Reported",
    assigned: "Assigned",
    in_progress: "In progress",
    resolved: "Cleaned",
    requested: "Requested",
  };
  return (
    <span data-testid={testId} className={`status-pill status-${status}`}>
      {labels[status] ?? status}
    </span>
  );
}

function LocationPreview({ latitude, longitude, label }: { latitude: number; longitude: number; label: string }) {
  const delta = 0.035;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - delta}%2C${latitude - delta}%2C${longitude + delta}%2C${latitude + delta}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  return (
    <div data-testid="live-location-map" className="map-preview">
      <iframe title={`Map showing ${label}`} src={src} loading="lazy" />
      <div data-testid="map-location-label" className="map-label">
        <MapPin size={15} /> {label}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div data-testid="brand-logo" className="brand-mark">
      <span className="brand-icon"><Recycle size={18} /></span>
      <span>Eco<span>Clean</span></span>
    </div>
  );
}

function AuthScreen({ onLogin }: { onLogin: (credentials: { email: string; password: string }) => void }) {
  const [email, setEmail] = useState(DEMO_ACCOUNTS.citizen.email);
  const [password, setPassword] = useState(DEMO_ACCOUNTS.citizen.password);
  const [registerMode, setRegisterMode] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("citizen");
  const queryClient = useQueryClient();
  const authMutation = useMutation({
    mutationFn: () => registerMode
      ? apiPost<AuthResponse>("/auth/register", { name, email, password, role })
      : apiPost<AuthResponse>("/auth/login", { email, password }),
    onSuccess: (data) => {
      queryClient.setQueryData(["me"], data.user);
      toast.success(registerMode ? "Welcome to EcoClean" : `Welcome back, ${data.user.name.split(" ")[0]}`);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    authMutation.mutate();
  };

  const chooseDemo = (nextRole: Role) => {
    const account = DEMO_ACCOUNTS[nextRole];
    setEmail(account.email);
    setPassword(account.password);
    setRegisterMode(false);
  };

  return (
    <main data-testid="auth-screen" className="auth-page">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <section className="auth-shell">
        <div data-testid="auth-intro" className="auth-intro">
          <Logo />
          <Badge data-testid="auth-status-badge" className="mt-8 w-fit bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Civic operations, made human</Badge>
          <h1>Cleaner streets start with <em>one good report.</em></h1>
          <p>Connect citizens, field teams and city operations in one calm, accountable workspace.</p>
          <div className="auth-proof-row">
            <span data-testid="auth-proof-reports"><CheckCircle2 size={16} /> Live issue tracking</span>
            <span data-testid="auth-proof-location"><MapPin size={16} /> Location-aware</span>
          </div>
        </div>
        <Card data-testid="login-card" className="auth-card">
          <CardHeader>
            <div className="auth-card-heading">
              <div>
                <p data-testid="auth-form-kicker" className="eyebrow">{registerMode ? "JOIN THE MOVEMENT" : "WELCOME BACK"}</p>
                <CardTitle data-testid="auth-form-title">{registerMode ? "Create your account" : "Sign in to EcoClean"}</CardTitle>
              </div>
              <span data-testid="auth-secure-icon" className="secure-icon"><ShieldCheck size={20} /></span>
            </div>
          </CardHeader>
          <CardContent>
            <form data-testid="auth-form" onSubmit={submit} className="form-stack">
              {registerMode && (
                <div className="field-group">
                  <Label data-testid="auth-name-label" htmlFor="auth-name">Full name</Label>
                  <Input data-testid="auth-name-input" id="auth-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Priya Sharma" required />
                </div>
              )}
              <div className="field-group">
                <Label data-testid="auth-email-label" htmlFor="auth-email">Email address</Label>
                <Input data-testid="auth-email-input" id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="field-group">
                <Label data-testid="auth-password-label" htmlFor="auth-password">Password</Label>
                <Input data-testid="auth-password-input" id="auth-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required />
              </div>
              {registerMode && (
                <div className="field-group">
                  <Label data-testid="auth-role-label" htmlFor="auth-role">I am joining as</Label>
                  <select data-testid="auth-role-select" id="auth-role" value={role} onChange={(event) => setRole(event.target.value as Role)} className="native-select">
                    <option value="citizen">Citizen</option>
                    <option value="worker">Sanitation worker</option>
                  </select>
                </div>
              )}
              <Button data-testid="auth-submit-button" type="submit" disabled={authMutation.isPending} className="primary-button w-full">
                {authMutation.isPending ? "Connecting..." : registerMode ? "Create account" : "Continue to dashboard"} <ArrowRight size={16} />
              </Button>
            </form>
            {!registerMode && (
              <div data-testid="demo-access-panel" className="demo-access">
                <p data-testid="demo-access-label">Quick demo access</p>
                <div className="demo-buttons">
                  {(Object.keys(DEMO_ACCOUNTS) as Role[]).map((demoRole) => (
                    <button data-testid={`demo-login-${demoRole}-button`} key={demoRole} type="button" onClick={() => chooseDemo(demoRole)} className={`demo-chip demo-${demoRole}`}>
                      {demoRole === "admin" ? <ShieldCheck size={14} /> : demoRole === "worker" ? <Truck size={14} /> : <Leaf size={14} />}
                      {DEMO_ACCOUNTS[demoRole].label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button data-testid="auth-mode-toggle" type="button" onClick={() => setRegisterMode((value) => !value)} className="text-button">
              {registerMode ? "Already have an account? Sign in" : "New to EcoClean? Create an account"}
            </button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function AppHeader({ user, onLogout, onRoleChange }: { user: User; onLogout: () => void; onRoleChange: (role: Role) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const roleItems: { role: Role; label: string; icon: typeof Leaf }[] = [
    { role: "citizen", label: "Citizen", icon: Leaf },
    { role: "admin", label: "Admin", icon: ShieldCheck },
    { role: "worker", label: "Worker", icon: Truck },
  ];
  return (
    <header data-testid="app-header" className="app-header">
      <div className="header-inner">
        <Logo />
        <nav data-testid="role-navigation" className="role-nav">
          {roleItems.map(({ role, label, icon: Icon }) => (
            <button data-testid={`role-tab-${role}`} key={role} type="button" onClick={() => role !== user.role && onRoleChange(role)} className={`role-tab ${user.role === role ? "active" : ""}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>
        <div data-testid="header-user-area" className="header-user-area">
          <div data-testid="header-user-avatar" className="user-avatar">{user.name.slice(0, 1).toUpperCase()}</div>
          <div data-testid="header-user-name" className="header-user-copy"><strong>{user.name}</strong><span>{user.role === "admin" ? "Municipal admin" : user.role === "worker" ? "Field operations" : "Civic citizen"}</span></div>
          <button data-testid="header-menu-button" type="button" className="icon-button mobile-only" onClick={() => setMenuOpen((value) => !value)} aria-label="Open menu"><Menu size={19} /></button>
          <button data-testid="logout-button" type="button" onClick={onLogout} className={`logout-button ${menuOpen ? "show" : ""}`}><LogOut size={15} /> Sign out</button>
        </div>
      </div>
    </header>
  );
}

function StatCard({ label, value, icon: Icon, tone, testId }: { label: string; value: string | number; icon: typeof Leaf; tone: string; testId: string }) {
  return (
    <Card data-testid={testId} className="stat-card">
      <CardContent>
        <div className="stat-head"><span data-testid={`${testId}-label`}>{label}</span><span data-testid={`${testId}-icon`} className={`stat-icon ${tone}`}><Icon size={18} /></span></div>
        <strong data-testid={`${testId}-value`} className="stat-value">{value}</strong>
      </CardContent>
    </Card>
  );
}

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div data-testid={`section-${eyebrow.toLowerCase().replaceAll(" ", "-")}`} className="section-heading">
      <div><p data-testid="section-eyebrow" className="eyebrow">{eyebrow}</p><h1 data-testid="section-title">{title}</h1><p data-testid="section-description" className="section-description">{description}</p></div>
      {action}
    </div>
  );
}

function LocationButton({ location, onChange }: { location: typeof DEFAULT_LOCATION; onChange: (next: typeof DEFAULT_LOCATION) => void }) {
  const detect = () => {
    if (!navigator.geolocation) {
      toast.error("Live location is not available in this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { latitude: Number(position.coords.latitude.toFixed(5)), longitude: Number(position.coords.longitude.toFixed(5)), address: "Your live location" };
        onChange(next);
        toast.success("Live location detected");
      },
      () => toast.error("Location permission was not granted; using the selected area"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };
  return (
    <div data-testid="location-control" className="location-control">
      <div data-testid="location-readout" className="location-readout"><MapPin size={16} /><span>{location.address}</span></div>
      <button data-testid="detect-location-button" type="button" onClick={detect} className="outline-button"><LocateFixed size={15} /> Detect my location</button>
    </div>
  );
}

function Modal({ title, children, onClose, testId }: { title: string; children: React.ReactNode; onClose: () => void; testId: string }) {
  return (
    <div data-testid={testId} className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-heading"><div><p data-testid={`${testId}-eyebrow`} className="eyebrow">ECOSYSTEM ACTION</p><h2 data-testid={`${testId}-title`}>{title}</h2></div><button data-testid={`${testId}-close-button`} type="button" onClick={onClose} className="icon-button"><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}

function CitizenView({ complaints, pickups, location, setLocation, refresh }: { complaints: Complaint[]; pickups: Pickup[]; location: typeof DEFAULT_LOCATION; setLocation: (location: typeof DEFAULT_LOCATION) => void; refresh: () => void }) {
  const [modal, setModal] = useState<"complaint" | "pickup" | null>(null);
  const active = complaints.filter((item) => item.status !== "resolved").length;
  const resolved = complaints.filter((item) => item.status === "resolved").length;
  const complaintMutation = useMutation({
    mutationFn: (input: ComplaintInput) => apiPost<Complaint>("/complaints", input),
    onSuccess: () => { setModal(null); refresh(); toast.success("Complaint submitted successfully"); },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });
  const pickupMutation = useMutation({
    mutationFn: (input: PickupInput) => apiPost<Pickup>("/pickups", input),
    onSuccess: () => { setModal(null); refresh(); toast.success("Pickup request is on its way"); },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <div data-testid="citizen-dashboard" className="dashboard-content">
      <SectionHeading eyebrow="CITIZEN / LIVE" title="Namaste, make your neighbourhood better." description="Report a problem, request a pickup and see every action move forward." action={<div data-testid="citizen-location-summary" className="location-summary"><MapPin size={15} /> {location.address}</div>} />
      <div data-testid="citizen-stats-grid" className="stats-grid citizen-stats">
        <StatCard testId="citizen-active-stat" label="Active complaints" value={active} icon={Clock3} tone="amber" />
        <StatCard testId="citizen-resolved-stat" label="Resolved complaints" value={resolved} icon={CheckCircle2} tone="green" />
        <StatCard testId="citizen-pickup-stat" label="Pickup requests" value={pickups.length} icon={Truck} tone="blue" />
        <StatCard testId="citizen-reward-stat" label="Reward points" value={140 + resolved * 20} icon={Sparkles} tone="lime" />
      </div>
      <div data-testid="citizen-quick-actions" className="quick-actions-grid">
        <button data-testid="open-report-complaint-button" type="button" onClick={() => setModal("complaint")} className="action-card action-card-primary"><span className="action-icon"><FilePlus2 size={22} /></span><span><strong>Report an issue</strong><small>Illegal dumping, overflow, litter</small></span><ArrowRight size={18} /></button>
        <button data-testid="open-pickup-request-button" type="button" onClick={() => setModal("pickup")} className="action-card"><span className="action-icon action-icon-blue"><Truck size={22} /></span><span><strong>Request a pickup</strong><small>Schedule doorstep bulk waste collection</small></span><ArrowRight size={18} /></button>
      </div>
      <div className="content-grid citizen-content-grid">
        <Card data-testid="citizen-complaints-card" className="surface-card"><CardHeader><div className="card-title-row"><div><p className="eyebrow">YOUR ACTIVITY</p><CardTitle data-testid="citizen-complaints-title">My complaints</CardTitle></div><Badge data-testid="complaints-count-badge" variant="secondary">{complaints.length} total</Badge></div></CardHeader><CardContent><ComplaintList complaints={complaints} emptyText="Your next report will appear here." /></CardContent></Card>
        <Card data-testid="citizen-map-card" className="surface-card"><CardHeader><div className="card-title-row"><div><p className="eyebrow">LIVE LOCATION</p><CardTitle data-testid="citizen-map-title">Your civic map</CardTitle></div><Navigation data-testid="citizen-map-icon" size={19} className="text-emerald-600" /></div></CardHeader><CardContent><LocationPreview latitude={location.latitude} longitude={location.longitude} label={location.address} /><LocationButton location={location} onChange={setLocation} /></CardContent></Card>
      </div>
      {modal === "complaint" && <ComplaintModal location={location} onClose={() => setModal(null)} onSubmit={(input) => complaintMutation.mutate(input)} pending={complaintMutation.isPending} />}
      {modal === "pickup" && <PickupModal location={location} onClose={() => setModal(null)} onSubmit={(input) => pickupMutation.mutate(input)} pending={pickupMutation.isPending} />}
    </div>
  );
}

function ComplaintList({ complaints, emptyText }: { complaints: Complaint[]; emptyText: string }) {
  if (!complaints.length) return <div data-testid="complaints-empty-state" className="empty-state"><Leaf size={24} /><p>{emptyText}</p></div>;
  return <div data-testid="complaints-list" className="list-stack">{complaints.map((complaint) => <div data-testid={`complaint-row-${complaint.id}`} key={complaint.id} className="complaint-row"><div className="complaint-row-main"><span data-testid={`complaint-category-${complaint.id}`} className="complaint-category"><span className={`priority-dot priority-${complaint.priority}`} />{complaint.category}</span><strong data-testid={`complaint-location-${complaint.id}`}>{complaint.location_address}</strong><p data-testid={`complaint-description-${complaint.id}`}>{complaint.description}</p></div><div className="complaint-row-side"><StatusPill status={complaint.status} testId={`complaint-status-${complaint.id}`} /><span data-testid={`complaint-date-${complaint.id}`} className="muted-text">{new Date(complaint.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></div></div>)}</div>;
}

function ComplaintModal({ location, onClose, onSubmit, pending }: { location: typeof DEFAULT_LOCATION; onClose: () => void; onSubmit: (input: ComplaintInput) => void; pending: boolean }) {
  const [category, setCategory] = useState("Overflowing bin");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  return <Modal testId="complaint-modal" title="Report a waste issue" onClose={onClose}><form data-testid="complaint-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ category, priority, description, location_address: location.address, latitude: location.latitude, longitude: location.longitude, photo_url: photoUrl || null, pickup_requested: false }); }} className="form-stack"><div className="two-col-fields"><div className="field-group"><Label data-testid="complaint-category-label" htmlFor="complaint-category">Issue type</Label><select data-testid="complaint-category-select" id="complaint-category" value={category} onChange={(event) => setCategory(event.target.value)} className="native-select"><option>Overflowing bin</option><option>Illegal dumping</option><option>Street litter</option><option>Missed collection</option></select></div><div className="field-group"><Label data-testid="complaint-priority-label" htmlFor="complaint-priority">Priority</Label><select data-testid="complaint-priority-select" id="complaint-priority" value={priority} onChange={(event) => setPriority(event.target.value)} className="native-select"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div></div><div className="field-group"><Label data-testid="complaint-description-label" htmlFor="complaint-description">What did you notice?</Label><Textarea data-testid="complaint-description-input" id="complaint-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Tell the field team what needs attention..." required minLength={8} /></div><div className="field-group"><Label data-testid="complaint-photo-label" htmlFor="complaint-photo">Photo URL <span>(optional)</span></Label><Input data-testid="complaint-photo-input" id="complaint-photo" value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} placeholder="https://..." /></div><LocationButton location={location} onChange={() => undefined} /><Button data-testid="submit-complaint-button" type="submit" disabled={pending} className="primary-button w-full"><Send size={16} /> {pending ? "Sending report..." : "Submit complaint"}</Button></form></Modal>;
}

function PickupModal({ location, onClose, onSubmit, pending }: { location: typeof DEFAULT_LOCATION; onClose: () => void; onSubmit: (input: PickupInput) => void; pending: boolean }) {
  const [itemType, setItemType] = useState("Old furniture");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  return <Modal testId="pickup-modal" title="Schedule a doorstep pickup" onClose={onClose}><form data-testid="pickup-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ item_type: itemType, address: location.address, preferred_date: date, notes, latitude: location.latitude, longitude: location.longitude }); }} className="form-stack"><div className="field-group"><Label data-testid="pickup-item-label" htmlFor="pickup-item">What should we collect?</Label><select data-testid="pickup-item-select" id="pickup-item" value={itemType} onChange={(event) => setItemType(event.target.value)} className="native-select"><option>Old furniture</option><option>Garden waste</option><option>Electronics</option><option>Bulk household waste</option></select></div><div className="field-group"><Label data-testid="pickup-date-label" htmlFor="pickup-date">Preferred date</Label><Input data-testid="pickup-date-input" id="pickup-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></div><div className="field-group"><Label data-testid="pickup-notes-label" htmlFor="pickup-notes">Notes <span>(optional)</span></Label><Textarea data-testid="pickup-notes-input" id="pickup-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Gate code, access notes, quantity..." /></div><div data-testid="pickup-location-readout" className="location-readout location-readout-box"><MapPin size={16} /> {location.address}</div><Button data-testid="submit-pickup-button" type="submit" disabled={pending} className="primary-button w-full"><CalendarDays size={16} /> {pending ? "Scheduling..." : "Request pickup"}</Button></form></Modal>;
}

function AdminView({ complaints, metrics, workers, refresh }: { complaints: Complaint[]; metrics: Metrics | undefined; workers: Worker[]; refresh: () => void }) {
  const assignmentMutation = useMutation({ mutationFn: ({ id, workerId }: { id: string; workerId: string }) => apiPost<Complaint>(`/complaints/${id}/assign`, { worker_id: workerId }), onSuccess: () => { refresh(); toast.success("Worker assigned"); }, onError: (error) => toast.error(apiErrorMessage(error)) });
  const statusMutation = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => apiPatch<Complaint>(`/complaints/${id}/status`, { status }), onSuccess: () => { refresh(); toast.success("Complaint status updated"); }, onError: (error) => toast.error(apiErrorMessage(error)) });
  const hotspot = complaints.find((item) => item.priority === "critical" || item.priority === "high") ?? complaints[0];
  return <div data-testid="admin-dashboard" className="dashboard-content"><SectionHeading eyebrow="ADMIN / LIVE" title="Smart Waste Command Center" description="Real-time complaint intake, hotspot visibility and crew dispatch from one calm workspace." action={<div data-testid="admin-live-badge" className="live-badge"><span /> Live operations</div>} /><div data-testid="admin-metrics-grid" className="stats-grid admin-stats"><StatCard testId="admin-total-stat" label="Total reports" value={metrics?.total_reports ?? 0} icon={BarChart3} tone="slate" /><StatCard testId="admin-pending-stat" label="Pending" value={metrics?.pending ?? 0} icon={Clock3} tone="amber" /><StatCard testId="admin-progress-stat" label="In progress" value={metrics?.in_progress ?? 0} icon={RefreshCw} tone="blue" /><StatCard testId="admin-resolved-stat" label="Cleaned" value={metrics?.resolved ?? 0} icon={CheckCircle2} tone="green" /><StatCard testId="admin-risk-stat" label="High risk" value={metrics?.high_risk ?? 0} icon={AlertTriangle} tone="red" /></div><div className="content-grid admin-content-grid"><Card data-testid="admin-hotspot-card" className="surface-card"><CardHeader><div className="card-title-row"><div><p className="eyebrow">CITY MAP</p><CardTitle data-testid="admin-hotspot-title">Complaint hotspots</CardTitle></div><Badge data-testid="admin-map-source-badge" variant="outline">OSM live map</Badge></div></CardHeader><CardContent>{hotspot ? <LocationPreview latitude={hotspot.latitude ?? DEFAULT_LOCATION.latitude} longitude={hotspot.longitude ?? DEFAULT_LOCATION.longitude} label={hotspot.location_address} /> : <div data-testid="admin-map-empty" className="empty-state"><MapPin size={24} /><p>No complaint coordinates yet.</p></div>}<div data-testid="admin-hotspot-legend" className="map-legend"><span><i className="legend-dot red" /> Reported</span><span><i className="legend-dot blue" /> In progress</span><span><i className="legend-dot green" /> Cleaned</span></div></CardContent></Card><Card data-testid="admin-dispatch-card" className="surface-card"><CardHeader><div className="card-title-row"><div><p className="eyebrow">CREW DISPATCH</p><CardTitle data-testid="admin-dispatch-title">Active field teams</CardTitle></div><Users data-testid="admin-workers-icon" size={19} className="text-emerald-600" /></div></CardHeader><CardContent><div data-testid="admin-worker-list" className="worker-list">{workers.map((worker) => <div data-testid={`admin-worker-${worker.id}`} key={worker.id} className="worker-row"><div className="worker-avatar">{worker.name.slice(0, 1)}</div><div><strong data-testid={`admin-worker-name-${worker.id}`}>{worker.name}</strong><span data-testid={`admin-worker-vehicle-${worker.id}`}>{worker.vehicle}</span></div><span className="worker-online"><span /> Active</span></div>)}</div></CardContent></Card></div><Card data-testid="admin-complaints-table" className="surface-card admin-table-card"><CardHeader><div className="card-title-row"><div><p className="eyebrow">INBOX</p><CardTitle data-testid="admin-complaints-title">Complaint dispatch board</CardTitle></div><span data-testid="admin-complaints-count" className="muted-text">{complaints.length} reports</span></div></CardHeader><CardContent><div data-testid="admin-complaints-list" className="admin-list">{complaints.map((complaint) => <div data-testid={`admin-complaint-row-${complaint.id}`} key={complaint.id} className="admin-complaint-row"><div className="admin-complaint-copy"><div className="complaint-category"><span className={`priority-dot priority-${complaint.priority}`} /> {complaint.category}<span className="bullet">•</span><span data-testid={`admin-citizen-${complaint.id}`}>{complaint.citizen_name}</span></div><strong data-testid={`admin-location-${complaint.id}`}>{complaint.location_address}</strong><p data-testid={`admin-description-${complaint.id}`}>{complaint.description}</p></div><div className="admin-controls"><StatusPill status={complaint.status} testId={`admin-status-${complaint.id}`} /><select data-testid={`assign-worker-select-${complaint.id}`} value={complaint.assigned_worker_id ?? ""} onChange={(event) => event.target.value && assignmentMutation.mutate({ id: complaint.id, workerId: event.target.value })} className="native-select compact-select"><option value="">Assign worker</option>{workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select><select data-testid={`update-status-select-${complaint.id}`} value={complaint.status} onChange={(event) => statusMutation.mutate({ id: complaint.id, status: event.target.value })} className="native-select compact-select"><option value="reported">Reported</option><option value="assigned">Assigned</option><option value="in_progress">In progress</option><option value="resolved">Cleaned</option></select></div></div>)}</div></CardContent></Card></div>;
}

function WorkerView({ user, tasks, refresh }: { user: User; tasks: Complaint[]; refresh: () => void }) {
  const [completeId, setCompleteId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const startMutation = useMutation({ mutationFn: (id: string) => apiPost<Complaint>(`/worker/tasks/${id}/start`), onSuccess: () => { refresh(); toast.success("Task started — stay safe out there"); }, onError: (error) => toast.error(apiErrorMessage(error)) });
  const completeMutation = useMutation({ mutationFn: ({ id, resolution_note }: { id: string; resolution_note: string }) => apiPost<Complaint>(`/worker/tasks/${id}/complete`, { resolution_note }), onSuccess: () => { setCompleteId(null); setNote(""); refresh(); toast.success("Task marked complete"); }, onError: (error) => toast.error(apiErrorMessage(error)) });
  const open = tasks.filter((task) => task.status !== "resolved").length;
  const completed = tasks.filter((task) => task.status === "resolved").length;
  return <div data-testid="worker-dashboard" className="dashboard-content"><SectionHeading eyebrow={`WORKER / ${user.name.toUpperCase()}`} title="Today's collection tasks" description={`${user.name} · Shift 08:00–16:00 · Keep the city moving.`} action={<button data-testid="worker-route-button" type="button" onClick={() => toast.info("Optimized route uses each task's live coordinates")} className="outline-button"><Navigation size={16} /> View optimized route</button>} /><div data-testid="worker-stats-grid" className="stats-grid worker-stats"><StatCard testId="worker-open-stat" label="Open tasks" value={open} icon={ClipboardCheck} tone="amber" /><StatCard testId="worker-completed-stat" label="Completed" value={completed} icon={CheckCircle2} tone="green" /><StatCard testId="worker-distance-stat" label="Distance today" value="8.4 km" icon={Navigation} tone="blue" /></div><div className="content-grid worker-content-grid"><Card data-testid="worker-task-card" className="surface-card"><CardHeader><div className="card-title-row"><div><p className="eyebrow">TASK QUEUE</p><CardTitle data-testid="worker-task-title">Assigned jobs</CardTitle></div><Badge data-testid="worker-task-count" variant="secondary">{tasks.length} stops</Badge></div></CardHeader><CardContent><div data-testid="worker-task-list" className="task-list">{tasks.map((task) => <div data-testid={`worker-task-${task.id}`} key={task.id} className={`task-card priority-border-${task.priority}`}><div className="task-card-top"><div><span data-testid={`worker-task-priority-${task.id}`} className={`priority-label priority-${task.priority}`}>{task.priority} priority</span><h3 data-testid={`worker-task-category-${task.id}`}>{task.category}</h3></div><StatusPill status={task.status} testId={`worker-task-status-${task.id}`} /></div><p data-testid={`worker-task-location-${task.id}`} className="task-location"><MapPin size={15} /> {task.location_address}</p><p data-testid={`worker-task-description-${task.id}`} className="muted-text">{task.description}</p>{task.status === "resolved" ? <div data-testid={`worker-task-complete-note-${task.id}`} className="completion-note"><CheckCircle2 size={16} /> {task.resolution_note ?? "Completed and verified"}</div> : task.status === "reported" || task.status === "assigned" ? <Button data-testid={`start-task-button-${task.id}`} type="button" onClick={() => startMutation.mutate(task.id)} disabled={startMutation.isPending} className="primary-button w-full"><Navigation size={16} /> Start task</Button> : <Button data-testid={`complete-task-button-${task.id}`} type="button" onClick={() => setCompleteId(task.id)} className="secondary-button w-full"><CheckCircle2 size={16} /> Mark as complete</Button>}</div>)}</div>{!tasks.length && <div data-testid="worker-empty-state" className="empty-state"><Truck size={24} /><p>No tasks are assigned to you yet.</p></div>}</CardContent></Card><Card data-testid="worker-map-card" className="surface-card"><CardHeader><div className="card-title-row"><div><p className="eyebrow">FIELD VIEW</p><CardTitle data-testid="worker-map-title">Route preview</CardTitle></div><MapPin data-testid="worker-map-icon" size={19} className="text-emerald-600" /></div></CardHeader><CardContent>{tasks[0] ? <LocationPreview latitude={tasks[0].latitude ?? DEFAULT_LOCATION.latitude} longitude={tasks[0].longitude ?? DEFAULT_LOCATION.longitude} label={tasks[0].location_address} /> : <div data-testid="worker-map-empty" className="empty-state"><MapPin size={24} /><p>Map appears when a task is assigned.</p></div>}</CardContent></Card></div>{completeId && <Modal testId="complete-task-modal" title="Close this field task" onClose={() => setCompleteId(null)}><form data-testid="complete-task-form" onSubmit={(event) => { event.preventDefault(); completeMutation.mutate({ id: completeId, resolution_note: note }); }} className="form-stack"><div className="field-group"><Label data-testid="resolution-note-label" htmlFor="resolution-note">Resolution note</Label><Textarea data-testid="resolution-note-input" id="resolution-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="What did you clean or collect?" required minLength={3} /></div><Button data-testid="submit-complete-task-button" type="submit" disabled={completeMutation.isPending} className="primary-button w-full"><CheckCircle2 size={16} /> Confirm completion</Button></form></Modal>}</div>;
}

export default function Home() {
  const queryClient = useQueryClient();
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const me = useQuery({ queryKey: ["me"], queryFn: () => apiGet<User>("/auth/me"), retry: false });
  const user = me.data;
  const complaints = useQuery({ queryKey: ["complaints", user?.id], queryFn: () => apiGet<Complaint[]>("/complaints"), enabled: Boolean(user), retry: false });
  const pickups = useQuery({ queryKey: ["pickups", user?.id], queryFn: () => apiGet<Pickup[]>("/pickups"), enabled: user?.role === "citizen", retry: false });
  const metrics = useQuery({ queryKey: ["metrics"], queryFn: () => apiGet<Metrics>("/admin/metrics"), enabled: user?.role === "admin", retry: false });
  const workers = useQuery({ queryKey: ["workers"], queryFn: () => apiGet<Worker[]>("/admin/workers"), enabled: user?.role === "admin", retry: false });
  const tasks = useQuery({ queryKey: ["tasks", user?.id], queryFn: () => apiGet<Complaint[]>("/worker/tasks"), enabled: user?.role === "worker", retry: false });
  const refresh = () => { void queryClient.invalidateQueries({ queryKey: ["complaints"] }); void queryClient.invalidateQueries({ queryKey: ["pickups"] }); void queryClient.invalidateQueries({ queryKey: ["metrics"] }); void queryClient.invalidateQueries({ queryKey: ["tasks"] }); };
  const logoutMutation = useMutation({ mutationFn: () => apiPost<{ message: string }>("/auth/logout"), onSuccess: () => { queryClient.setQueryData(["me"], undefined); queryClient.removeQueries({ queryKey: ["complaints"] }); toast.success("Signed out safely"); } });
  const switchRoleMutation = useMutation({
    mutationFn: (input: RoleSwitchInput) => apiPost<AuthResponse>("/auth/switch-role", input),
    onSuccess: (data) => {
      queryClient.setQueryData(["me"], data.user);
      toast.success(`${data.user.role[0].toUpperCase()}${data.user.role.slice(1)} workspace opened`);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });
  const mainView = useMemo(() => {
    if (!user) return null;
    if (user.role === "admin") return <AdminView complaints={complaints.data ?? []} metrics={metrics.data} workers={workers.data ?? []} refresh={refresh} />;
    if (user.role === "worker") return <WorkerView user={user} tasks={tasks.data ?? []} refresh={refresh} />;
    return <CitizenView complaints={complaints.data ?? []} pickups={pickups.data ?? []} location={location} setLocation={setLocation} refresh={refresh} />;
  }, [complaints.data, location, metrics.data, pickups.data, tasks.data, user, workers.data]);

  if (me.isPending) return <main data-testid="app-loading" className="loading-screen"><Logo /><span data-testid="loading-message">Preparing your clean city workspace...</span></main>;
  if (me.isError || !user) return <AuthScreen onLogin={() => undefined} />;
  return <div data-testid="ecoclean-app" className="app-shell"><AppHeader user={user} onLogout={() => logoutMutation.mutate()} onRoleChange={(role) => switchRoleMutation.mutate({ role })} />{mainView}<footer data-testid="app-footer" className="app-footer"><span><Leaf size={14} /> Building cleaner neighbourhoods together</span><span>EcoClean civic operations · {new Date().getFullYear()}</span></footer></div>;
}
