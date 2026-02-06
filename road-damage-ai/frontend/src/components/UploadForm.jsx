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
  const [noDamageDetected, setNoDamageDetected] = useState(false);
  const [pollCount, setPollCount] = useState(0);

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
        setPollCount(prev => prev + 1);
        const response = await api.getReportStatus(reportId);
        
        // Check if report was deleted (no damage detected)
        if (response.notFound) {
          setNoDamageDetected(true);
          setPolling(false);
          setLoading(false);
          setPollCount(0);
          return;
        }
        
        if (response.status === 'analyzed') {
          setResult({
            type: response.damage_type || 'Bilinmiyor',
            severity: response.severity || 'medium',
            estimated_cost: response.estimated_cost || 0,
          });
          setPolling(false);
          setLoading(false);
          setPollCount(0);
        } else if (response.status === 'rejected') {
          setPolling(false);
          setLoading(false);
          setPollCount(0);
          alert('Rapor reddedildi.');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);

    // Timeout after 30 seconds (15 polls)
    if (pollCount > 15) {
      setPolling(false);
      setLoading(false);
      setPollCount(0);
      alert('Analiz zaman aşımına uğradı. Lütfen tekrar deneyin.');
    }

    return () => clearInterval(interval);
  }, [reportId, polling, pollCount]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setResult(null);
      setReportId(null);
      setNoDamageDetected(false);
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

  const handleClear = () => {
    setImage(null);
    setImagePreview(null);
    setResult(null);
    setReportId(null);
    setNoDamageDetected(false);
    setLoading(false);
    setPolling(false);
    setPollCount(0);
  };

  // Şikayet gönderildi mi kontrolü
  const isSubmitted = result !== null || noDamageDetected;

  return (
    <>
      {/* ANA FORM KARTI */}
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>
          1. Yol Hasarı Fotoğrafı
        </h3>

        <div
          className="upload-box"
          onClick={() => !isSubmitted && document.getElementById("fileInput").click()}
          style={isSubmitted ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
        >
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageChange}
            disabled={isSubmitted}
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
          <button 
            onClick={handleSubmit} 
            disabled={loading || isSubmitted}
            style={isSubmitted ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {loading ? (polling ? 'Analiz ediliyor...' : 'Gönderiliyor...') : (
              isSubmitted ? 'Şikayet Gönderildi' : 'Şikayet Gönder'
            )}
          </button>
          
          {isSubmitted && (
            <button 
              onClick={handleClear}
              style={{ 
                marginLeft: 12,
                background: 'var(--muted-text, #6b7280)',
              }}
            >
              Yeni Şikayet
            </button>
          )}
        </div>
      </div>

      {/* HASAR TESPİT EDİLEMEDİ */}
      {noDamageDetected && (
        <div className="card" style={{ marginTop: 32, borderColor: '#3498db' }}>
          <h3 style={{ marginBottom: 12, color: '#3498db' }}>
            ℹ️ Analiz Sonucu
          </h3>
          <p style={{ fontSize: 16 }}>
            Yüklenen fotoğrafta <strong>yol hasarı tespit edilemedi</strong>.
          </p>
          <p style={{ opacity: 0.7, marginTop: 8 }}>
            Lütfen hasarın net göründüğü başka bir fotoğraf yükleyerek tekrar deneyin.
          </p>
        </div>
      )}

      {/* ANALİZ SONUCU */}
      {result && !noDamageDetected && (
        <div className="card" style={{ marginTop: 32, borderColor: '#27ae60' }}>
          <h3 style={{ marginBottom: 12, color: '#27ae60' }}>
            ✓ Şikayetiniz Alındı
          </h3>

          <p style={{ fontSize: 16, marginBottom: 12 }}>
            Fotoğrafınız başarıyla analiz edildi ve <strong>gerekli mercilere şikayetiniz iletilmiştir</strong>.
          </p>

          <p style={{ opacity: 0.7 }}>
            İlgili birimler tarafından değerlendirilerek en kısa sürede işleme alınacaktır.
          </p>
        </div>
      )}
    </>
  );
};

export default UploadForm;
