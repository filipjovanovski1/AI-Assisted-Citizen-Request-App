import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Switch, Typography, Card, Space, Alert, theme, Upload } from 'antd';
import { EnvironmentOutlined, RobotOutlined, UploadOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

import { citizenApi, uploadApi } from '../services/api';
import { geocodeAddress, reverseGeocode } from '../services/geocoding';
import { useAuth } from '../context/AuthContext';
import { toast, getApiError } from '../utils/toast';
import type { CreateRequestPayload } from '../types';
import { PageHeader } from '../components/PageHeader';
import { resolveRequestImageUrl } from '../utils/requestImages';

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

interface ReportIssueFormValues {
  title: string;
  description: string;
  address?: string;
  imageUrl?: string;
  anonymousSubmission?: boolean;
}

const LocationPicker: React.FC<{
  position: [number, number];
  onPick: (v: [number, number]) => void;
}> = ({ position, onPick }) => {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} icon={makeIcon()} /> : null;
};

const SyncMapView: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(position);
  }, [map, position]);

  return null;
};

export const ReportIssuePage: React.FC = () => {
  const [form] = Form.useForm<ReportIssueFormValues>();
  const [position, setPosition] = useState<[number, number]>([41.99646, 21.43141]); // Default center
  const [loading, setLoading] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [locationLookupMessage, setLocationLookupMessage] = useState<string | null>(null);
  const [isReverseLookupLoading, setIsReverseLookupLoading] = useState(false);
  const [isForwardLookupLoading, setIsForwardLookupLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const { token } = theme.useToken();
  const reverseLookupSequence = useRef(0);
  const forwardLookupSequence = useRef(0);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!loading) {return;}
    const interval = setInterval(() => {
      setAiStep((s) => (s + 1) % AI_STEPS.length);
    }, 700);
    return () => clearInterval(interval);
  }, [loading]);

  const handleMapSelection = async (nextPosition: [number, number]) => {
    setPosition(nextPosition);
    setLocationLookupMessage(null);
    setIsReverseLookupLoading(true);

    const requestId = reverseLookupSequence.current + 1;
    reverseLookupSequence.current = requestId;

    try {
      const resolvedAddress = await reverseGeocode(nextPosition[0], nextPosition[1]);
      if (reverseLookupSequence.current !== requestId) {
        return;
      }

      if (resolvedAddress) {
        form.setFieldValue('address', resolvedAddress);
        setLocationLookupMessage('Address auto-filled from the selected map location.');
      } else {
        setLocationLookupMessage('Location updated, but no nearby address was found.');
      }
    } catch {
      if (reverseLookupSequence.current === requestId) {
        setLocationLookupMessage('Location updated, but the address lookup failed.');
      }
    } finally {
      if (reverseLookupSequence.current === requestId) {
        setIsReverseLookupLoading(false);
      }
    }
  };

  const handleAddressBlur = async () => {
    const nextAddress = form.getFieldValue('address')?.trim();
    if (!nextAddress) {
      return;
    }

    setLocationLookupMessage(null);
    setIsForwardLookupLoading(true);

    const requestId = forwardLookupSequence.current + 1;
    forwardLookupSequence.current = requestId;

    try {
      const resolvedLocation = await geocodeAddress(nextAddress);
      if (forwardLookupSequence.current !== requestId) {
        return;
      }

      if (resolvedLocation) {
        setPosition([resolvedLocation.lat, resolvedLocation.lng]);
        if (resolvedLocation.displayName) {
          form.setFieldValue('address', resolvedLocation.displayName);
        }
        setLocationLookupMessage('Map pin updated from the typed address.');
      } else {
        setLocationLookupMessage('Address not found on the map. Please refine it and try again.');
      }
    } catch {
      if (forwardLookupSequence.current === requestId) {
        setLocationLookupMessage('Address lookup failed. Please try again in a moment.');
      }
    } finally {
      if (forwardLookupSequence.current === requestId) {
        setIsForwardLookupLoading(false);
      }
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsImageUploading(true);
    try {
      const uploaded = await uploadApi.uploadRequestImage(file);
      form.setFieldValue('imageUrl', uploaded.imageUrl);
      setUploadedImageUrl(uploaded.imageUrl);
      toast.success('Image uploaded successfully.');
    } catch (err) {
      toast.error(getApiError(err, 'Failed to upload image.'));
    } finally {
      setIsImageUploading(false);
    }
    return false;
  };

  const onFinish = async (values: ReportIssueFormValues) => {
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
      imageUrl: values.imageUrl,
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
        <Form form={form} layout="vertical" onFinish={onFinish}>
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
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <LocationPicker position={position} onPick={handleMapSelection} />
                <SyncMapView position={position} />
              </MapContainer>
            </div>
            <Text type="secondary">
              <EnvironmentOutlined /> Lat: {position[0].toFixed(5)}, Lng: {position[1].toFixed(5)}
            </Text>
            {isReverseLookupLoading && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">Looking up the nearest address for this pin...</Text>
              </div>
            )}
          </Form.Item>

          <Form.Item name="address" label="Street Address (Optional)">
            <Input
              placeholder="Nearest street address or landmark"
              onBlur={handleAddressBlur}
            />
          </Form.Item>
          <Form.Item name="imageUrl" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="Photo (Optional)">
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Upload
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                maxCount={1}
                showUploadList={false}
                beforeUpload={handleImageUpload}
              >
                <Button icon={<UploadOutlined />} loading={isImageUploading}>
                  {uploadedImageUrl ? 'Replace image' : 'Upload image'}
                </Button>
              </Upload>
              <img
                src={resolveRequestImageUrl(uploadedImageUrl || undefined)}
                alt="Request preview"
                style={{
                  width: '100%',
                  maxWidth: 360,
                  height: 220,
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  background: token.colorBgElevated,
                }}
              />
            </Space>
          </Form.Item>
          {(isForwardLookupLoading || locationLookupMessage) && (
            <div style={{ marginTop: -12, marginBottom: 16 }}>
              <Text type="secondary">
                {isForwardLookupLoading
                  ? 'Finding this address on the map...'
                  : locationLookupMessage}
              </Text>
            </div>
          )}

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
