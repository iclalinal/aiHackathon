"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import api from "../services/api";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

export default function MapView() {
  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dynamically import Leaflet on client-side only
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        import('leaflet/dist/leaflet.css');
        
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
      });
    }

    // Fetch reports from API
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await api.getMapMarkers();
      if (response.data) {
        setDamages(response.data);
      }
    } catch (error) {
      console.error('Failed to load map data:', error);
      // Fallback to empty array if API fails
      setDamages([]);
    } finally {
      setLoading(false);
    }
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
    return texts[severity] || severity || 'Belirlenmedi';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Bekliyor',
      analyzing: 'Analiz Ediliyor',
      analyzed: 'Analiz Edildi',
      repaired: 'Onarıldı',
    };
    return texts[status] || status;
  };

  // Default center: Konya
  const defaultCenter = [37.8713, 32.4846];

  return (
    <div style={{ height: 500, width: "100%" }}>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          Harita yükleniyor...
        </div>
      ) : (
        <MapContainer
          center={damages.length > 0 ? [damages[0].latitude, damages[0].longitude] : defaultCenter}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {damages.map((d) => (
            <Marker key={d.id} position={[d.latitude, d.longitude]}>
              <Popup>
                <strong>Hasar Türü:</strong> {getDamageTypeText(d.damage_type)}
                <br />
                <strong>Önem:</strong> {getSeverityText(d.severity)}
                <br />
                <strong>Durum:</strong> {getStatusText(d.status)}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
      
      {!loading && damages.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: 16, opacity: 0.7 }}>
          Henüz kayıtlı hasar raporu bulunmamaktadır.
        </p>
      )}
    </div>
  );
}
