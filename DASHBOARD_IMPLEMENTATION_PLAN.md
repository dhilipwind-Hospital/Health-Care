# 🎨 Dashboard Implementation Plan

## 📋 Table of Contents
1. [Dashboard Design Analysis](#dashboard-design-analysis)
2. [Component Breakdown](#component-breakdown)
3. [Implementation Strategy](#implementation-strategy)
4. [Technical Specifications](#technical-specifications)
5. [Development Roadmap](#development-roadmap)
6. [Code Structure](#code-structure)
7. [Data Integration](#data-integration)
8. [Styling & Theming](#styling--theming)

---

## 🎨 Dashboard Design Analysis

Based on your reference image, I can see this is a modern, comprehensive dashboard with:

### Key Visual Elements:
- **Sidebar Navigation** - Multi-level menu with icons
- **Top Header** - User profile, notifications, search
- **Main Content Area** - Grid layout with widgets
- **Statistics Cards** - Colorful metric displays
- **Charts & Graphs** - Data visualizations
- **Recent Activity** - Timeline or list views
- **Quick Actions** - Action buttons and shortcuts

### Design Characteristics:
- **Modern UI** with rounded corners and shadows
- **Color-coded metrics** (green, orange, red indicators)
- **Responsive grid layout**
- **Clean typography**
- **Interactive elements** (hover states, transitions)
- **Professional healthcare theme**

---

## 🧩 Component Breakdown

### 1. **Layout Components**

```typescript
// Main Dashboard Layout
interface DashboardLayout {
  header: HeaderBar
  sidebar: SidebarNavigation
  content: MainContentArea
  footer?: Footer
}

// Header Bar
interface HeaderBar {
  logo: string
  searchBox: SearchInput
  notifications: NotificationBell
  userProfile: UserDropdown
  quickActions: ActionButtons[]
}

// Sidebar Navigation
interface SidebarNavigation {
  logo: string
  menuItems: MenuItem[]
  collapsed: boolean
  activeItem: string
}

// Main Content Area
interface MainContentArea {
  breadcrumbs: BreadcrumbTrail
  pageHeader: PageHeader
  widgets: DashboardWidget[]
}
```

### 2. **Widget Components**

```typescript
// Statistics Cards
interface StatCard {
  title: string
  value: string | number
  icon: ReactNode
  trend: {
    value: number
    direction: 'up' | 'down'
    label: string
  }
  color: 'primary' | 'success' | 'warning' | 'danger'
}

// Chart Widgets
interface ChartWidget {
  type: 'line' | 'bar' | 'pie' | 'area'
  title: string
  data: ChartData
  options: ChartOptions
  height: number
}

// Activity Feed
interface ActivityFeed {
  title: string
  items: ActivityItem[]
  maxItems: number
  showMore: boolean
}

// Quick Actions Panel
interface QuickActions {
  title: string
  actions: QuickAction[]
  layout: 'grid' | 'list'
}
```

### 3. **Data Components**

```typescript
// Chart Data Structure
interface ChartData {
  labels: string[]
  datasets: Dataset[]
}

interface Dataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string
  borderWidth?: number
}

// Activity Item
interface ActivityItem {
  id: string
  type: 'appointment' | 'registration' | 'payment' | 'lab_result'
  title: string
  description: string
  timestamp: Date
  user: string
  status: 'completed' | 'pending' | 'cancelled'
}
```

---

## 🛠️ Implementation Strategy

### Phase 1: Core Layout (Week 1)
1. **Create base layout structure**
2. **Implement responsive sidebar**
3. **Build header with search and notifications**
4. **Add routing integration**

### Phase 2: Widget System (Week 2)
1. **Create widget framework**
2. **Implement statistics cards**
3. **Build chart components**
4. **Add activity feed**

### Phase 3: Data Integration (Week 3)
1. **Connect to backend APIs**
2. **Implement real-time updates**
3. **Add data caching**
4. **Create mock data for development**

### Phase 4: Interactions (Week 4)
1. **Add hover states and transitions**
2. **Implement click handlers**
3. **Add loading states**
4. **Create error boundaries**

---

## 💻 Technical Specifications

### Technology Stack
```typescript
// Frontend Dependencies
{
  "react": "^18.2.0",
  "typescript": "^4.9.5",
  "antd": "^5.27.3",           // UI Components
  "recharts": "^3.6.0",       // Charts
  "styled-components": "^6.1.19", // Styling
  "framer-motion": "^12.23.22", // Animations
  "axios": "^1.12.2",         // API Calls
  "react-router-dom": "^6.26.2", // Routing
  "dayjs": "^1.11.10",        // Date handling
  "lodash": "^4.17.21"        // Utilities
}
```

### Component Architecture
```typescript
// File Structure
src/
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   ├── HeaderBar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── widgets/
│   │   ├── StatCard.tsx
│   │   ├── ChartWidget.tsx
│   │   ├── ActivityFeed.tsx
│   │   └── QuickActions.tsx
│   ├── charts/
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   └── AreaChart.tsx
│   └── common/
│       ├── Loading.tsx
│       ├── ErrorBoundary.tsx
│       └── SearchInput.tsx
├── hooks/
│   ├── useDashboardData.ts
│   ├── useRealTimeUpdates.ts
│   └── useLocalStorage.ts
├── services/
│   ├── dashboardService.ts
│   ├── chartService.ts
│   └── notificationService.ts
├── types/
│   ├── dashboard.ts
│   ├── charts.ts
│   └── api.ts
└── utils/
    ├── formatters.ts
    ├── colors.ts
    └── helpers.ts
```

---

## 📊 Development Roadmap

### Week 1: Foundation
```bash
# Create base components
mkdir -p src/components/{layout,widgets,charts,common}
mkdir -p src/{hooks,services,types,utils}

# Install dependencies
npm install recharts framer-motion styled-components

# Create base layout
touch src/components/layout/DashboardLayout.tsx
touch src/components/layout/HeaderBar.tsx
touch src/components/layout/Sidebar.tsx
```

### Week 2: Widgets
```bash
# Create widget components
touch src/components/widgets/StatCard.tsx
touch src/components/widgets/ChartWidget.tsx
touch src/components/widgets/ActivityFeed.tsx
touch src/components/widgets/QuickActions.tsx

# Create chart components
touch src/components/charts/LineChart.tsx
touch src/components/charts/BarChart.tsx
touch src/components/charts/PieChart.tsx
```

### Week 3: Integration
```bash
# Create services and hooks
touch src/services/dashboardService.ts
touch src/hooks/useDashboardData.ts
touch src/hooks/useRealTimeUpdates.ts

# Create types
touch src/types/dashboard.ts
touch src/types/charts.ts
```

---

## 🏗️ Code Structure

### 1. **Main Dashboard Layout**

```typescript
// src/components/layout/DashboardLayout.tsx
import React, { useState } from 'react';
import { Layout } from 'antd';
import styled from 'styled-components';
import HeaderBar from './HeaderBar';
import Sidebar from './Sidebar';

const { Content } = Layout;

const DashboardContainer = styled(Layout)`
  min-height: 100vh;
  background: #f0f2f5;
`;

const MainContent = styled(Content)`
  margin: 24px 16px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <DashboardContainer>
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout>
        <HeaderBar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <MainContent>
          {children}
        </MainContent>
      </Layout>
    </DashboardContainer>
  );
};

export default DashboardLayout;
```

### 2. **Statistics Card Component**

```typescript
// src/components/widgets/StatCard.tsx
import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import styled from 'styled-components';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const StatCardContainer = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: none;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
  }
  
  .ant-statistic-content {
    font-size: 28px;
    font-weight: 600;
  }
`;

const TrendIndicator = styled.div<{ trend: 'up' | 'down' }>`
  display: flex;
  align-items: center;
  color: ${props => props.trend === 'up' ? '#52c41a' : '#ff4d4f'};
  font-size: 12px;
  margin-top: 8px;
`;

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label: string;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'primary'
}) => {
  const colorMap = {
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    danger: '#ff4d4f'
  };

  return (
    <StatCardContainer>
      <Row align="middle">
        <Col span={16}>
          <Statistic
            title={title}
            value={value}
            valueStyle={{ color: colorMap[color] }}
            prefix={icon}
          />
          {trend && (
            <TrendIndicator trend={trend.direction}>
              {trend.direction === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              <span style={{ marginLeft: 4 }}>
                {trend.value}% {trend.label}
              </span>
            </TrendIndicator>
          )}
        </Col>
        <Col span={8} style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 48, color: colorMap[color] }}>
            {icon}
          </div>
        </Col>
      </Row>
    </StatCardContainer>
  );
};

export default StatCard;
```

### 3. **Chart Widget Component**

```typescript
// src/components/widgets/ChartWidget.tsx
import React from 'react';
import { Card } from 'antd';
import styled from 'styled-components';
import {
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  Line,
  Bar,
  Pie,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

const ChartContainer = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: none;
  
  .ant-card-head {
    border-bottom: 1px solid #f0f0f0;
  }
`;

interface ChartWidgetProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: any[];
  height?: number;
  colors?: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ChartWidget: React.FC<ChartWidgetProps> = ({
  type,
  title,
  data,
  height = 300,
  colors = COLORS
}) => {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} />
          </LineChart>
        );
      
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill={colors[0]} />
          </BarChart>
        );
      
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke={colors[0]} fill={colors[0]} />
          </AreaChart>
        );
      
      default:
        return null;
    }
  };

  return (
    <ChartContainer title={title}>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default ChartWidget;
```

### 4. **Activity Feed Component**

```typescript
// src/components/widgets/ActivityFeed.tsx
import React from 'react';
import { Card, List, Avatar, Tag, Typography } from 'antd';
import styled from 'styled-components';
import { 
  UserOutlined, 
  CalendarOutlined, 
  DollarOutlined, 
  FileTextOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

const ActivityContainer = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: none;
  
  .ant-list-item {
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
  }
`;

const ActivityIcon = styled.div<{ type: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.type) {
      case 'appointment': return '#e6f7ff';
      case 'registration': return '#f6ffed';
      case 'payment': return '#fff7e6';
      case 'lab_result': return '#f9f0ff';
      default: return '#f0f0f0';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'appointment': return '#1890ff';
      case 'registration': return '#52c41a';
      case 'payment': return '#faad14';
      case 'lab_result': return '#722ed1';
      default: return '#666';
    }
  }};
`;

interface ActivityItem {
  id: string;
  type: 'appointment' | 'registration' | 'payment' | 'lab_result';
  title: string;
  description: string;
  timestamp: Date;
  user: string;
  status: 'completed' | 'pending' | 'cancelled';
}

interface ActivityFeedProps {
  title: string;
  items: ActivityItem[];
  maxItems?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  title,
  items,
  maxItems = 10
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <CalendarOutlined />;
      case 'registration': return <UserOutlined />;
      case 'payment': return <DollarOutlined />;
      case 'lab_result': return <FileTextOutlined />;
      default: return <UserOutlined />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'pending': return 'orange';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const displayItems = items.slice(0, maxItems);

  return (
    <ActivityContainer title={title}>
      <List
        dataSource={displayItems}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <ActivityIcon type={item.type}>
                  {getIcon(item.type)}
                </ActivityIcon>
              }
              title={
                <div>
                  <Text strong>{item.title}</Text>
                  <Tag color={getStatusColor(item.status)} style={{ marginLeft: 8 }}>
                    {item.status}
                  </Tag>
                </div>
              }
              description={
                <div>
                  <Text type="secondary">{item.description}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.user} • {dayjs(item.timestamp).fromNow()}
                  </Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </ActivityContainer>
  );
};

export default ActivityFeed;
```

---

## 🔄 Data Integration

### 1. **Dashboard Service**

```typescript
// src/services/dashboardService.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingTasks: number;
  monthlyRevenue: number;
  patientGrowth: number;
  appointmentGrowth: number;
  taskGrowth: number;
  revenueGrowth: number;
}

export interface ChartData {
  appointments: Array<{ name: string; value: number }>;
  revenue: Array<{ name: string; value: number }>;
  patientTypes: Array<{ name: string; value: number }>;
  departmentPerformance: Array<{ name: string; value: number }>;
}

export interface ActivityData {
  recentActivities: Array<{
    id: string;
    type: 'appointment' | 'registration' | 'payment' | 'lab_result';
    title: string;
    description: string;
    timestamp: Date;
    user: string;
    status: 'completed' | 'pending' | 'cancelled';
  }>;
}

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const response = await axios.get(`${API_BASE_URL}/dashboard/stats`);
    return response.data;
  }

  async getChartData(): Promise<ChartData> {
    const response = await axios.get(`${API_BASE_URL}/dashboard/charts`);
    return response.data;
  }

  async getActivityFeed(): Promise<ActivityData> {
    const response = await axios.get(`${API_BASE_URL}/dashboard/activity`);
    return response.data;
  }

  async getRealTimeUpdates(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/dashboard/realtime`);
    return response.data;
  }
}

export default new DashboardService();
```

### 2. **Custom Hook for Dashboard Data**

```typescript
// src/hooks/useDashboardData.ts
import { useState, useEffect } from 'react';
import dashboardService from '../services/dashboardService';

export const useDashboardData = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activities, setActivities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, chartsData, activitiesData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getChartData(),
          dashboardService.getActivityFeed()
        ]);

        setStats(statsData);
        setCharts(chartsData);
        setActivities(activitiesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      const [statsData, chartsData, activitiesData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getChartData(),
        dashboardService.getActivityFeed()
      ]);

      setStats(statsData);
      setCharts(chartsData);
      setActivities(activitiesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    charts,
    activities,
    loading,
    error,
    refreshData
  };
};
```

---

## 🎨 Styling & Theming

### 1. **Theme Configuration**

```typescript
// src/styles/theme.ts
export const theme = {
  colors: {
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    danger: '#ff4d4f',
    info: '#13c2c2',
    purple: '#722ed1',
    cyan: '#13c2c2',
    gray: '#8c8c8c'
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px'
  },
  
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 12px rgba(0, 0, 0, 0.1)',
    lg: '0 6px 16px rgba(0, 0, 0, 0.15)',
    xl: '0 8px 24px rgba(0, 0, 0, 0.2)'
  },
  
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px'
    }
  }
};
```

### 2. **Global Styles**

```typescript
// src/styles/global.ts
import styled, { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${theme.typography.fontFamily};
    background: #f0f2f5;
    color: #262626;
    line-height: 1.6;
  }

  .ant-layout {
    background: #f0f2f5;
  }

  .ant-card {
    border-radius: ${theme.borderRadius.lg};
    box-shadow: ${theme.shadows.md};
    border: none;
  }

  .ant-card-head {
    border-bottom: 1px solid #f0f0f0;
    padding: ${theme.spacing.lg};
  }

  .ant-card-body {
    padding: ${theme.spacing.lg};
  }

  .ant-statistic-title {
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.gray};
    margin-bottom: ${theme.spacing.xs};
  }

  .ant-statistic-content {
    font-size: ${theme.typography.fontSize.xl};
    font-weight: 600;
  }
`;
```

---

## 🚀 Implementation Steps

### Step 1: Create Base Structure
```bash
# Create directories
mkdir -p src/components/{layout,widgets,charts,common}
mkdir -p src/{hooks,services,types,utils,styles}

# Create main files
touch src/components/layout/DashboardLayout.tsx
touch src/components/layout/HeaderBar.tsx
touch src/components/layout/Sidebar.tsx
touch src/components/widgets/StatCard.tsx
touch src/components/widgets/ChartWidget.tsx
touch src/components/widgets/ActivityFeed.tsx
```

### Step 2: Install Dependencies
```bash
npm install recharts framer-motion styled-components
npm install @types/styled-components
```

### Step 3: Create Main Dashboard Page
```typescript
// src/pages/Dashboard.tsx
import React from 'react';
import { Row, Col } from 'antd';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/widgets/StatCard';
import ChartWidget from '../components/widgets/ChartWidget';
import ActivityFeed from '../components/widgets/ActivityFeed';
import { useDashboardData } from '../hooks/useDashboardData';
import { 
  UserOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined, 
  DollarOutlined 
} from '@ant-design/icons';

const Dashboard: React.FC = () => {
  const { stats, charts, activities, loading, error } = useDashboardData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <DashboardLayout>
      <Row gutter={[16, 16]}>
        {/* Statistics Cards */}
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Patients"
            value={stats?.totalPatients}
            icon={<UserOutlined />}
            trend={{
              value: stats?.patientGrowth,
              direction: 'up',
              label: 'from last month'
            }}
            color="primary"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Today's Appointments"
            value={stats?.todayAppointments}
            icon={<CalendarOutlined />}
            trend={{
              value: stats?.appointmentGrowth,
              direction: 'up',
              label: 'from yesterday'
            }}
            color="success"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Pending Tasks"
            value={stats?.pendingTasks}
            icon={<ClockCircleOutlined />}
            trend={{
              value: stats?.taskGrowth,
              direction: 'down',
              label: 'from yesterday'
            }}
            color="warning"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Monthly Revenue"
            value={`$${stats?.monthlyRevenue}`}
            icon={<DollarOutlined />}
            trend={{
              value: stats?.revenueGrowth,
              direction: 'up',
              label: 'from last month'
            }}
            color="danger"
          />
        </Col>

        {/* Charts */}
        <Col xs={24} lg={12}>
          <ChartWidget
            type="line"
            title="Appointment Trends"
            data={charts?.appointments}
            height={300}
          />
        </Col>
        <Col xs={24} lg={12}>
          <ChartWidget
            type="bar"
            title="Revenue Overview"
            data={charts?.revenue}
            height={300}
          />
        </Col>

        {/* Activity Feed */}
        <Col xs={24} lg={8}>
          <ActivityFeed
            title="Recent Activity"
            items={activities?.recentActivities}
            maxItems={5}
          />
        </Col>

        {/* Additional Charts */}
        <Col xs={24} lg={8}>
          <ChartWidget
            type="pie"
            title="Patient Types"
            data={charts?.patientTypes}
            height={250}
          />
        </Col>
        <Col xs={24} lg={8}>
          <ChartWidget
            type="area"
            title="Department Performance"
            data={charts?.departmentPerformance}
            height={250}
          />
        </Col>
      </Row>
    </DashboardLayout>
  );
};

export default Dashboard;
```

---

## 📱 Responsive Design

### Breakpoints
```typescript
// Responsive breakpoints
const breakpoints = {
  xs: '480px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  xxl: '1600px'
};

// Responsive grid system
const gridConfig = {
  gutter: [16, 16],
  xs: { span: 24 },
  sm: { span: 12 },
  md: { span: 8 },
  lg: { span: 6 },
  xl: { span: 6 }
};
```

---

## 🎯 Next Steps

1. **Create the base layout structure**
2. **Implement responsive sidebar navigation**
3. **Build statistics cards with animations**
4. **Create chart components with real data**
5. **Add activity feed with real-time updates**
6. **Implement search and notifications**
7. **Add dark mode support**
8. **Create mobile-responsive design**
9. **Add accessibility features**
10. **Implement performance optimizations**

This implementation plan will give you a modern, comprehensive dashboard similar to your reference image, fully integrated with your Hospital Management System backend! 🎨✨
