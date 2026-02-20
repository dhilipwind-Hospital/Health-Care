/**
 * Vitals Trend Chart Component
 * Shows interactive charts for vital signs over time
 */

import React, { useMemo } from 'react';
import { Card, Empty, Segmented, Typography, Row, Col, Statistic, Space } from 'antd';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
    ComposedChart
} from 'recharts';
import dayjs from 'dayjs';
import styled from 'styled-components';
import { VitalSignsRecord } from '../../types/patientHistory';
import { HeartOutlined } from '@ant-design/icons';

const { Text } = Typography;

const ChartContainer = styled.div`
    .chart-wrapper {
        margin-top: 16px;
    }
    
    .vital-stat {
        text-align: center;
        padding: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 8px;
        color: white;
        
        .ant-statistic-title {
            color: rgba(255, 255, 255, 0.85);
        }
        .ant-statistic-content {
            color: white;
        }
    }
`;

interface VitalsTrendChartProps {
    vitals: VitalSignsRecord[];
    loading?: boolean;
}

type ChartType = 'bloodPressure' | 'heartRate' | 'temperature' | 'weight' | 'all';

const VitalsTrendChart: React.FC<VitalsTrendChartProps> = ({ vitals, loading }) => {
    const [chartType, setChartType] = React.useState<ChartType>('bloodPressure');

    // Transform data for charts
    const chartData = useMemo(() => {
        if (!vitals || vitals.length === 0) return [];

        return vitals
            .filter(v => v.recordedAt)
            .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
            .map(v => ({
                date: dayjs(v.recordedAt).format('MMM D'),
                fullDate: dayjs(v.recordedAt).format('MMM D, YYYY h:mm A'),
                systolic: v.bloodPressureSystolic,
                diastolic: v.bloodPressureDiastolic,
                heartRate: v.heartRate,
                temperature: v.temperature,
                weight: v.weight,
                oxygenSaturation: v.oxygenSaturation,
                respiratoryRate: v.respiratoryRate
            }));
    }, [vitals]);

    // Calculate averages and latest values
    const stats = useMemo(() => {
        if (chartData.length === 0) return null;

        const latest = chartData[chartData.length - 1];
        const avgSystolic = Math.round(chartData.reduce((sum, d) => sum + (d.systolic || 0), 0) / chartData.filter(d => d.systolic).length);
        const avgDiastolic = Math.round(chartData.reduce((sum, d) => sum + (d.diastolic || 0), 0) / chartData.filter(d => d.diastolic).length);
        const avgHeartRate = Math.round(chartData.reduce((sum, d) => sum + (d.heartRate || 0), 0) / chartData.filter(d => d.heartRate).length);

        return {
            latest,
            avgSystolic: isNaN(avgSystolic) ? null : avgSystolic,
            avgDiastolic: isNaN(avgDiastolic) ? null : avgDiastolic,
            avgHeartRate: isNaN(avgHeartRate) ? null : avgHeartRate,
            totalReadings: chartData.length
        };
    }, [chartData]);

    if (!vitals || vitals.length === 0) {
        return (
            <Card title="📈 Vitals Trend">
                <Empty description="No vitals data available" />
            </Card>
        );
    }

    const renderChart = () => {
        switch (chartType) {
            case 'bloodPressure':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[60, 180]} />
                            <Tooltip
                                labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.fullDate || label}
                                formatter={(value: number | undefined, name: any) => {
                                    if (value === undefined) return ['-', name];
                                    const labels: Record<string, string> = {
                                        systolic: 'Systolic',
                                        diastolic: 'Diastolic'
                                    };
                                    return [`${value} mmHg`, labels[name] || name];
                                }}
                            />
                            <Legend />
                            <ReferenceLine y={120} stroke="#ff7300" strokeDasharray="5 5" label="Normal Systolic" />
                            <ReferenceLine y={80} stroke="#82ca9d" strokeDasharray="5 5" label="Normal Diastolic" />
                            <Line type="monotone" dataKey="systolic" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} name="Systolic" />
                            <Line type="monotone" dataKey="diastolic" stroke="#2196f3" strokeWidth={2} dot={{ r: 4 }} name="Diastolic" />
                        </ComposedChart>
                    </ResponsiveContainer>
                );

            case 'heartRate':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[50, 120]} />
                            <Tooltip
                                labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.fullDate || label}
                                formatter={(value: number | undefined) => [value ? `${value} bpm` : '-', 'Heart Rate']}
                            />
                            <Legend />
                            <ReferenceLine y={100} stroke="#ff7300" strokeDasharray="5 5" label="Upper Normal" />
                            <ReferenceLine y={60} stroke="#82ca9d" strokeDasharray="5 5" label="Lower Normal" />
                            <Line type="monotone" dataKey="heartRate" stroke="#10B981" strokeWidth={2} dot={{ r: 5 }} name="Heart Rate" />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'temperature':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[96, 104]} />
                            <Tooltip
                                labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.fullDate || label}
                                formatter={(value: number | undefined) => [value ? `${value}°F` : '-', 'Temperature']}
                            />
                            <Legend />
                            <ReferenceLine y={98.6} stroke="#82ca9d" strokeDasharray="5 5" label="Normal" />
                            <ReferenceLine y={100.4} stroke="#ff7300" strokeDasharray="5 5" label="Fever" />
                            <Line type="monotone" dataKey="temperature" stroke="#ff9800" strokeWidth={2} dot={{ r: 5 }} name="Temperature" />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'weight':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.fullDate || label}
                                formatter={(value: number | undefined) => [value ? `${value} kg` : '-', 'Weight']}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="weight" stroke="#4caf50" strokeWidth={2} dot={{ r: 5 }} name="Weight" />
                        </LineChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    return (
        <ChartContainer>
            <Card
                title={
                    <Space>
                        <HeartOutlined style={{ color: '#10B981' }} />
                        <span>Vitals Trend Analysis</span>
                    </Space>
                }
                extra={
                    <Text type="secondary">{stats?.totalReadings} readings</Text>
                }
            >
                {/* Quick Stats */}
                {stats && (
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={12} sm={6}>
                            <div className="vital-stat" style={{ background: 'linear-gradient(135deg, #10B981 0%, #c2185b 100%)' }}>
                                <Statistic
                                    title="Latest BP"
                                    value={`${stats.latest?.systolic || '-'}/${stats.latest?.diastolic || '-'}`}
                                    suffix="mmHg"
                                />
                            </div>
                        </Col>
                        <Col xs={12} sm={6}>
                            <div className="vital-stat" style={{ background: 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)' }}>
                                <Statistic
                                    title="Avg BP"
                                    value={`${stats.avgSystolic || '-'}/${stats.avgDiastolic || '-'}`}
                                    suffix="mmHg"
                                />
                            </div>
                        </Col>
                        <Col xs={12} sm={6}>
                            <div className="vital-stat" style={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' }}>
                                <Statistic
                                    title="Latest HR"
                                    value={stats.latest?.heartRate || '-'}
                                    suffix="bpm"
                                />
                            </div>
                        </Col>
                        <Col xs={12} sm={6}>
                            <div className="vital-stat" style={{ background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)' }}>
                                <Statistic
                                    title="Avg HR"
                                    value={stats.avgHeartRate || '-'}
                                    suffix="bpm"
                                />
                            </div>
                        </Col>
                    </Row>
                )}

                {/* Chart Type Selector */}
                <Segmented
                    value={chartType}
                    onChange={(value) => setChartType(value as ChartType)}
                    options={[
                        { label: '🩸 Blood Pressure', value: 'bloodPressure' },
                        { label: '❤️ Heart Rate', value: 'heartRate' },
                        { label: '🌡️ Temperature', value: 'temperature' },
                        { label: '⚖️ Weight', value: 'weight' }
                    ]}
                    style={{ marginBottom: 16 }}
                />

                {/* Chart */}
                <div className="chart-wrapper">
                    {renderChart()}
                </div>
            </Card>
        </ChartContainer>
    );
};

export default VitalsTrendChart;
