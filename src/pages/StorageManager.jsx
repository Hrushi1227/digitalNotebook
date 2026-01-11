import {
  CloudOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Input,
  message,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { useEffect, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import {
  deleteStorageFile,
  getStorageStats,
  listStorageFiles,
} from "../firebaseService";

const { Option } = Select;

const StorageManager = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalSize: 0, fileCount: 0 });
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedRows, setSelectedRows] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewType, setPreviewType] = useState("");

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const fileList = await listStorageFiles();
      setFiles(fileList);
      const storageStats = await getStorageStats(fileList);
      setStats(storageStats);
    } catch (error) {
      message.error("Failed to load files");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file) => {
    Modal.confirm({
      title: "Delete File?",
      content: `Are you sure you want to delete "${file.name}"? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteStorageFile(file.fullPath, file.source, file.sourceId);
          message.success("File deleted successfully");
          loadFiles();
        } catch (error) {
          message.error("Failed to delete file");
          console.error(error);
        }
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) {
      message.warning("Please select files to delete");
      return;
    }

    Modal.confirm({
      title: `Delete ${selectedRows.length} Files?`,
      content:
        "Are you sure you want to delete the selected files? This action cannot be undone.",
      okText: "Delete All",
      okType: "danger",
      onOk: async () => {
        try {
          // Find file objects for selected rows
          const filesToDelete = files.filter((f) =>
            selectedRows.includes(f.fullPath)
          );

          await Promise.all(
            filesToDelete.map((file) =>
              deleteStorageFile(file.fullPath, file.source, file.sourceId)
            )
          );
          message.success(`${selectedRows.length} files deleted successfully`);
          setSelectedRows([]);
          loadFiles();
        } catch (error) {
          message.error("Failed to delete some files");
          console.error(error);
        }
      },
    });
  };

  const handlePreview = (file) => {
    setPreviewUrl(file.url);
    setPreviewType(file.contentType);
    setPreviewVisible(true);
  };

  const handleDownload = (file) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success("Download started");
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (contentType) => {
    if (contentType.startsWith("image/")) return <FileImageOutlined />;
    if (contentType === "application/pdf") return <FilePdfOutlined />;
    return <FileTextOutlined />;
  };

  const getFileTypeTag = (contentType) => {
    if (contentType.startsWith("image/")) return <Tag color="blue">Image</Tag>;
    if (contentType === "application/pdf") return <Tag color="red">PDF</Tag>;
    if (contentType.startsWith("application/"))
      return <Tag color="green">Document</Tag>;
    return <Tag>File</Tag>;
  };

  // Filter files
  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchText.toLowerCase()) ||
      file.folder.toLowerCase().includes(searchText.toLowerCase());

    const matchesType =
      filterType === "all" ||
      (filterType === "images" && file.contentType.startsWith("image/")) ||
      (filterType === "pdfs" && file.contentType === "application/pdf") ||
      (filterType === "documents" &&
        file.contentType.startsWith("application/") &&
        file.contentType !== "application/pdf");

    return matchesSearch && matchesType;
  });

  const columns = [
    {
      title: "File Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Space>
          {getFileIcon(record.contentType)}
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "contentType",
      key: "type",
      render: (contentType) => getFileTypeTag(contentType),
      filters: [
        { text: "Images", value: "image/" },
        { text: "PDFs", value: "application/pdf" },
        { text: "Documents", value: "application/" },
      ],
      onFilter: (value, record) => record.contentType.startsWith(value),
    },
    {
      title: "Folder",
      dataIndex: "folder",
      key: "folder",
      sorter: (a, b) => a.folder.localeCompare(b.folder),
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      sorter: (a, b) => a.size - b.size,
      render: (size) => formatBytes(size),
    },
    {
      title: "Uploaded",
      dataIndex: "timeCreated",
      key: "timeCreated",
      sorter: (a, b) => new Date(a.timeCreated) - new Date(b.timeCreated),
      render: (date) => new Date(date).toLocaleDateString("en-IN"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {(record.contentType.startsWith("image/") ||
            record.contentType === "application/pdf") && (
            <Tooltip title="Preview">
              <Button
                icon={<EyeOutlined />}
                size="small"
                onClick={() => handlePreview(record)}
              />
            </Tooltip>
          )}
          <Tooltip title="Download">
            <Button
              icon={<DownloadOutlined />}
              size="small"
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const storageUsedPercent = (stats.totalSize / (5 * 1024 * 1024 * 1024)) * 100;

  return (
    <div>
      <PageHeader
        title="Storage Manager"
        subtitle="Manage Firebase Storage files and monitor usage"
      />

      {/* Storage Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Files"
              value={stats.fileCount}
              prefix={<CloudOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Storage Used"
              value={formatBytes(stats.totalSize)}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Free Storage"
              value={formatBytes(5 * 1024 * 1024 * 1024 - stats.totalSize)}
              valueStyle={{ color: "#52c41a", fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ marginBottom: 8 }}>
              <strong>Storage Usage</strong>
            </div>
            <Progress
              percent={parseFloat(storageUsedPercent.toFixed(2))}
              status={storageUsedPercent > 80 ? "exception" : "active"}
              strokeColor={
                storageUsedPercent > 80
                  ? "#ff4d4f"
                  : storageUsedPercent > 50
                  ? "#faad14"
                  : "#52c41a"
              }
            />
            <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 4 }}>
              {formatBytes(stats.totalSize)} / 5 GB
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search files or folders..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by type"
              value={filterType}
              onChange={setFilterType}
              style={{ width: "100%" }}
            >
              <Option value="all">All Files</Option>
              <Option value="images">Images Only</Option>
              <Option value="pdfs">PDFs Only</Option>
              <Option value="documents">Documents Only</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={10} style={{ textAlign: "right" }}>
            <Space>
              {selectedRows.length > 0 && (
                <Badge count={selectedRows.length}>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleBulkDelete}
                  >
                    Delete Selected
                  </Button>
                </Badge>
              )}
              <Button
                icon={<ReloadOutlined />}
                onClick={loadFiles}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Files Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredFiles}
          loading={loading}
          rowKey="fullPath"
          rowSelection={{
            selectedRowKeys: selectedRows,
            onChange: (selectedRowKeys) => setSelectedRows(selectedRowKeys),
          }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} files`,
            showSizeChanger: true,
          }}
          locale={{
            emptyText: (
              <Empty description="No files found. Upload files from Materials or Documents pages." />
            ),
          }}
        />
      </Card>

      {/* Preview Modal */}
      <Modal
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
        title="File Preview"
      >
        {previewType.startsWith("image/") ? (
          <img
            src={previewUrl}
            alt="Preview"
            style={{ width: "100%", maxHeight: "70vh", objectFit: "contain" }}
          />
        ) : previewType === "application/pdf" ? (
          <iframe
            src={previewUrl}
            style={{ width: "100%", height: "70vh", border: "none" }}
            title="PDF Preview"
          />
        ) : (
          <Empty description="Preview not available for this file type" />
        )}
      </Modal>
    </div>
  );
};

export default StorageManager;
