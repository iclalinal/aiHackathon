"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const mockDamages = [
  {
    id: 1,
    lat: 37.8713,
    lng: 32.4846,
    type: "Çukur",
    severity: "Yüksek",
  },
  {
    id: 2,
    lat: 37.8689,
    lng: 32.4921,
    type: "Asfalt Çökmesi",
    severity: "Orta",
  },
];

export default function MapView() {
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  return (
    <div style={{ height: 500, width: "100%" }}>
      <MapContainer
        center={[37.8713, 32.4846]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {mockDamages.map((d) => (
          <Marker key={d.id} position={[d.lat, d.lng]}>
            <Popup>
              <strong>Hasar Türü:</strong> {d.type}
              <br />
              <strong>Önem:</strong> {d.severity}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
