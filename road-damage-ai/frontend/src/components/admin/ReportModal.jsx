import { useState } from 'react';

export default function ReportModal({ report, onClose, onStatusChange }) {
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  if (!report) return null;

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await onStatusChange(report.id, newStatus, notes);
      onClose();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getSeverityColor = (severity) => {
    const colors = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };
    return colors[severity] || '#6b7280';
  };

  const imageUrl = report.image_path
    ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}/${report.image_path}`
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>Report Details</h2>
        
        <div className="modal-body">
          {/* Image */}
          <div className="report-image-container">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Damage Report"
                className="report-image"
                onError={(e) => {
                  e.target.src = '/placeholder-image.png';
                  e.target.onerror = null;
                }}
              />
            ) : (
              <div className="no-image">No image available</div>
            )}
          </div>

          {/* Details Grid */}
          <div className="details-grid">
            <div className="detail-item">
              <label>Report ID</label>
              <span className="mono">{report.id}</span>
            </div>

            <div className="detail-item">
              <label>Status</label>
              <span className={`status-badge status-${report.status}`}>
                {report.status}
              </span>
            </div>

            <div className="detail-item">
              <label>Damage Type</label>
              <span>{report.damage_type || 'Pending analysis'}</span>
            </div>

            <div className="detail-item">
              <label>Severity</label>
              {report.severity ? (
                <span
                  className="severity-badge"
                  style={{ backgroundColor: getSeverityColor(report.severity) }}
                >
                  {report.severity.toUpperCase()}
                </span>
              ) : (
                <span>-</span>
              )}
            </div>

            <div className="detail-item">
              <label>Estimated Cost</label>
              <span className="cost">{formatCurrency(report.estimated_cost)}</span>
            </div>

            <div className="detail-item">
              <label>Location</label>
              <a
                href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="location-link"
              >
                📍 {report.latitude?.toFixed(6)}, {report.longitude?.toFixed(6)}
              </a>
            </div>

            <div className="detail-item full-width">
              <label>Description</label>
              <span>{report.description || 'No description provided'}</span>
            </div>

            <div className="detail-item">
              <label>Submitted</label>
              <span>{formatDate(report.created_at)}</span>
            </div>

            <div className="detail-item">
              <label>Analyzed</label>
              <span>{formatDate(report.analyzed_at)}</span>
            </div>

            {report.repaired_at && (
              <>
                <div className="detail-item">
                  <label>Repaired</label>
                  <span>{formatDate(report.repaired_at)}</span>
                </div>
                <div className="detail-item full-width">
                  <label>Repair Notes</label>
                  <span>{report.repair_notes || '-'}</span>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          {report.status !== 'repaired' && (
            <div className="modal-actions">
              <div className="notes-input">
                <label>Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this action..."
                  rows={2}
                />
              </div>

              <div className="action-buttons">
                {report.status === 'analyzed' && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleStatusChange('repaired')}
                    disabled={updating}
                  >
                    {updating ? 'Updating...' : '✓ Mark as Repaired'}
                  </button>
                )}

                {report.status === 'pending' && (
                  <button
                    className="btn btn-danger"
                    onClick={() => handleStatusChange('rejected')}
                    disabled={updating}
                  >
                    {updating ? 'Updating...' : '✗ Reject Report'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
