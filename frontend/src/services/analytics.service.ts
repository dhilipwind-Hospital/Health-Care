import api from './api';

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  totalPrescriptions: number;
  totalLabOrders: number;
  emergencyRequests: number;
  callbackRequests: number;
  activeDepartments: number;
  activeDoctors: number;
}

export interface DepartmentPerformance {
  id: string;
  department: string;
  patients: number;
  appointments: number;
  utilization: number;
}

export interface RecentActivity {
  id: string;
  patient: string;
  doctor: string;
  department: string;
  time: string;
  status: string;
}

class AnalyticsService {
  async getDashboardStats(locationId?: string): Promise<DashboardStats> {
    const params = locationId ? { locationId } : {};
    const response = await api.get('/analytics/dashboard-stats', { params });
    return response.data;
  }

  async getDepartmentPerformance(locationId?: string): Promise<DepartmentPerformance[]> {
    const params = locationId ? { locationId } : {};
    const response = await api.get('/analytics/department-performance', { params });
    return response.data;
  }

  async getRecentActivity(locationId?: string): Promise<RecentActivity[]> {
    const params = locationId ? { locationId } : {};
    const response = await api.get('/analytics/recent-activity', { params });
    return response.data;
  }
}

export default new AnalyticsService();
