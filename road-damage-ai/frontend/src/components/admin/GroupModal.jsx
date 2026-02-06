import { useState } from 'react';

export default function GroupModal({ group, onClose, onStatusChange, onViewReport }) {
  const [updating, setUpdating] = useState(false);

  if (!group) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const getSeverityColor = (severity) => {
    const colors = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };
    return colors[severity] || '#6b7280';
  };

  const getDamageTypeText = (type) => {
    const types = {
      pothole: 'Çukur',
      crack: 'Çatlak',
      rutting: 'Tekerlek İzi',
      patching: 'Yama',
      erosion: 'Aşınma',
    };
    return types[type] || type || '-';
  };

  const handleMarkAllRepaired = async () => {
    if (!confirm('Bu gruptaki tüm raporları onarıldı olarak işaretlemek istediğinize emin misiniz?')) {
      return;
    }

    setUpdating(true);
    try {
      for (const report of group.reports) {
        if (report.status === 'analyzed') {
          await onStatusChange(report.id, 'repaired', 'Grup halinde onarıldı');
        }
      }
      onClose();
    } catch (error) {
      console.error('Failed to update reports:', error);
      alert('Raporlar güncellenirken hata oluştu');
    } finally {
      setUpdating(false);
    }
  };

  const analyzedCount = group.reports.filter(r => r.status === 'analyzed').length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800 }}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>📁 Konum Grubu ({group.reportCount} Şikayet)</h2>
        
        <div className="modal-body">
          {/* Group Summary */}
          <div className="group-summary" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 16,
            padding: 16,
            background: 'var(--bg-color, #f9fafb)',
            borderRadius: 8,
            marginBottom: 20,
          }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted-text)', display: 'block' }}>Konum</label>
              <a
                href={`https://www.google.com/maps?q=${group.centerLat},${group.centerLng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#f2c200', textDecoration: 'none' }}
              >
                📍 {group.centerLat?.toFixed(5)}, {group.centerLng?.toFixed(5)}
              </a>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted-text)', display: 'block' }}>Şiddet Seviyeleri</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                {group.severities?.map(sev => (
                  <span key={sev} style={{
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    background: getSeverityColor(sev),
                    color: 'white',
                    textTransform: 'uppercase',
                  }}>
                    {sev === 'low' ? 'Düşük' : sev === 'medium' ? 'Orta' : sev === 'high' ? 'Yüksek' : sev}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted-text)', display: 'block' }}>Toplam Maliyet</label>
              <span style={{ fontWeight: 600, color: '#f2c200' }}>{formatCurrency(group.totalEstimatedCost)}</span>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted-text)', display: 'block' }}>Tarih Aralığı</label>
              <span style={{ fontSize: 13 }}>
                {formatDate(group.earliestReport).split(',')[0]} - {formatDate(group.latestReport).split(',')[0]}
              </span>
            </div>
          </div>

          {/* Reports List */}
          <h3 style={{ marginBottom: 12, fontSize: 16 }}>Gruptaki Şikayetler</h3>
          <div style={{ maxHeight: 350, overflowY: 'auto' }}>
            <table className="report-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Hasar Türü</th>
                  <th>Şiddet</th>
                  <th>Maliyet</th>
                  <th>Durum</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {group.reports.map((report) => (
                  <tr key={report.id}>
                    <td style={{ fontSize: 13 }}>{formatDate(report.created_at)}</td>
                    <td>{getDamageTypeText(report.damage_type)}</td>
                    <td>
                      {report.severity && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          background: getSeverityColor(report.severity),
                          color: 'white',
                          textTransform: 'uppercase',
                        }}>
                          {report.severity === 'low' ? 'Düşük' : report.severity === 'medium' ? 'Orta' : report.severity === 'high' ? 'Yüksek' : report.severity}
                        </span>
                      )}
                    </td>
                    <td>{formatCurrency(report.estimated_cost)}</td>
                    <td>
                      <span className={`badge badge-${report.status === 'repaired' ? 'green' : report.status === 'analyzed' ? 'purple' : 'gray'}`}>
                        {report.status === 'pending' ? 'Bekliyor' : report.status === 'analyzing' ? 'Analiz Ediliyor' : report.status === 'analyzed' ? 'Analiz Edildi' : report.status === 'repaired' ? 'Onarıldı' : report.status === 'rejected' ? 'Reddedildi' : report.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-icon"
                        onClick={() => onViewReport(report)}
                        title="Detayları Gör"
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          {analyzedCount > 0 && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
              <button
                className="btn btn-success"
                onClick={handleMarkAllRepaired}
                disabled={updating}
                style={{ width: '100%' }}
              >
                {updating ? 'Güncelleniyor...' : `✓ Tümünü Onarıldı Olarak İşaretle (${analyzedCount} rapor)`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
