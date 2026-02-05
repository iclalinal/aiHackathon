import { useEffect, useRef, useState } from 'react';

export default function AdminMapView({ reports, onMarkerClick, selectedReport }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Load Leaflet dynamically
    if (typeof window !== 'undefined' && !window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else if (window.L) {
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = window.L;

    // Initialize map centered on Berlin (default)
    mapInstanceRef.current = L.map(mapRef.current).setView([52.52, 13.405], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !reports.length) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Define marker colors by severity
    const getMarkerColor = (severity, status) => {
      if (status === 'repaired') return '#22c55e';
      if (status === 'pending' || status === 'analyzing') return '#6b7280';
      const colors = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };
      return colors[severity] || '#3b82f6';
    };

    const getMarkerIcon = (severity, status) => {
      const color = getMarkerColor(severity, status);
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
          ">
            ${status === 'repaired' ? '✓' : severity?.[0]?.toUpperCase() || '?'}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    };

    // Add markers for each report
    const bounds = [];
    reports.forEach((report) => {
      if (report.latitude && report.longitude) {
        const marker = L.marker([report.latitude, report.longitude], {
          icon: getMarkerIcon(report.severity, report.status),
        }).addTo(map);

        marker.bindPopup(`
          <div style="min-width: 200px;">
            <strong>${report.damage_type || 'Unknown'}</strong><br/>
            <span style="color: ${getMarkerColor(report.severity, report.status)}">
              ${report.severity || 'Pending'} severity
            </span><br/>
            <small>Status: ${report.status}</small><br/>
            ${report.estimated_cost ? `<small>Est. cost: $${report.estimated_cost.toFixed(2)}</small>` : ''}
          </div>
        `);

        marker.on('click', () => {
          if (onMarkerClick) onMarkerClick(report);
        });

        markersRef.current.push(marker);
        bounds.push([report.latitude, report.longitude]);
      }
    });

    // Fit map to show all markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [reports, mapLoaded, onMarkerClick]);

  // Highlight selected report
  useEffect(() => {
    if (!selectedReport || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    map.setView([selectedReport.latitude, selectedReport.longitude], 15);
  }, [selectedReport]);

  return (
    <div className="admin-map-container">
      <div ref={mapRef} className="admin-map" />
      
      {/* Legend */}
      <div className="map-legend">
        <h4>Legend</h4>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#ef4444' }}></span>
          High Severity
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#f59e0b' }}></span>
          Medium Severity
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#22c55e' }}></span>
          Low / Repaired
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#6b7280' }}></span>
          Pending
        </div>
      </div>
    </div>
  );
}
