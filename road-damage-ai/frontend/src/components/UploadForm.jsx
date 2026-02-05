import { useEffect, useState } from "react";
import api from "../services/api";

const UploadForm = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [polling, setPolling] = useState(false);

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

  // Poll for analysis result
  useEffect(() => {
    if (!reportId || !polling) return;

    const interval = setInterval(async () => {
      try {
        const response = await api.getReportStatus(reportId);
        if (response.status === 'analyzed') {
          setResult({
            type: response.damage_type || 'Bilinmiyor',
            severity: response.severity || 'medium',
            estimated_cost: response.estimated_cost || 0,
          });
          setPolling(false);
          setLoading(false);
        } else if (response.status === 'rejected') {
          setPolling(false);
          setLoading(false);
          alert('Rapor reddedildi.');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [reportId, polling]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setResult(null);
      setReportId(null);
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      alert("Fotoğraf yüklenmesi zorunludur.");
      return;
    }
    if (!location) {
      alert("Konum bilgisi alınamadı.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('latitude', location.lat);
      formData.append('longitude', location.lng);

      const response = await api.submitReport(formData);
      
      if (response.success && response.data.id) {
        setReportId(response.data.id);
        setPolling(true);
      } else {
        throw new Error('Rapor gönderilemedi');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Şikayet gönderilirken bir hata oluştu: ' + error.message);
      setLoading(false);
    }
  };

  const getSeverityText = (severity) => {
    const texts = { low: 'Düşük', medium: 'Orta', high: 'Yüksek' };
    return texts[severity] || severity;
  };

  const getDamageTypeText = (type) => {
    const types = {
      pothole: 'Çukur',
      crack: 'Çatlak',
      rutting: 'Tekerlek İzi',
      patching: 'Yama',
      erosion: 'Aşınma',
    };
    return types[type] || type;
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
            onChange={handleImageChange}
          />

          {imagePreview ? (
            <img 
              src={imagePreview} 
              alt="Preview" 
              style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
            />
          ) : (
            <p style={{ fontSize: 16 }}>
              Fotoğraf yüklemek için tıklayın
            </p>
          )}

          {image && (
            <p style={{ fontSize: 14, marginTop: 8 }}>
              Seçilen dosya: {image.name}
            </p>
          )}

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
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? (polling ? 'Analiz ediliyor...' : 'Gönderiliyor...') : 'Şikayet Gönder'}
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
            <b>Hasar Türü:</b> {getDamageTypeText(result.type)}
          </p>

          <p>
            <b>Önem Seviyesi:</b>{" "}
            <span className={`badge ${result.severity}`}>
              {getSeverityText(result.severity)}
            </span>
          </p>

          <p>
            <b>Tahmini Müdahale Maliyeti:</b>{" "}
            {result.estimated_cost} TL
          </p>

          {reportId && (
            <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
              Rapor ID: {reportId}
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default UploadForm;
