import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminMapView from '../../components/admin/AdminMapView';
import ReportModal from '../../components/admin/ReportModal';
import api from '../../services/api';

export default function AdminMap() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadReports();
  }, []);

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

  const handleStatusChange = async (reportId, status, notes = null) => {
    try {
      await api.updateReportStatus(reportId, status, notes);
      loadReports();
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

  const stats = {
    total: reports.length,
    unrepaired: reports.filter((r) => r.status !== 'repaired').length,
    high: reports.filter((r) => r.severity === 'high' && r.status !== 'repaired').length,
  };

  return (
    <>
      <Head>
        <title>Map View - Road Damage Admin</title>
      </Head>

      <AdminLayout title="Map View">
        <div className="map-page-layout">
          {/* Sidebar */}
          <div className="map-sidebar">
            <div className="map-filters">
              <h3>Filter Reports</h3>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All ({stats.total})
                </button>
                <button
                  className={`filter-btn ${filter === 'unrepaired' ? 'active' : ''}`}
                  onClick={() => setFilter('unrepaired')}
                >
                  Unrepaired ({stats.unrepaired})
                </button>
                <button
                  className={`filter-btn filter-high ${filter === 'high' ? 'active' : ''}`}
                  onClick={() => setFilter('high')}
                >
                  🔴 High Priority ({stats.high})
                </button>
              </div>
            </div>

            <div className="map-report-list">
              <h3>Reports ({filteredReports.length})</h3>
              <div className="report-list-scroll">
                {filteredReports.map((report) => (
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
                        {report.damage_type || 'Pending'}
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
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredReports.length === 0 && (
                  <p className="empty-message">No reports match the filter</p>
                )}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="map-container">
            {loading ? (
              <div className="loading-state">Loading map data...</div>
            ) : (
              <AdminMapView
                reports={filteredReports}
                onMarkerClick={setSelectedReport}
                selectedReport={selectedReport}
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
      </AdminLayout>
    </>
  );
}
