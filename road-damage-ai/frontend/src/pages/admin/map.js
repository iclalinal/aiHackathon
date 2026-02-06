import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminMapView from '../../components/admin/AdminMapView';
import ReportModal from '../../components/admin/ReportModal';
import GroupModal from '../../components/admin/GroupModal';
import api from '../../services/api';

export default function AdminMap() {
  const [reports, setReports] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grouped'
  const [groupRadius, setGroupRadius] = useState(2);

  useEffect(() => {
    loadReports();
    if (viewMode === 'grouped') {
      loadGroupedReports();
    }
  }, [viewMode, groupRadius]);

  const loadReports = async () => {
    try {
      const response = await api.getAdminReports();
      setReports(response.data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupedReports = async () => {
    try {
      const response = await api.getGroupedReports({}, groupRadius);
      setGroups(response.data);
    } catch (error) {
      console.error('Failed to load grouped reports:', error);
    }
  };

  const handleStatusChange = async (reportId, status, notes = null) => {
    try {
      await api.updateReportStatus(reportId, status, notes);
      loadReports();
      if (viewMode === 'grouped') {
        loadGroupedReports();
      }
      setSelectedReport(null);
    } catch (error) {
      console.error('Failed to update status:', error);
      throw error;
    }
  };

  const filteredReports = reports.filter((report) => {
    if (filter === 'all') return true;
    if (filter === 'unrepaired') return report.status !== 'repaired';
    if (filter === 'high') return report.severity === 'high' && report.status !== 'repaired';
    return report.status === filter;
  });

  const filteredGroups = groups.filter((group) => {
    if (filter === 'all') return true;
    if (filter === 'unrepaired') return group.reports.some(r => r.status !== 'repaired');
    if (filter === 'high') return group.severities?.includes('high') && group.reports.some(r => r.status !== 'repaired');
    return group.reports.some(r => r.status === filter);
  });

  const stats = {
    total: reports.length,
    unrepaired: reports.filter((r) => r.status !== 'repaired').length,
    high: reports.filter((r) => r.severity === 'high' && r.status !== 'repaired').length,
  };

  const multiGroups = groups.filter(g => g.reportCount > 1);

  // Create markers for map - either individual reports or group centers
  const mapMarkers = viewMode === 'grouped' 
    ? filteredGroups.map((group, idx) => ({
        id: `group-${idx}`,
        latitude: group.centerLat,
        longitude: group.centerLng,
        isGroup: true,
        reportCount: group.reportCount,
        severity: group.severities?.includes('high') ? 'high' : group.severities?.includes('medium') ? 'medium' : 'low',
        group: group,
      }))
    : filteredReports;

  return (
    <>
      <Head>
        <title>Harita Görünümü - Yol Hasarı Yönetici</title>
      </Head>

      <AdminLayout title="Harita Görünümü">
        <div className="map-page-layout">
          {/* Sidebar */}
          <div className="map-sidebar">
            {/* View Mode Toggle */}
            <div className="view-mode-toggle" style={{
              display: 'flex',
              gap: 8,
              marginBottom: 16,
              padding: 12,
              background: 'var(--bg-color)',
              borderRadius: 8,
            }}>
              <button
                className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('list')}
                style={{ flex: 1, padding: '6px 12px', fontSize: 13 }}
              >
                📋 Liste
              </button>
              <button
                className={`btn ${viewMode === 'grouped' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('grouped')}
                style={{ flex: 1, padding: '6px 12px', fontSize: 13 }}
              >
                📁 Gruplu
              </button>
            </div>

            {viewMode === 'grouped' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--muted-text)', display: 'block', marginBottom: 4 }}>
                  Gruplama Yarıçapı
                </label>
                <select
                  value={groupRadius}
                  onChange={(e) => setGroupRadius(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
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
                {multiGroups.length > 0 && (
                  <div style={{
                    marginTop: 8,
                    padding: 8,
                    background: 'rgba(242, 194, 0, 0.1)',
                    borderRadius: 6,
                    fontSize: 12,
                    color: '#f2c200',
                  }}>
                    📁 {multiGroups.length} çoklu şikayet grubu bulundu
                  </div>
                )}
              </div>
            )}

            <div className="map-filters">
              <h3>Raporları Filtrele</h3>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  Tümü ({stats.total})
                </button>
                <button
                  className={`filter-btn ${filter === 'unrepaired' ? 'active' : ''}`}
                  onClick={() => setFilter('unrepaired')}
                >
                  Onarılmamış ({stats.unrepaired})
                </button>
                <button
                  className={`filter-btn filter-high ${filter === 'high' ? 'active' : ''}`}
                  onClick={() => setFilter('high')}
                >
                  🔴 Yüksek Öncelik ({stats.high})
                </button>
              </div>
            </div>

            <div className="map-report-list">
              <h3>
                {viewMode === 'grouped' 
                  ? `Gruplar (${filteredGroups.length})` 
                  : `Raporlar (${filteredReports.length})`
                }
              </h3>
              <div className="report-list-scroll">
                {viewMode === 'grouped' ? (
                  /* Grouped View */
                  filteredGroups.map((group, idx) => (
                    <div
                      key={idx}
                      className={`map-report-item ${group.reportCount > 1 ? 'is-group' : ''}`}
                      onClick={() => setSelectedGroup(group)}
                      style={{
                        borderLeft: group.reportCount > 1 ? '3px solid #f2c200' : undefined,
                      }}
                    >
                      <div className="report-item-header">
                        <span style={{ fontSize: 16, marginRight: 6 }}>
                          {group.reportCount > 1 ? '📁' : '📄'}
                        </span>
                        <span className="damage-type">
                          {group.reportCount} Şikayet
                        </span>
                        {group.reportCount > 1 && (
                          <span style={{
                            background: '#f2c200',
                            color: '#1a1a1a',
                            padding: '1px 6px',
                            borderRadius: 8,
                            fontSize: 10,
                            fontWeight: 600,
                            marginLeft: 'auto',
                          }}>
                            GRUP
                          </span>
                        )}
                      </div>
                      <div className="report-item-details">
                        <span className="location">
                          📍 {group.centerLat?.toFixed(4)}, {group.centerLng?.toFixed(4)}
                        </span>
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                          {group.severities?.map(sev => (
                            <span key={sev} className={`severity-dot severity-${sev}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  /* Normal List View */
                  filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className={`map-report-item ${
                        selectedReport?.id === report.id ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="report-item-header">
                        <span className={`severity-dot severity-${report.severity || 'pending'}`} />
                        <span className="damage-type">
                          {report.damage_type || 'Bekliyor'}
                        </span>
                        <span className={`status-tag status-${report.status}`}>
                          {report.status}
                        </span>
                      </div>
                      <div className="report-item-details">
                        <span className="location">
                          📍 {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
                        </span>
                        <span className="date">
                          {new Date(report.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                {((viewMode === 'grouped' && filteredGroups.length === 0) || 
                  (viewMode === 'list' && filteredReports.length === 0)) && (
                  <p className="empty-message">Filtreyle eşleşen rapor yok</p>
                )}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="map-container">
            {loading ? (
              <div className="loading-state">Harita verileri yükleniyor...</div>
            ) : (
              <AdminMapView
                reports={viewMode === 'grouped' ? mapMarkers : filteredReports}
                onMarkerClick={(item) => {
                  if (item.isGroup) {
                    setSelectedGroup(item.group);
                  } else {
                    setSelectedReport(item);
                  }
                }}
                selectedReport={selectedReport}
                viewMode={viewMode}
              />
            )}
          </div>
        </div>

        {/* Report Modal */}
        {selectedReport && (
          <ReportModal
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
            onStatusChange={handleStatusChange}
          />
        )}

        {/* Group Modal */}
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
