import ThemeToggle from "../components/ThemeToggle";
import MapView from "../components/MapView";
import Link from "next/link";

export default function MapPage() {
  return (
    <>
      <header className="header">
        <div className="header-inner" style={{ paddingLeft: 40, paddingRight: 40 }}>
          <div>
            <h1>Yol Hasarı Haritası</h1>
            <p className="header-subtitle">
              Konya Büyükşehir Belediyesi · Dijital Hizmetler
            </p>
          </div>

          <div style={{ marginLeft: "auto" }}>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="header-actions">
        <Link href="/">
          <button className="header-action-btn">Şikayet Oluştur</button>
        </Link>

        <Link href="/map">
          <button className="header-action-btn">Haritadan Görüntüle</button>
        </Link>
      </div>

      <main className="container page-scene">
        <div className="page-scene-bg" aria-hidden="true">
          <div className="scene-road" />
          <div className="scene-pothole scene-pothole-primary" />
          <div className="scene-pothole scene-pothole-secondary" />
          <div className="scene-pothole scene-pothole-tertiary" />
          <div className="scene-car scene-car-primary" />
          <div className="scene-car scene-car-secondary" />
          <div className="scene-car scene-car-tertiary" />
        </div>
        <div className="page-scene-content">
          <MapView />
        </div>
      </main>
    </>
  );
}
