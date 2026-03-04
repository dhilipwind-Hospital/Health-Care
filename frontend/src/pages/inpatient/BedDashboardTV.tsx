import React, { useEffect, useState } from 'react';
import { Row, Col, Typography } from 'antd';
import styled from 'styled-components';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Text } = Typography;

const TVContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background: #0F172A;
  padding: 32px;
  color: #fff;
  font-family: 'Inter', -apple-system, sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(255,255,255,0.1);
  .title { font-size: 42px; font-weight: 800; color: #fff; margin: 0; }
  .subtitle { font-size: 16px; color: rgba(255,255,255,0.6); }
  .time { text-align: right; }
  .date { font-size: 18px; color: rgba(255,255,255,0.7); }
  .clock { font-size: 42px; font-weight: 700; color: #10B981; }
`;

const SummaryBar = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
`;

const SummaryCard = styled.div<{ bg: string }>`
  flex: 1;
  background: ${p => p.bg};
  border-radius: 12px;
  padding: 16px 20px;
  text-align: center;
  .label { font-size: 14px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px; }
  .value { font-size: 36px; font-weight: 800; color: #fff; margin-top: 4px; }
`;

const WardSection = styled.div`
  margin-bottom: 24px;
  .ward-title { font-size: 22px; font-weight: 700; color: #60A5FA; margin-bottom: 12px; }
`;

const BedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
`;

const BedCard = styled.div<{ status: string }>`
  background: ${p =>
    p.status === 'available' ? '#059669' :
    p.status === 'occupied' ? '#DC2626' :
    p.status === 'reserved' ? '#D97706' :
    '#4B5563'};
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  .bed-number { font-size: 16px; font-weight: 700; color: #fff; }
  .bed-status { font-size: 10px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
`;

interface BedData {
  id: string;
  bedNumber: string;
  status: string;
  ward?: { id: string; name: string };
  room?: { roomNumber: string };
}

interface WardData {
  id: string;
  name: string;
}

const BedDashboardTV: React.FC = () => {
  const [beds, setBeds] = useState<BedData[]>([]);
  const [wards, setWards] = useState<WardData[]>([]);
  const [currentTime, setCurrentTime] = useState(dayjs());

  const fetchData = async () => {
    try {
      const [bedsRes, wardsRes] = await Promise.allSettled([
        api.get('/inpatient/beds'),
        api.get('/inpatient/wards'),
      ]);
      if (bedsRes.status === 'fulfilled') setBeds(bedsRes.value.data?.data || bedsRes.value.data || []);
      if (wardsRes.status === 'fulfilled') setWards(wardsRes.value.data?.data || wardsRes.value.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const total = beds.length;
  const available = beds.filter(b => b.status === 'available').length;
  const occupied = beds.filter(b => b.status === 'occupied').length;
  const reserved = beds.filter(b => b.status === 'reserved').length;
  const occupancyPct = total > 0 ? Math.round((occupied / total) * 100) : 0;

  // Group beds by ward
  const wardBeds: Record<string, BedData[]> = {};
  beds.forEach(b => {
    const wName = (b as any).ward?.name || (b as any).wardName || 'Unassigned';
    if (!wardBeds[wName]) wardBeds[wName] = [];
    wardBeds[wName].push(b);
  });

  return (
    <TVContainer>
      <Header>
        <div>
          <div className="title">Bed Occupancy Dashboard</div>
          <div className="subtitle">Real-Time Bed Status Monitor</div>
        </div>
        <div className="time">
          <div className="date">{currentTime.format('dddd, MMMM D, YYYY')}</div>
          <div className="clock">{currentTime.format('HH:mm:ss')}</div>
        </div>
      </Header>

      <SummaryBar>
        <SummaryCard bg="#1E40AF"><div className="label">Total Beds</div><div className="value">{total}</div></SummaryCard>
        <SummaryCard bg="#059669"><div className="label">Available</div><div className="value">{available}</div></SummaryCard>
        <SummaryCard bg="#DC2626"><div className="label">Occupied</div><div className="value">{occupied}</div></SummaryCard>
        <SummaryCard bg="#D97706"><div className="label">Reserved</div><div className="value">{reserved}</div></SummaryCard>
        <SummaryCard bg="#7C3AED"><div className="label">Occupancy</div><div className="value">{occupancyPct}%</div></SummaryCard>
      </SummaryBar>

      {Object.entries(wardBeds).map(([wardName, wBeds]) => (
        <WardSection key={wardName}>
          <div className="ward-title">{wardName} ({wBeds.length} beds)</div>
          <BedGrid>
            {wBeds.map(b => (
              <BedCard key={b.id} status={b.status}>
                <div className="bed-number">{b.bedNumber}</div>
                <div className="bed-status">{b.status}</div>
              </BedCard>
            ))}
          </BedGrid>
        </WardSection>
      ))}

      {beds.length === 0 && (
        <div style={{ textAlign: 'center', padding: 80, color: 'rgba(255,255,255,0.4)', fontSize: 28 }}>
          No bed data available
        </div>
      )}
    </TVContainer>
  );
};

export default BedDashboardTV;
