import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { divIcon, latLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, FileText, Clock, CheckCircle2, AlertTriangle, SlidersHorizontal } from "lucide-react";
import { supabase } from "../components/supabaseClient";
import "./AdminLocations.css";
import Footer from "../components/footer"

const TILE_LAYERS = {
  Map: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  Satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
};

// Mirrors the reports.status CHECK constraint in Supabase.
const STATUS_META = {
  open: { label: "Open", badge: "red", marker: "#ef4444" },
  in_progress: { label: "In Progress", badge: "orange", marker: "#f59e0b" },
  under_review: { label: "Under Review", badge: "purple", marker: "#8b5cf6" },
  resolved: { label: "Resolved", badge: "green", marker: "#059669" },
  rejected: { label: "Rejected", badge: "red", marker: "#ef4444" },
  closed: { label: "Closed", badge: "green", marker: "#059669" },
};
const OPEN_STATUSES = ["open", "in_progress", "under_review",];
const OVERDUE_AFTER_DAYS = 7;
const DEFAULT_MARKER_COLOR = "#059669";
const MAP_RETENTION_MS = 2 * 24 * 60 * 60 * 1000;

function isVisibleOnMap(report) {
  if (!(report.status === "resolved" || report.status === "closed")) return true;
  const resolution = [...(report.issue_resolutions || [])]
    .filter((item) => item.attended_at)
    .sort((a, b) => new Date(b.attended_at) - new Date(a.attended_at))[0];
  return !resolution?.attended_at
    || Date.now() - new Date(resolution.attended_at).getTime() < MAP_RETENTION_MS;
}
const MAP_CENTER = [-25.7545, 28.2293]; // Pretoria, South Africa
const DEFAULT_ZOOM = 13;

const dateFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
});

function isOverdue(row) {
  if (!OPEN_STATUSES.includes(row.status)) return false;
  const ageMs = Date.now() - new Date(row.created_at).getTime();
  return ageMs > OVERDUE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

function hasValidCoordinates(latitude, longitude) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
}

function StatCard({ label, value, description, colorClass, icon: Icon }) {
  return (
    <div className={`manager-stat-card ${colorClass}`}>
      <span className="manager-stat-icon"><Icon size={20} aria-hidden="true" /></span>
      <div className="manager-stat-copy">
        <span className="manager-stat-label">{label}</span>
        <strong className="manager-stat-value">{value}</strong>
        <small>{description}</small>
      </div>
    </div>
  );
}

function getLocationIcon(color) {
  return divIcon({
    className: "manager-location-pin-container",
    html: `<span class="manager-location-pin" style="--pin-color:${color}"><span></span></span>`,
    iconSize: [30, 38],
    iconAnchor: [15, 36],
    popupAnchor: [0, -34],
  });
}

// Styled to match the "Category Breakdown" card on the Analysis page:
// a CSS conic-gradient donut with a compact percentage legend beside it.
function ProgressDonut({ segments, total }) {
  let acc = 0;
  const stops = segments.map((segment) => {
    const start = acc;
    acc += segment.pct;
    return `${segment.color} ${start}% ${acc}%`;
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "4px 0 14px" }}>
      <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: `conic-gradient(${stops.join(", ")})` }} />
        <div style={{ position: "absolute", inset: 14, borderRadius: "50%", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{total}</div>
          <div style={{ fontSize: 9.5, color: "#6B7280" }}>Total</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1, minWidth: 0 }}>
        {segments.map((segment) => (
          <div key={segment.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: segment.color, flexShrink: 0 }} />
            <span style={{ flex: 1, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{segment.label}</span>
            <span style={{ fontWeight: 700, color: "#111827" }}>{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminLocations() {
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  const [mapMode, setMapMode] = useState("Map");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocation, setNewLocation] = useState({
    title: "",
    description: "",
    location: "",
    category_id: "",
    severity: "Low",
    latitude: String(MAP_CENTER[0]),
    longitude: String(MAP_CENTER[1]),
  });
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState("");
  const mapCardRef = useRef(null);
  const leafletMapRef = useRef(null);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("reports")
      .select(
        `id, title, description, location, latitude, longitude, status, severity, created_at, updated_at,
         issue_resolutions(attended_at),
         category:categories(category_name),
         reporter:profiles!reports_user_id_fkey(full_name, username)`
      )
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError(error.message);
      return;
    }
    setLoadError("");
    setReports(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, category_name")
      .order("category_name", { ascending: true });
    if (!error) setCategories(data || []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchReports(), fetchCategories()]);
      setLoading(false);
    })();

    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data?.user?.id ?? null);
    });

    // Keep the dashboard live: refetch whenever a report changes anywhere else
    // (a citizen submitting a report, another admin updating a status, etc.)
    const channel = supabase
      .channel("admin-locations-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
        fetchReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (categories.length && !newLocation.category_id) {
      setNewLocation((current) => ({ ...current, category_id: categories[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const rows = useMemo(
    () =>
      reports.map((report) => {
        const meta = STATUS_META[report.status] || { label: report.status, badge: "blue", marker: DEFAULT_MARKER_COLOR };
        const overdue = isOverdue(report);
        return {
          id: report.id,
          displayId: `#${report.id.slice(0, 8).toUpperCase()}`,
          title: report.title || report.description?.slice(0, 60) || "Untitled report",
          location: report.location || "Unspecified location",
          category: report.category?.category_name || "Uncategorized",
          status: report.status,
          statusLabel: meta.label,
          badgeClass: meta.badge,
          markerColor: overdue ? "#ef4444" : meta.marker,
          overdue,
          reporter: report.reporter?.full_name || report.reporter?.username || "Unknown",
          date: report.created_at ? dateFormatter.format(new Date(report.created_at)) : "—",
          updated_at: report.updated_at,
          issue_resolutions: report.issue_resolutions || [],
          lat: report.latitude != null ? Number(report.latitude) : null,
          lng: report.longitude != null ? Number(report.longitude) : null,
        };
      }),
    [reports]
  );

  const categoryOptions = ["All Categories", ...categories.map((c) => c.category_name)];
  const statusOptions = ["All Statuses", ...Object.values(STATUS_META).map((m) => m.label)];

  const filteredLocations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return rows.filter((item) => {
      if (selectedCategory !== "All Categories" && item.category !== selectedCategory) return false;
      if (selectedStatus !== "All Statuses" && item.statusLabel !== selectedStatus) return false;
      if (query) {
        const haystack = `${item.title} ${item.location} ${item.category}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [rows, selectedCategory, selectedStatus, searchQuery]);

  const mapLocations = useMemo(() => filteredLocations.filter(isVisibleOnMap), [filteredLocations]);

  const recentLocations = useMemo(() => filteredLocations.slice(0, 4), [filteredLocations]);

  const stats = useMemo(() => {
    const total = filteredLocations.length;
    const active = filteredLocations.filter((r) => OPEN_STATUSES.includes(r.status)).length;
    const inProgress = filteredLocations.filter((r) => r.status === "in_progress").length;
    const resolved = filteredLocations.filter((r) => r.status === "resolved" || r.status === "closed").length;
    const overdue = filteredLocations.filter((r) => r.overdue).length;
    return [
      { label: "Total Locations", value: String(total), description: `${active} currently active`, colorClass: "green", icon: MapPin },
      { label: "Active Reports", value: String(active), description: `${overdue} overdue`, colorClass: "blue", icon: FileText },
      { label: "In Progress", value: String(inProgress), description: "Currently being worked on", colorClass: "orange", icon: Clock },
      { label: "Resolved", value: String(resolved), description: "Resolved or closed", colorClass: "purple", icon: CheckCircle2 },
      { label: "Overdue", value: String(overdue), description: `Open more than ${OVERDUE_AFTER_DAYS} days`, colorClass: "red", icon: AlertTriangle },
    ];
  }, [filteredLocations]);

  const donutSegments = useMemo(() => {
    const active = filteredLocations.filter((r) => OPEN_STATUSES.includes(r.status) && !r.overdue).length;
    const inProgress = filteredLocations.filter((r) => r.status === "in_progress").length;
    const resolved = filteredLocations.filter((r) => r.status === "resolved" || r.status === "closed").length;
    const overdue = filteredLocations.filter((r) => r.overdue).length;
    const total = filteredLocations.length || 1;
    const raw = [
      { label: "Active", value: active, color: "#ef4444" },
      { label: "In Progress", value: inProgress, color: "#f59e0b" },
      { label: "Resolved", value: resolved, color: "#059669" },
      { label: "Overdue", value: overdue, color: "#8b5cf6" },
    ];
    return raw.map((segment) => ({ ...segment, pct: (segment.value / total) * 100 }));
  }, [filteredLocations]);
  const donutTotal = donutSegments.reduce((sum, s) => sum + s.value, 0);

  const topAreas = useMemo(() => {
    const counts = new Map();
    filteredLocations.forEach((r) => {
      counts.set(r.location, (counts.get(r.location) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));
  }, [filteredLocations]);

  const handleAddLocation = () => setShowAddModal(true);

  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewLocation({
      title: "",
      description: "",
      location: "",
      category_id: categories[0]?.id || "",
      severity: "Low",
      latitude: String(MAP_CENTER[0]),
      longitude: String(MAP_CENTER[1]),
    });
  };

  const handleSubmitLocation = async (event) => {
    event.preventDefault();
    if (!currentUserId) {
      setNotification("You need to be signed in to add a location.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("reports").insert({
      user_id: currentUserId,
      category_id: newLocation.category_id || null,
      title: newLocation.title,
      description: newLocation.description || newLocation.title,
      location: newLocation.location,
      severity: newLocation.severity,
      latitude: newLocation.latitude ? Number(newLocation.latitude) : null,
      longitude: newLocation.longitude ? Number(newLocation.longitude) : null,
      status: "open",
    });
    setSaving(false);

    if (error) {
      setNotification(`Couldn't save location: ${error.message}`);
      return;
    }
    await fetchReports();
    handleCloseModal();
    setNotification("New location added successfully.");
  };

  const handleFullscreen = async () => {
    if (!mapCardRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await mapCardRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
      // Leaflet caches container size; nudge it after the layout settles.
      setTimeout(() => leafletMapRef.current?.invalidateSize(), 150);
    } catch (error) {
      setNotification("Unable to enter fullscreen mode.");
    }
  };

  const handleZoomIn = () => leafletMapRef.current?.zoomIn();
  const handleZoomOut = () => leafletMapRef.current?.zoomOut();
  const handleCenterLocation = () => {
    leafletMapRef.current?.setView(MAP_CENTER, DEFAULT_ZOOM);
    setNotification("Map centered on the main service area.");
  };

  const handleToggleFilters = () => setShowFilters((value) => !value);
  const handleResetFilters = () => {
    setSelectedCategory("All Categories");
    setSelectedStatus("All Statuses");
    setSearchQuery("");
    setNotification("Filters have been reset.");
  };

  return (
    <div className="admin-locations-page">
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">System overview and statistics.</p>
        </div>
      </div>

        {notification && (
          <div className="toast-notification">
            <span>{notification}</span>
            <button className="notification-close" onClick={() => setNotification("")}>✕</button>
          </div>
        )}

        {loadError && (
          <div className="toast-notification" style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#b91c1c" }}>
            <span>Couldn't load reports: {loadError}</span>
          </div>
        )}

        {loading ? (
          <div className="table-card">Loading locations…</div>
        ) : (
          <>
            <section className="manager-stats-grid">
              {stats.map((item) => (
                <StatCard key={item.label} {...item} />
              ))}
            </section>

            <section className="dashboard-grid">
              <article className="map-card" ref={mapCardRef}>
                <div className="map-card-header">
                  <div>
                    <p className="card-title">Interactive Map</p>
                    <p className="card-subtitle">Review location status across the service area.</p>
                  </div>
                  <div className="map-controls">
                    <button className={`tab ${mapMode === "Map" ? "active" : ""}`} onClick={() => setMapMode("Map")}>
                      Map
                    </button>
                    <button className={`tab ${mapMode === "Satellite" ? "active" : ""}`} onClick={() => setMapMode("Satellite")}>Satellite</button>
                  </div>
                </div>
                <div className="map-toolbar">
                  <button
                    className="toolbar-button map-filter-toggle"
                    onClick={handleToggleFilters}
                    aria-expanded={showFilters}
                    aria-controls="manager-map-filters"
                  >
                    <SlidersHorizontal size={16} aria-hidden="true" />
                    Filters
                    {(selectedCategory !== "All Categories" || selectedStatus !== "All Statuses" || searchQuery) && (
                      <span className="map-filter-count">Active</span>
                    )}
                  </button>
                  <div className="toolbar-actions">
                    <button className="toolbar-button" onClick={handleZoomIn}>＋</button>
                    <button className="toolbar-button" onClick={handleZoomOut}>−</button>
                    <button className="toolbar-button" onClick={handleFullscreen}>⛶</button>
                    <button className="toolbar-button" onClick={handleCenterLocation}>◎</button>
                  </div>
                </div>
                {showFilters && (
                  <div className="map-filters-panel" id="manager-map-filters">
                    <div className="filter-group">
                      <label htmlFor="map-search">Search locations</label>
                      <input
                        id="map-search"
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search title, area or category"
                      />
                    </div>
                    <div className="filter-group">
                      <label htmlFor="map-category">Category</label>
                      <select id="map-category" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                        {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                    <div className="filter-group">
                      <label htmlFor="map-status">Status</label>
                      <select id="map-status" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                        {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                    <button className="filter-reset-button" onClick={handleResetFilters}>Reset filters</button>
                  </div>
                )}
                <div className="map-scene">
                  <MapContainer
                    center={latLng(MAP_CENTER[0], MAP_CENTER[1])}
                    zoom={DEFAULT_ZOOM}
                    scrollWheelZoom
                    className="leaflet-map"
                    ref={leafletMapRef}
                  >
                    <TileLayer key={mapMode} url={TILE_LAYERS[mapMode].url} attribution={TILE_LAYERS[mapMode].attribution} />
                    {mapLocations
                      .filter((item) => hasValidCoordinates(item.lat, item.lng))
                      .map((item) => (
                        <Marker
                          key={item.id}
                          position={latLng(item.lat, item.lng)}
                          icon={getLocationIcon(item.markerColor)}
                        >
                          <Popup>
                            <strong>{item.title}</strong>
                            <br />
                            {item.location}
                            <br />
                            <span className={`badge status-badge ${item.badgeClass}`}>{item.statusLabel}</span>
                            {item.overdue && <span className="badge status-badge red" style={{ marginLeft: 6 }}>Overdue</span>}
                            <br />
                            Reported by {item.reporter} · {item.date}
                          </Popup>
                        </Marker>
                      ))}
                  </MapContainer>
                </div>
                <div className="map-legend">
                  <div className="legend-item"><span className="legend-dot" style={{ background: "#059669" }}></span>Resolved</div>
                  <div className="legend-item"><span className="legend-dot" style={{ background: "#f59e0b" }}></span>In Progress</div>
                  <div className="legend-item"><span className="legend-dot" style={{ background: "#8b5cf6" }}></span>Under Review</div>
                  <div className="legend-item"><span className="legend-dot" style={{ background: "#ef4444" }}></span>Unresolved</div>
                  <div className="legend-item"><span className="legend-dot" style={{ background: "#ef4444" }}></span>Overdue</div>
                </div>
              </article>

              <aside className="overview-card">
                <div className="overview-header">
                  <div>
                    <p className="card-title">Location Overview</p>
                    <p className="card-subtitle">{filteredLocations.length} matching locations</p>
                  </div>
                </div>
                <div className="overview-filters" aria-label="Filter location overview">
                  <label>
                    <span>Category</span>
                    <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                      {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Status</span>
                    <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                      {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                </div>
                <ProgressDonut segments={donutSegments} total={donutTotal} />
                <div className="top-areas">
                  <div className="section-header">
                    <p className="section-title">Top Areas</p>
                  </div>
                  <ul>
                    {topAreas.map((area) => (
                      <li key={area.location}>
                        <span>{area.location}</span>
                        <strong>{area.count}</strong>
                      </li>
                    ))}
                    {topAreas.length === 0 && <li><span>No reports yet</span></li>}
                  </ul>
                </div>
              </aside>
            </section>

            <section className="content-grid">
              <article className="table-card">
                <div className="table-card-header">
                  <div>
                    <p className="card-title">Recent Locations</p>
                    <p className="card-subtitle">Latest reports and current response status.</p>
                  </div>
                  <span className="table-badge">{recentLocations.length} of {filteredLocations.length} records</span>
                </div>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Report Title</th>
                        <th>Location</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Date Reported</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLocations.map((item) => (
                        <tr key={item.id}>
                          <td data-label="Report title">{item.title}</td>
                          <td data-label="Location">{item.location}</td>
                          <td data-label="Category"><span className="badge category-badge">{item.category}</span></td>
                          <td data-label="Status">
                            <span className={`badge status-badge ${item.badgeClass}`}>{item.statusLabel}</span>
                            {item.overdue && <span className="badge status-badge red" style={{ marginLeft: 6 }}>Overdue</span>}
                          </td>
                          <td data-label="Date reported">{item.date}</td>
                        </tr>
                      ))}
                      {recentLocations.length === 0 && (
                        <tr><td className="empty-table-cell" colSpan={5}>No locations match the current filters.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>

            </section>
          </>
        )}

        {showAddModal && (
          <div className="modal-backdrop" onClick={handleCloseModal}>
            <div className="modal-card" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>Add Location</h2>
                  <p>Enter a new report location to add it to the dashboard.</p>
                </div>
                <button className="modal-close" onClick={handleCloseModal} aria-label="Close modal">✕</button>
              </div>
              <form className="modal-form" onSubmit={handleSubmitLocation}>
                <label>
                  Report Title
                  <input
                    type="text"
                    value={newLocation.title}
                    onChange={(event) => setNewLocation((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Enter report title"
                    required
                  />
                </label>
                <label>
                  Description
                  <input
                    type="text"
                    value={newLocation.description}
                    onChange={(event) => setNewLocation((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Brief description of the issue"
                  />
                </label>
                <label>
                  Location
                  <input
                    type="text"
                    value={newLocation.location}
                    onChange={(event) => setNewLocation((current) => ({ ...current, location: event.target.value }))}
                    placeholder="Enter location"
                    required
                  />
                </label>
                <label>
                  Category
                  <select
                    value={newLocation.category_id}
                    onChange={(event) => setNewLocation((current) => ({ ...current, category_id: event.target.value }))}
                  >
                    {categories.map((option) => (
                      <option key={option.id} value={option.id}>{option.category_name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Severity
                  <select
                    value={newLocation.severity}
                    onChange={(event) => setNewLocation((current) => ({ ...current, severity: event.target.value }))}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>
                <label>
                  Latitude
                  <input
                    type="number"
                    step="any"
                    value={newLocation.latitude}
                    onChange={(event) => setNewLocation((current) => ({ ...current, latitude: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Longitude
                  <input
                    type="number"
                    step="any"
                    value={newLocation.longitude}
                    onChange={(event) => setNewLocation((current) => ({ ...current, longitude: event.target.value }))}
                    required
                  />
                </label>
                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving…" : "Save Location"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
}