import React, { useRef, useState } from 'react';
import { Alert, Button, Card, Space, Typography } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';

import { useAuth } from '../context/AuthContext';
import { toast, getApiError } from '../utils/toast';
import { staffExportApi } from '../services/api';
import { PageHeader } from '../components/PageHeader';

const { Text, Paragraph } = Typography;

export const StaffImportExportPage: React.FC = () => {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  if (user?.role !== 'MUNICIPAL_EMPLOYEE') {
    return <Alert type="warning" message="Department access only." />;
  }

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await staffExportApi.exportDepartmentRequests(user.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `department-requests-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded.');
    } catch (err) {
      toast.error(getApiError(err, 'Export failed.'));
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    e.target.value = '';
    setImporting(true);
    try {
      const result = await staffExportApi.importRequests(user.id, file);
      if (result.failed === 0) {
        toast.success(`Imported ${result.imported} request(s) successfully.`);
      } else {
        toast.warning(
          `Imported ${result.imported} of ${result.totalRows} rows. ${result.failed} failed.`,
        );
      }
    } catch (err) {
      toast.error(getApiError(err, 'Import failed. Please check the file format.'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="Import / Export"
        subtitle="Manage department request data via CSV files."
      />

      <Card title="Export Department Requests">
        <Paragraph>
          <Text type="secondary">
            Download all requests assigned to your department as a CSV file. The file can be
            re-imported later to create new requests.
          </Text>
        </Paragraph>
        <Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>
          Export CSV
        </Button>
      </Card>

      <Card title="Import Requests">
        <Paragraph>
          <Text type="secondary">
            Upload a CSV file to create new requests assigned to your department. Accepted formats:
            a bulk export CSV (multiple rows) or a single-request detail export from any user.
          </Text>
        </Paragraph>
        <input
          ref={importInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
        <Button
          icon={<UploadOutlined />}
          loading={importing}
          onClick={() => importInputRef.current?.click()}
        >
          Import CSV
        </Button>
      </Card>
    </Space>
  );
};
