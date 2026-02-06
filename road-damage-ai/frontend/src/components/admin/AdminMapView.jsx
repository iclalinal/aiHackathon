import { useEffect, useRef, useState } from 'react';

export default function AdminMapView({ reports, onMarkerClick, selectedReport, viewMode }) {
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

    const getDamageTypeText = (type) => {
      const types = {
        pothole: 'Çukur',
        crack: 'Çatlak',
        rutting: 'Tekerlek İzi',
        patching: 'Yama',
        erosion: 'Aşınma',
      };
      return types[type] || type || 'Bilinmiyor';
    };

    const getSeverityText = (severity) => {
      const texts = { low: 'Düşük', medium: 'Orta', high: 'Yüksek' };
      return texts[severity] || severity || 'Belirsiz';
    };

    const getStatusText = (status) => {
      const texts = {
        pending: 'Bekliyor',
        analyzing: 'Analiz Ediliyor',
        analyzed: 'Analiz Edildi',
        repaired: 'Onarıldı',
        rejected: 'Reddedildi',
      };
      return texts[status] || status;
    };

    const getMarkerIcon = (severity, status, isGroup = false, reportCount = 1) => {
      const color = getMarkerColor(severity, status);
      
      if (isGroup) {
        // Group marker - larger with folder icon and count
        return L.divIcon({
          className: 'custom-marker group-marker',
          html: `
            <div style="
              background-color: ${reportCount > 1 ? '#f2c200' : color};
              width: ${reportCount > 1 ? '36px' : '28px'};
              height: ${reportCount > 1 ? '36px' : '28px'};
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              color: ${reportCount > 1 ? '#1a1a1a' : 'white'};
              font-size: ${reportCount > 1 ? '14px' : '12px'};
              font-weight: bold;
            ">
              ${reportCount > 1 ? reportCount : (severity?.[0]?.toUpperCase() || '?')}
            </div>
          `,
          iconSize: [reportCount > 1 ? 36 : 28, reportCount > 1 ? 36 : 28],
          iconAnchor: [reportCount > 1 ? 18 : 14, reportCount > 1 ? 18 : 14],
        });
      }
      
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

    // Add markers for each report or group
    const bounds = [];
    reports.forEach((item) => {
      const lat = item.latitude || item.centerLat;
      const lng = item.longitude || item.centerLng;
      
      if (lat && lng) {
        const isGroup = item.isGroup;
        const marker = L.marker([lat, lng], {
          icon: getMarkerIcon(item.severity, item.status, isGroup, item.reportCount),
        }).addTo(map);

        if (isGroup) {
          // Group popup
          marker.bindPopup(`
            <div style="min-width: 200px;">
              <strong>📁 ${item.reportCount} Şikayet</strong><br/>
              <span style="color: ${getMarkerColor(item.severity, null)}">
                ${item.group?.severities?.map(s => getSeverityText(s)).join(', ') || 'Belirsiz'} şiddet
              </span><br/>
              <small>Detaylar için tıklayın</small>
            </div>
          `);
        } else {
          // Regular report popup
          marker.bindPopup(`
            <div style="min-width: 200px;">
              <strong>${getDamageTypeText(item.damage_type)}</strong><br/>
              <span style="color: ${getMarkerColor(item.severity, item.status)}">
                ${getSeverityText(item.severity)} şiddet
              </span><br/>
              <small>Durum: ${getStatusText(item.status)}</small><br/>
              ${item.estimated_cost ? `<small>Tahmini maliyet: ₺${item.estimated_cost.toFixed(2)}</small>` : ''}
            </div>
          `);
        }

        marker.on('click', () => {
          if (onMarkerClick) onMarkerClick(item);
        });

        markersRef.current.push(marker);
        bounds.push([lat, lng]);
      }
    });

    // Fit map to show all markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [reports, mapLoaded, onMarkerClick, viewMode]);

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
        <h4>Gösterge</h4>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#ef4444' }}></span>
          Yüksek Şiddet
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#f59e0b' }}></span>
          Orta Şiddet
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#22c55e' }}></span>
          Düşük / Onarıldı
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#6b7280' }}></span>
          Bekliyor
        </div>
        {viewMode === 'grouped' && (
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#f2c200' }}></span>
            Çoklu Şikayet Grubu
          </div>
        )}
      </div>
    </div>
  );
}
