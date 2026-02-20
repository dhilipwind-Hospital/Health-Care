import React, { useEffect, useState } from 'react';
import { Card, Tag, Typography, Row, Col } from 'antd';
import { getQueueBoard } from '../../services/queue.service';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Styled Components for TV Display
const TVContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background: #1E3A5F;
  padding: 32px;
  color: #fff;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  
  .title {
    font-size: 48px;
    font-weight: 700;
    color: #fff;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .subtitle {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 4px;
  }
  
  .time {
    text-align: right;
    
    .date {
      font-size: 20px;
      color: rgba(255, 255, 255, 0.8);
    }
    
    .clock {
      font-size: 48px;
      font-weight: 700;
      color: #10B981;
    }
  }
`;

const NowServingSection = styled.div`
  margin-bottom: 32px;
  
  .section-title {
    font-size: 24px;
    color: #10B981;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
`;

const NowServingCard = styled.div`
  background: #10B981;
  border-radius: 16px;
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
  
  .token {
    font-size: 72px;
    font-weight: 800;
    color: #fff;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  .patient-info {
    text-align: right;
    
    .name {
      font-size: 28px;
      font-weight: 600;
      color: #fff;
    }
    
    .room {
      font-size: 20px;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 4px;
    }
  }
`;

const WaitingSection = styled.div`
  .section-title {
    font-size: 24px;
    color: #F59E0B;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
`;

const WaitingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const WaitingCard = styled.div<{ priority?: string }>`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 2px solid ${props => 
    props.priority === 'emergency' ? '#EF4444' : 
    props.priority === 'urgent' ? '#F59E0B' : 
    props.priority === 'critical' ? '#DC2626' :
    'rgba(255, 255, 255, 0.2)'
  };
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
  
  .token {
    font-size: 36px;
    font-weight: 700;
    color: #fff;
  }
  
  .priority-tag {
    margin-top: 8px;
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    background: ${props => 
      props.priority === 'emergency' ? '#EF4444' : 
      props.priority === 'urgent' ? '#F59E0B' : 
      props.priority === 'critical' ? '#DC2626' :
      '#3B82F6'
    };
    color: #fff;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 24px;
`;

const TVDisplay: React.FC = () => {
  const params = useParams();
  const stageParam = String(params.stage || 'triage').toLowerCase() as 'triage' | 'doctor';
  const [items, setItems] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(dayjs());

  const fetchBoard = async () => {
    try {
      const data = await getQueueBoard(stageParam);
      setItems(data || []);
    } catch {}
  };

  useEffect(() => {
    fetchBoard();
    const t = setInterval(fetchBoard, 3000);
    return () => clearInterval(t);
  }, [stageParam]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const calledItems = items.filter(it => it.status === 'called');
  const waitingItems = items.filter(it => it.status === 'waiting');

  const getStageTitle = () => {
    switch (stageParam) {
      case 'triage': return 'Triage Station';
      case 'doctor': return 'Doctor Consultation';
      default: return 'Queue Display';
    }
  };

  return (
    <TVContainer>
      <Header>
        <div>
          <div className="title">{getStageTitle()}</div>
          <div className="subtitle">Ayphen Healthcare Network</div>
        </div>
        <div className="time">
          <div className="date">{currentTime.format('dddd, MMMM D, YYYY')}</div>
          <div className="clock">{currentTime.format('HH:mm:ss')}</div>
        </div>
      </Header>

      {/* Now Serving */}
      <NowServingSection>
        <div className="section-title">🔔 Now Serving</div>
        {calledItems.length > 0 ? (
          <Row gutter={16}>
            {calledItems.slice(0, 3).map((item) => (
              <Col xs={24} md={8} key={item.id}>
                <NowServingCard>
                  <div className="token">{item.tokenNumber}</div>
                  <div className="patient-info">
                    <div className="name">
                      {item.visit?.patient?.firstName || ''} {item.visit?.patient?.lastName || ''}
                    </div>
                    <div className="room">
                      {stageParam === 'doctor' && item.assignedDoctor 
                        ? `Dr. ${item.assignedDoctor.firstName || ''} ${item.assignedDoctor.lastName || ''}`
                        : stageParam === 'triage' ? 'Triage Room' : 'Please proceed'
                      }
                    </div>
                  </div>
                </NowServingCard>
              </Col>
            ))}
          </Row>
        ) : (
          <EmptyState>No patients being served currently</EmptyState>
        )}
      </NowServingSection>

      {/* Waiting Queue */}
      <WaitingSection>
        <div className="section-title">⏳ Waiting ({waitingItems.length})</div>
        {waitingItems.length > 0 ? (
          <WaitingGrid>
            {waitingItems.slice(0, 20).map((item) => (
              <WaitingCard key={item.id} priority={item.priority}>
                <div className="token">{item.tokenNumber}</div>
                <div className="priority-tag">{item.priority || 'Standard'}</div>
              </WaitingCard>
            ))}
          </WaitingGrid>
        ) : (
          <EmptyState>No patients waiting</EmptyState>
        )}
      </WaitingSection>
    </TVContainer>
  );
};

export default TVDisplay;
