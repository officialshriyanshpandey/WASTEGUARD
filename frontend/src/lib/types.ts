export type Role = "citizen" | "worker" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
}

export interface AuthResponse {
  user: User;
}

export interface RoleSwitchInput {
  role: Role;
}

export interface Complaint {
  id: string;
  category: string;
  priority: string;
  description: string;
  location_address: string;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  pickup_requested: boolean;
  status: string;
  citizen_id: string;
  citizen_name: string;
  assigned_worker_id: string | null;
  assigned_worker_name: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplaintInput {
  category: string;
  priority: string;
  description: string;
  location_address: string;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  pickup_requested: boolean;
}

export interface Pickup {
  id: string;
  citizen_id: string;
  citizen_name: string;
  item_type: string;
  address: string;
  preferred_date: string;
  notes: string | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface PickupInput {
  item_type: string;
  address: string;
  preferred_date: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Worker {
  id: string;
  name: string;
  email: string;
  vehicle: string;
  active: boolean;
}

export interface Metrics {
  total_reports: number;
  pending: number;
  in_progress: number;
  resolved: number;
  high_risk: number;
  open_pickups: number;
}

export type WasteSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AnalysisMode = "real_ai" | "demo_fallback";

export interface AIAnalysis {
  detected_issue: string;
  waste_type: string;
  severity: WasteSeverity;
  estimated_fill_level: number;
  recommended_action: string;
  confidence: number;
  analysis_mode: AnalysisMode;
  disclaimer: string;
}

export interface TimelineEvent {
  label: string;
  at: string;
}

export interface WasteReport {
  id: string;
  complaint_code: string;
  citizen_id: string;
  citizen_name: string;
  detected_issue: string;
  waste_type: string;
  severity: WasteSeverity;
  estimated_fill_level: number;
  recommended_action: string;
  ai_confidence: number;
  analysis_mode: AnalysisMode;
  location_address: string;
  area: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  before_image: string | null;
  after_image: string | null;
  status: string;
  assigned_worker_id: string | null;
  assigned_worker_name: string | null;
  assigned_vehicle: string | null;
  verification_status: string;
  resolution_note: string | null;
  timeline: TimelineEvent[];
  created_at: string;
  updated_at: string;
}

export interface WasteGuardMetrics {
  total_reports: number;
  pending: number;
  resolved: number;
  high_risk_areas: number;
  active_workers: number;
}

export interface Hotspot {
  area: string;
  risk_level: string;
  risk_score: number;
  predicted_overflow_hours: number;
  complaints: number;
  missed_pickups: number;
  recommended_action: string;
  latitude: number;
  longitude: number;
  demo_simulated: boolean;
}

export interface RouteStop {
  label: string;
  area: string;
  severity: string;
  latitude: number;
  longitude: number;
}

export interface SmartRoute {
  traditional_distance_km: number;
  optimized_distance_km: number;
  saved_distance_km: number;
  stops: RouteStop[];
  demo_simulated: boolean;
}

export interface RewardSummary {
  points: number;
  badges: string[];
  rank: number;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}
