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
      () => alert("Konum alınamadı")
    );
  }, []);

  const handleSubmit = () => {
    if (!image) {
      alert("Fotoğraf zorunlu");
      return;
    }
    if (!location) {
      alert("Konum zorunlu");
      return;
    }

    setResult({
      type: "Çukur",
      severity: "high",
      estimated_cost: 380,
    });
  };

  return (
    <div className="card">
      <div className="upload-box">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />
        <p>{image ? image.name : "Fotoğraf seçiniz"}</p>
      </div>

      {location && (
        <p style={{ marginTop: 10 }}>
          📍 Konum: {location.lat.toFixed(3)}, {location.lng.toFixed(3)}
        </p>
      )}

      <button onClick={handleSubmit}>Şikayet Gönder</button>

      {result && (
        <div className="card">
          <h3>Analiz Sonucu</h3>

          <span className={`badge ${result.severity}`}>
            {result.severity.toUpperCase()}
          </span>

          <p style={{ marginTop: 10 }}>🕳️ Hasar Türü: {result.type}</p>
          <p>💰 Tahmini Maliyet: {result.estimated_cost} TL</p>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
