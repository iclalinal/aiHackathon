import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import ReportTable from '../../components/admin/ReportTable';
import ReportModal from '../../components/admin/ReportModal';
import GroupModal from '../../components/admin/GroupModal';
import api from '../../services/api';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grouped'
  const [groupRadius, setGroupRadius] = useState(2); // meters
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    damageType: '',
  });

  useEffect(() => {
    if (viewMode === 'list') {
      loadReports();
    } else {
      loadGroupedReports();
    }
  }, [filters, viewMode, groupRadius]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const activeFilters = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) activeFilters[key] = value;
      });
      
      const response = await api.getAdminReports(activeFilters);
      setReports(response.data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupedReports = async () => {
    try {
      setLoading(true);
      const activeFilters = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) activeFilters[key] = value;
      });
      
      const response = await api.getGroupedReports(activeFilters, groupRadius);
      setGroups(response.data);
    } catch (error) {
      console.error('Failed to load grouped reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reportId, status, notes = null) => {
    try {
      await api.updateReportStatus(reportId, status, notes);
      // Reload based on view mode
      if (viewMode === 'list') {
        loadReports();
      } else {
        loadGroupedReports();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      throw error;
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', severity: '', damageType: '' });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

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

  const totalReportsInGroups = groups.reduce((sum, g) => sum + g.reportCount, 0);
  const multiReportGroups = groups.filter(g => g.reportCount > 1);

  return (
    <>
      <Head>
        <title>Raporlar - Yol Hasarı Yönetici</title>
      </Head>

      <AdminLayout title="Hasar Raporları">
        {/* View Mode Toggle */}
        <div className="view-toggle-bar" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          padding: '12px 16px',
          background: 'var(--card-bg)',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
        }}>
          <span style={{ fontWeight: 500 }}>Görünüm:</span>
          <button
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('list')}
            style={{ padding: '6px 16px' }}
          >
            📋 Liste
          </button>
          <button
            className={`btn ${viewMode === 'grouped' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('grouped')}
            style={{ padding: '6px 16px' }}
          >
            📁 Gruplu
          </button>
          
          {viewMode === 'grouped' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }}>
              <label style={{ fontSize: 14 }}>Gruplama Yarıçapı:</label>
              <select
                value={groupRadius}
                onChange={(e) => setGroupRadius(Number(e.target.value))}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg)',
                  color: 'var(--text-color)',
                }}
              >
                <option value={1}>1 metre</option>
                <option value={2}>2 metre</option>
                <option value={5}>5 metre</option>
                <option value={10}>10 metre</option>
                <option value={25}>25 metre</option>
                <option value={50}>50 metre</option>
              </select>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="filter-group">
            <label>Durum</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Tüm Durumlar</option>
              <option value="pending">Bekliyor</option>
              <option value="analyzing">Analiz Ediliyor</option>
              <option value="analyzed">Analiz Edildi</option>
              <option value="repaired">Onarıldı</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Şiddet</label>
            <select
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
            >
              <option value="">Tüm Şiddetler</option>
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Hasar Türü</label>
            <select
              value={filters.damageType}
              onChange={(e) => handleFilterChange('damageType', e.target.value)}
            >
              <option value="">Tüm Türler</option>
              <option value="pothole">Çukur</option>
              <option value="crack">Çatlak</option>
              <option value="rutting">Tekerlek İzi</option>
              <option value="patching">Yama</option>
              <option value="erosion">Erozyon</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button className="btn btn-secondary" onClick={clearFilters}>
              Filtreleri Temizle
            </button>
          )}

          <div className="filter-spacer" />

          <button className="btn btn-primary" onClick={viewMode === 'list' ? loadReports : loadGroupedReports}>
            🔄 Yenile
          </button>
        </div>

        {/* Results count */}
        <div className="results-info">
          {viewMode === 'list' ? (
            <>{reports.length} rapor gösteriliyor</>
          ) : (
            <>
              {groups.length} konum grubu ({totalReportsInGroups} rapor)
              {multiReportGroups.length > 0 && (
                <span style={{ marginLeft: 8, color: '#f2c200' }}>
                  • {multiReportGroups.length} çoklu şikayet grubu
                </span>
              )}
            </>
          )}
        </div>

        {/* Content based on view mode */}
        {loading ? (
          <div className="loading-state">Raporlar yükleniyor...</div>
        ) : viewMode === 'list' ? (
          <ReportTable
            reports={reports}
            onStatusChange={handleStatusChange}
            onViewDetails={setSelectedReport}
          />
        ) : (
          /* Grouped View */
          <div className="groups-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}>
            {groups.map((group, index) => (
              <div
                key={index}
                className="group-card"
                onClick={() => setSelectedGroup(group)}
                style={{
                  padding: 16,
                  background: 'var(--card-bg)',
                  borderRadius: 8,
                  border: `2px solid ${group.reportCount > 1 ? '#f2c200' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>{group.reportCount > 1 ? '📁' : '📄'}</span>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>
                      {group.reportCount} Şikayet
                    </span>
                  </div>
                  {group.reportCount > 1 && (
                    <span style={{
                      background: '#f2c200',
                      color: '#1a1a1a',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      GRUP
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                  {group.severities?.map(sev => (
                    <span key={sev} style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      background: getSeverityColor(sev),
                      color: 'white',
                      textTransform: 'uppercase',
                    }}>
                      {sev}
                    </span>
                  ))}
                </div>

                <div style={{ fontSize: 13, color: 'var(--muted-text)', marginBottom: 8 }}>
                  📍 {group.centerLat?.toFixed(5)}, {group.centerLng?.toFixed(5)}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#f2c200' }}>
                    {formatCurrency(group.totalEstimatedCost)}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--muted-text)' }}>
                    Detaylar için tıklayın →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report Detail Modal */}
        {selectedReport && (
          <ReportModal
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
            onStatusChange={handleStatusChange}
          />
        )}

        {/* Group Detail Modal */}
        {selectedGroup && (
          <GroupModal
            group={selectedGroup}
            onClose={() => setSelectedGroup(null)}
            onStatusChange={handleStatusChange}
            onViewReport={(report) => {
              setSelectedGroup(null);
              setSelectedReport(report);
            }}
          />
        )}
      </AdminLayout>
    </>
  );
}
