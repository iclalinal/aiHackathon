import UploadForm from "../components/UploadForm";
import ThemeToggle from "../components/ThemeToggle";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <header className="header">
        <div className="header-inner" style={{ paddingLeft: 40, paddingRight: 40 }}>
          <div>
            <h1>Yol Hasarı Şikayet Sistemi</h1>
            <p className="header-subtitle">
              Konya Büyükşehir Belediyesi · Dijital Hizmetler
            </p>
          </div>

          <div style={{ marginLeft: "auto" }}>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* HEADER ALT NAV */}
      <div className="header-actions">
        <Link href="/">
          <button className="header-action-btn">Şikayet Oluştur</button>
        </Link>

        <Link href="/map">
          <button className="header-action-btn">Haritadan Görüntüle</button>
        </Link>
      </div>

      <main className="container">
        <UploadForm />
      </main>
    </>
  );
}
