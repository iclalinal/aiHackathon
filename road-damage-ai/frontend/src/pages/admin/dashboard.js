import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import StatCard from '../../components/admin/StatCard';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, reportsRes] = await Promise.all([
        api.getStatistics(),
        api.getAdminReports({ limit: 5, sortBy: 'created_at', sortOrder: 'desc' }),
      ]);
      setStats(statsRes.data);
      setRecentReports(reportsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₺0';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <AdminLayout title="Kontrol Paneli">
        <div className="loading-state">Yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Kontrol Paneli - Yol Hasarı Yönetici</title>
      </Head>

      <AdminLayout title="Kontrol Paneli">
        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard
            title="Toplam Rapor"
            value={stats?.total || 0}
            icon="📋"
            color="blue"
          />
          <StatCard
            title="Analiz Bekleyen"
            value={(stats?.pending || 0) + (stats?.analyzing || 0)}
            icon="⏳"
            color="yellow"
          />
          <StatCard
            title="Yüksek Öncelik"
            value={stats?.high_priority || 0}
            icon="🔴"
            color="red"
            subtitle="Onarılmamış yüksek şiddet"
          />
          <StatCard
            title="Onarılmış"
            value={stats?.repaired || 0}
            icon="✅"
            color="green"
          />
          <StatCard
            title="Ort. Onarım Maliyeti"
            value={formatCurrency(stats?.avg_cost)}
            icon="💰"
            color="purple"
          />
          <StatCard
            title="Toplam Tahmini"
            value={formatCurrency(stats?.total_estimated_cost)}
            icon="📊"
            color="indigo"
            subtitle="Tüm onarılmamışlar"
          />
        </div>

        {/* Charts Row */}
        <div className="dashboard-row">
          {/* By Severity */}
          <div className="dashboard-card">
            <h3>Şiddete Göre Raporlar</h3>
            <div className="severity-chart">
              {stats?.bySeverity?.map((item) => (
                <div key={item.severity} className="chart-bar-container">
                  <span className="bar-label">{item.severity}</span>
                  <div className="bar-wrapper">
                    <div
                      className={`chart-bar severity-${item.severity}`}
                      style={{
                        width: `${(item.count / (stats.total || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="bar-value">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Damage Type */}
          <div className="dashboard-card">
            <h3>Hasar Türüne Göre Raporlar</h3>
            <div className="damage-type-list">
              {stats?.byDamageType?.map((item) => (
                <div key={item.damage_type} className="type-item">
                  <span className="type-name">{item.damage_type}</span>
                  <span className="type-count">{item.count}</span>
                </div>
              ))}
              {(!stats?.byDamageType || stats.byDamageType.length === 0) && (
                <p className="empty-message">Henüz analiz edilmiş rapor yok</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h3>Son Raporlar</h3>
            <a href="/admin/reports" className="view-all-link">
              Tümünü gör →
            </a>
          </div>
          <div className="recent-reports-list">
            {recentReports.map((report) => (
              <div key={report.id} className="recent-report-item">
                <div className="report-info">
                  <span className={`status-dot status-${report.status}`} />
                  <div className="report-details">
                    <span className="report-type">
                      {report.damage_type || 'Analiz Bekliyor'}
                    </span>
                    <span className="report-date">
                      {new Date(report.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
                <div className="report-meta">
                  {report.severity && (
                    <span className={`severity-badge severity-${report.severity}`}>
                      {report.severity}
                    </span>
                  )}
                  <span className="report-status">{report.status}</span>
                </div>
              </div>
            ))}
            {recentReports.length === 0 && (
              <p className="empty-message">Henüz rapor yok</p>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
