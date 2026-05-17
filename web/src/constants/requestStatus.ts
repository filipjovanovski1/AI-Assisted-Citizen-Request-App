import type { RequestStatus } from '../types';

export const STATUS_COLORS: Record<RequestStatus, string> = {
  NEW: 'gold',
  IN_REVIEW: 'blue',
  ASSIGNED: 'cyan',
  IN_PROGRESS: 'purple',
  RESOLVED: 'green',
  CLOSED: 'default',
};

/** Hex equivalents used for CSS/SVG/Leaflet markers where antd preset names don't work. */
export const STATUS_HEX_COLORS: Record<RequestStatus, string> = {
  NEW: '#faad14',
  IN_REVIEW: '#1677ff',
  ASSIGNED: '#13c2c2',
  IN_PROGRESS: '#722ed1',
  RESOLVED: '#52c41a',
  CLOSED: '#8c8c8c',
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  NEW: 'New',
  IN_REVIEW: 'In Review',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const STATUS_OPTIONS: RequestStatus[] = [
  'NEW',
  'IN_REVIEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
];

export const STATUS_SELECT_OPTIONS = STATUS_OPTIONS.map((s) => ({
  value: s,
  label: STATUS_LABELS[s],
}));
