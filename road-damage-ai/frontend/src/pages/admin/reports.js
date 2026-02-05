import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import ReportTable from '../../components/admin/ReportTable';
import ReportModal from '../../components/admin/ReportModal';
import api from '../../services/api';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    damageType: '',
  });

  useEffect(() => {
    loadReports();
  }, [filters]);

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

  const handleStatusChange = async (reportId, status, notes = null) => {
    try {
      await api.updateReportStatus(reportId, status, notes);
      loadReports(); // Reload to get updated data
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

  return (
    <>
      <Head>
        <title>Reports - Road Damage Admin</title>
      </Head>

      <AdminLayout title="Damage Reports">
        {/* Filters */}
        <div className="filters-bar">
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="analyzing">Analyzing</option>
              <option value="analyzed">Analyzed</option>
              <option value="repaired">Repaired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Damage Type</label>
            <select
              value={filters.damageType}
              onChange={(e) => handleFilterChange('damageType', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="pothole">Pothole</option>
              <option value="crack">Crack</option>
              <option value="rutting">Rutting</option>
              <option value="patching">Patching</option>
              <option value="erosion">Erosion</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button className="btn btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          )}

          <div className="filter-spacer" />

          <button className="btn btn-primary" onClick={loadReports}>
            🔄 Refresh
          </button>
        </div>

        {/* Results count */}
        <div className="results-info">
          Showing {reports.length} report{reports.length !== 1 ? 's' : ''}
        </div>

        {/* Reports Table */}
        {loading ? (
          <div className="loading-state">Loading reports...</div>
        ) : (
          <ReportTable
            reports={reports}
            onStatusChange={handleStatusChange}
            onViewDetails={setSelectedReport}
          />
        )}

        {/* Report Detail Modal */}
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
