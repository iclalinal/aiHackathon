import { useState } from 'react';

export default function ReportTable({ reports, onStatusChange, onViewDetails }) {
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedReports = [...reports].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'created_at' || sortField === 'analyzed_at') {
      aVal = new Date(aVal || 0);
      bVal = new Date(bVal || 0);
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getSeverityBadge = (severity) => {
    const colors = {
      low: 'badge-green',
      medium: 'badge-yellow',
      high: 'badge-red',
    };
    return colors[severity] || 'badge-gray';
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'badge-gray',
      analyzing: 'badge-blue',
      analyzed: 'badge-purple',
      repaired: 'badge-green',
      rejected: 'badge-red',
    };
    return colors[status] || 'badge-gray';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      month: 'short',
      day: 'numeric',
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

  return (
    <div className="table-container">
      <table className="report-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('id')} className="sortable">
              ID {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('created_at')} className="sortable">
              Tarih {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th>Konum</th>
            <th onClick={() => handleSort('damage_type')} className="sortable">
              Tür {sortField === 'damage_type' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('severity')} className="sortable">
              Şiddet {sortField === 'severity' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('estimated_cost')} className="sortable">
              Tah. Maliyet {sortField === 'estimated_cost' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('status')} className="sortable">
              Durum {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {sortedReports.length === 0 ? (
            <tr>
              <td colSpan="8" className="empty-state">
                Rapor bulunamadı
              </td>
            </tr>
          ) : (
            sortedReports.map((report) => (
              <tr key={report.id}>
                <td className="id-cell" title={report.id}>
                  {report.id.substring(0, 8)}...
                </td>
                <td>{formatDate(report.created_at)}</td>
                <td className="location-cell">
                  <a
                    href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on Google Maps"
                  >
                    📍 {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
                  </a>
                </td>
                <td>
                  <span className="damage-type">
                    {report.damage_type || '-'}
                  </span>
                </td>
                <td>
                  {report.severity ? (
                    <span className={`badge ${getSeverityBadge(report.severity)}`}>
                      {report.severity}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td>{formatCurrency(report.estimated_cost)}</td>
                <td>
                  <span className={`badge ${getStatusBadge(report.status)}`}>
                    {report.status}
                  </span>
                </td>
                <td className="actions-cell">
                  <button
                    className="btn-icon"
                    onClick={() => onViewDetails(report)}
                    title="Detayları Gör"
                  >
                    👁️
                  </button>
                  {report.status === 'analyzed' && (
                    <button
                      className="btn-icon btn-success"
                      onClick={() => onStatusChange(report.id, 'repaired')}
                      title="Onarıldı Olarak İşaretle"
                    >
                      ✓
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
