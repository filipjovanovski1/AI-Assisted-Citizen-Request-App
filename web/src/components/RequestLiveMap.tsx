import React, { useEffect } from 'react';
import { Button, Empty, Spin, Typography, theme } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';

import type { RequestStatus, ServiceRequestDto } from '../types';
import { STATUS_HEX_COLORS, STATUS_LABELS } from '../constants/requestStatus';
import { ROUTES } from '../config/routes';

const { Text } = Typography;

const makeIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

const FitBounds: React.FC<{ requests: ServiceRequestDto[] }> = ({ requests }) => {
  const map = useMap();

  useEffect(() => {
    const points = requests.filter((request) => request.latitude && request.longitude);
    if (points.length > 0) {
      map.fitBounds(
        points.map((request) => [request.latitude!, request.longitude!] as [number, number]),
        { padding: [40, 40], maxZoom: 14 },
      );
    }
  }, [requests, map]);

  return null;
};

export interface RequestLiveMapProps {
  requests: ServiceRequestDto[];
  loading?: boolean;
  title?: string;
  height?: number;
}

export const RequestLiveMap: React.FC<RequestLiveMapProps> = ({
  requests,
  loading = false,
  title = 'Live Map',
  height = 500,
}) => {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const mappable = requests.filter((request) => request.latitude && request.longitude);

  return (
    <div
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <Text strong>{title}</Text>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {(Object.entries(STATUS_HEX_COLORS) as [RequestStatus, string][]).map(([status, color]) => (
            <span
              key={status}
              style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: color,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              {STATUS_LABELS[status]}
            </span>
          ))}
        </div>
      </div>

      <Spin spinning={loading}>
        {mappable.length === 0 ? (
          <div style={{ padding: 32 }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No geo-tagged requests match the current filters."
            />
          </div>
        ) : (
          <MapContainer
            center={[41.9961, 21.4314]}
            zoom={12}
            style={{ height, width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <FitBounds requests={mappable} />
            {mappable.map((request) => (
              <Marker
                key={request.id}
                position={[request.latitude!, request.longitude!]}
                icon={makeIcon(STATUS_HEX_COLORS[request.status])}
                eventHandlers={{ mouseover: (event) => event.target.openPopup() }}
              >
                <Popup>
                  <strong>{request.title}</strong>
                  <br />
                  <span style={{ color: STATUS_HEX_COLORS[request.status] }}>
                    {STATUS_LABELS[request.status]}
                  </span>
                  <br />
                  Comments: {request.commentCount} | Votes: {request.voteCount}
                  {request.departmentName && (
                    <>
                      <br />
                      {request.departmentName}
                    </>
                  )}
                  <br />
                  <Button
                    type="link"
                    size="small"
                    icon={<LinkOutlined />}
                    style={{ padding: 0, marginTop: 6 }}
                    onClick={() => navigate(ROUTES.REQUEST(request.id))}
                  >
                    View details
                  </Button>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </Spin>
    </div>
  );
};
