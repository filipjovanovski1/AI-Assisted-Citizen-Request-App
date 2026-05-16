import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Switch, Typography, Card, Space, Alert, theme } from 'antd';
import { EnvironmentOutlined, RobotOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

import { citizenApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast, getApiError } from '../utils/toast';
import type { CreateRequestPayload } from '../types';
import { PageHeader } from '../components/PageHeader';

const { Text } = Typography;
const { TextArea } = Input;

const AI_STEPS = [
  'Reading your report...',
  'Analyzing issue type...',
  'Identifying keywords...',
  'Matching against departments...',
  'Calculating confidence...',
  'Routing to the right team...',
];

const makeIcon = () =>
  L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#58a6ff;border:3px solid #0d1117;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const LocationPicker: React.FC<{
  position: [number, number];
  setPosition: (v: [number, number]) => void;
}> = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} icon={makeIcon()} /> : null;
};

export const ReportIssuePage: React.FC = () => {
  const [position, setPosition] = useState<[number, number]>([41.99646, 21.43141]); // Default center
  const [loading, setLoading] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { token } = theme.useToken();

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!loading) {return;}
    const interval = setInterval(() => {
      setAiStep((s) => (s + 1) % AI_STEPS.length);
    }, 700);
    return () => clearInterval(interval);
  }, [loading]);

  const onFinish = async (values: any) => {
    if (!user) {
      setError('You must be logged in to report an issue.');
      return;
    }

    setAiStep(0);
    setLoading(true);
    setError(null);

    const payload: CreateRequestPayload = {
      title: values.title,
      description: values.description,
      address: values.address,
      latitude: position[0],
      longitude: position[1],
      anonymousSubmission: !!values.anonymousSubmission,
    };

    try {
      await citizenApi.createRequest(user.id, payload);
      toast.success('Issue reported successfully! AI is analyzing it now.');
      navigate('/my-reports');
    } catch (err) {
      setError(getApiError(err, 'Failed to submit the report.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <PageHeader
        title="Report a New Issue"
        subtitle="Provide details and select the location on the map. Our system will analyze your request and forward it to the responsible department."
      />

      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}

      <Card>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="title"
            label="Issue Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="e.g., Pothole on main street" size="large" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please describe the issue' }]}
          >
            <TextArea rows={4} placeholder="Please provide specific details about the issue..." />
          </Form.Item>

          <Form.Item label="Select Location on Map" required>
            <div style={{ paddingBottom: '8px' }}>
              <Text type="secondary">
                Click on the map to place the marker at the exact location.
              </Text>
            </div>
            <div
              style={{
                height: 350,
                width: '100%',
                marginBottom: 12,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
            <Text type="secondary">
              <EnvironmentOutlined /> Lat: {position[0].toFixed(5)}, Lng: {position[1].toFixed(5)}
            </Text>
          </Form.Item>

          <Form.Item name="address" label="Street Address (Optional)">
            <Input placeholder="Nearest street address or landmark" />
          </Form.Item>

          <Space style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Form.Item
              name="anonymousSubmission"
              label="Submit Anonymously"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Space>

          <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" size="large" loading={loading} block>
              Submit Report
            </Button>
            {loading && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 12,
                  color: token.colorTextSecondary,
                  fontSize: 13,
                }}
              >
                <RobotOutlined style={{ fontSize: 14 }} />
                <span>{AI_STEPS[aiStep]}</span>
              </div>
            )}
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
