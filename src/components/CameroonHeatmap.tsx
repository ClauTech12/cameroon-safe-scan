import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { Layer, PathOptions } from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import "leaflet/dist/leaflet.css";

// Maps user-entered locations -> canonical GeoJSON shapeName
const REGION_ALIASES: Record<string, string> = {
  centre: "Centre",
  center: "Centre",
  "yaoundé": "Centre",
  yaounde: "Centre",
  littoral: "Littoral",
  douala: "Littoral",
  west: "West",
  ouest: "West",
  bafoussam: "West",
  northwest: "North-West",
  "north-west": "North-West",
  "north west": "North-West",
  "nord-ouest": "North-West",
  bamenda: "North-West",
  southwest: "South-West",
  "south-west": "South-West",
  "south west": "South-West",
  "sud-ouest": "South-West",
  "far north": "Far North",
  farnorth: "Far North",
  "extrême-nord": "Far North",
  "extreme-nord": "Far North",
  maroua: "Far North",
  north: "North",
  nord: "North",
  garoua: "North",
  adamawa: "Adamaoua",
  adamaoua: "Adamaoua",
  east: "East",
  est: "East",
  south: "South",
  sud: "South",
};

function normalizeRegion(loc: string | null | undefined): string | null {
  if (!loc) return null;
  const k = loc.trim().toLowerCase();
  if (REGION_ALIASES[k]) return REGION_ALIASES[k];
  // try partial match
  for (const [alias, canonical] of Object.entries(REGION_ALIASES)) {
    if (k.includes(alias)) return canonical;
  }
  return null;
}

function colorForCount(c: number, max: number): string {
  if (c === 0) return "hsl(142 70% 45% / 0.25)"; // green low
  const r = max > 0 ? c / max : 0;
  if (r < 0.25) return "hsl(142 70% 45% / 0.55)";
  if (r < 0.5) return "hsl(48 95% 55% / 0.65)";
  if (r < 0.75) return "hsl(25 95% 55% / 0.7)";
  return "hsl(0 84% 55% / 0.75)";
}

type Props = {
  reports: { location: string }[];
};

export function CameroonHeatmap({ reports }: Props) {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<{ name: string; count: number } | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/geo/cameroon-regions.geojson")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { if (!cancelled) setGeo(d); })
      .catch((e) => { if (!cancelled) { setError(String(e)); console.error("[Heatmap] GeoJSON load failed:", e); } });
    return () => { cancelled = true; };
  }, []);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    reports.forEach((r) => {
      const region = normalizeRegion(r.location);
      if (region) m.set(region, (m.get(region) ?? 0) + 1);
    });
    return m;
  }, [reports]);

  const max = useMemo(() => Math.max(0, ...counts.values()), [counts]);

  const styleFn = (feature?: Feature<Geometry, any>): PathOptions => {
    const name = feature?.properties?.shapeName ?? "";
    const c = counts.get(name) ?? 0;
    return {
      fillColor: colorForCount(c, max),
      weight: 1,
      color: "hsl(var(--border))",
      fillOpacity: 1,
    };
  };

  const onEach = (feature: Feature<Geometry, any>, layer: Layer) => {
    const name = feature.properties?.shapeName ?? "Unknown";
    const c = counts.get(name) ?? 0;
    layer.on({
      mouseover: (e) => {
        (e.target as any).setStyle({ weight: 2.5, color: "hsl(var(--primary))" });
        setHovered({ name, count: c });
      },
      mouseout: (e) => {
        layerRef.current?.resetStyle(e.target);
        setHovered(null);
      },
    });
    (layer as any).bindTooltip(`${name}: ${c} report${c === 1 ? "" : "s"}`, { sticky: true });
  };

  return (
    <div className="relative">
      <div
        className="rounded-xl overflow-hidden border border-border"
        style={{ height: 420, minHeight: 400, background: "hsl(var(--muted))" }}
      >
        {error && (
          <div className="h-full grid place-items-center text-sm text-destructive p-4 text-center">
            Failed to load Cameroon map. {error}
          </div>
        )}
        {!error && (
          <MapContainer
            center={[7.37, 12.35]}
            zoom={5}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%", background: "hsl(var(--muted))" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {geo && (
              <GeoJSON
                key={`${reports.length}-${max}`}
                data={geo}
                style={styleFn as any}
                onEachFeature={onEach}
                ref={(l) => { layerRef.current = l as any; }}
              />
            )}
          </MapContainer>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <span className="text-muted-foreground">Activity:</span>
        {[
          { label: "None", color: "hsl(142 70% 45% / 0.25)" },
          { label: "Low", color: "hsl(142 70% 45% / 0.55)" },
          { label: "Medium", color: "hsl(48 95% 55% / 0.65)" },
          { label: "High", color: "hsl(25 95% 55% / 0.7)" },
          { label: "Very high", color: "hsl(0 84% 55% / 0.75)" },
        ].map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span className="h-3 w-4 rounded-sm border border-border" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        {hovered && (
          <span className="ml-auto font-medium">
            {hovered.name}: <span className="tabular-nums">{hovered.count}</span>
          </span>
        )}
      </div>
    </div>
  );
}
