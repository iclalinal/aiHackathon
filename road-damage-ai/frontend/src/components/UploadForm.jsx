import { useEffect, useState } from "react";

const UploadForm = () => {
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => alert("Konum bilgisi alınamadı")
    );
  }, []);

  const handleSubmit = () => {
    if (!image) {
      alert("Fotoğraf yüklenmesi zorunludur.");
      return;
    }
    if (!location) {
      alert("Konum bilgisi alınamadı.");
      return;
    }

    // Hackathon için mock AI sonucu
    setResult({
      type: "Çukur",
      severity: "high",
      estimated_cost: 380,
    });
  };

  return (
    <>
      {/* ANA FORM KARTI */}
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>
          1. Yol Hasarı Fotoğrafı
        </h3>

        <div
          className="upload-box"
          onClick={() => document.getElementById("fileInput").click()}
        >
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setImage(e.target.files[0])}
          />

          <p style={{ fontSize: 16 }}>
            {image
              ? `Seçilen dosya: ${image.name}`
              : "Fotoğraf yüklemek için tıklayın"}
          </p>

          <p style={{ opacity: 0.6, marginTop: 6 }}>
  JPG / PNG formatları desteklenmektedir <strong>(zorunlu)</strong>
</p>

<div
  style={{
    marginTop: 6,
    padding: "6px 10px",
    backgroundColor: "rgba(231, 76, 60, 0.08)",
    borderLeft: "3px solid #e74c3c",
    borderRadius: 4,
    fontSize: 13,
    color: "#e74c3c",
    fontWeight: 500,
  }}
>
  ⚠️ Doğru analiz için lütfen fotoğrafı ayakta durarak ve telefonu
  göğüs hizasında tutarak çekiniz.
</div>
        </div>

        <hr
          style={{
            margin: "28px 0",
            borderColor: "var(--border-color)",
          }}
        />

        <h3 style={{ marginBottom: 12 }}>
          2. Konum Bilgisi
        </h3>

        {location ? (
          <p style={{ opacity: 0.8 }}>
            Konum otomatik olarak tespit edildi:{" "}
            {location.lat.toFixed(3)}, {location.lng.toFixed(3)}
          </p>
        ) : (
          <p style={{ opacity: 0.6 }}>
            Konum bilgisi alınıyor…
          </p>
        )}

        <div className="button-center">
          <button onClick={handleSubmit}>
            Şikayet Gönder
          </button>
        </div>
      </div>

      {/* ANALİZ SONUCU */}
      {result && (
        <div className="card" style={{ marginTop: 32 }}>
          <h3 style={{ marginBottom: 12 }}>
            Analiz Sonucu (Yapay Zekâ)
          </h3>

          <p>
            <b>Hasar Türü:</b> {result.type}
          </p>

          <p>
            <b>Önem Seviyesi:</b>{" "}
            <span className={`badge ${result.severity}`}>
              Yüksek
            </span>
          </p>

          <p>
            <b>Tahmini Müdahale Maliyeti:</b>{" "}
            {result.estimated_cost} TL
          </p>
        </div>
      )}
    </>
  );
};

export default UploadForm;
