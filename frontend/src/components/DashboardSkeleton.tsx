import React from 'react';
import { Card, Row, Col, Skeleton } from 'antd';
import styled from 'styled-components';

const SkeletonWrapper = styled.div`
  padding: 24px;
  background: #fff;
  min-height: 100vh;
`;

const StatSkeleton = styled(Card)`
  margin-bottom: 16px;
  .ant-skeleton-content {
    padding: 20px;
  }
`;

const DashboardSkeleton: React.FC = () => {
  return (
    <SkeletonWrapper>
      {/* Header Skeleton */}
      <Skeleton.Input style={{ width: 200, height: 32, marginBottom: 24 }} active />
      <Skeleton.Input style={{ width: 400, height: 16, marginBottom: 32 }} active />

      {/* Stats Cards Skeleton */}
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map((i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <StatSkeleton>
              <Skeleton.Input style={{ width: 100, height: 24 }} active />
              <Skeleton.Input style={{ width: 60, height: 16, marginTop: 8 }} active />
            </StatSkeleton>
          </Col>
        ))}
      </Row>

      {/* Content Cards Skeleton */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={16}>
          <Card>
            <Skeleton.Input style={{ width: 120, height: 20, marginBottom: 16 }} active />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <Skeleton.Input style={{ width: '100%', height: 16 }} active />
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Skeleton.Input style={{ width: 120, height: 20, marginBottom: 16 }} active />
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <Skeleton.Input style={{ width: '100%', height: 16 }} active />
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </SkeletonWrapper>
  );
};

export default DashboardSkeleton;
