import React from 'react';
import { Tag } from 'antd';
import type { RequestStatus } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../constants/requestStatus';

export const StatusTag: React.FC<{ status: RequestStatus }> = ({ status }) => (
  <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
);
