import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Empty,
  message,
  Modal,
  Space,
  Table,
  Tag,
  Upload,
} from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../components/common/PageHeader";
import ProtectedAction from "../components/common/ProtectedAction";
import { addItem, deleteItem } from "../firebaseService";
import {
  addDocument,
  deleteDocument,
  selectDocuments,
} from "../store/documentsSlice";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/octet-stream", // important for Excel
];

const getFileIcon = (mimeType) => {
  if (mimeType.startsWith("image/")) return <FileImageOutlined />;
  if (mimeType.includes("sheet") || mimeType.includes("excel"))
    return <FileExcelOutlined />;
  if (mimeType === "application/pdf") return <FilePdfOutlined />;
  if (
    mimeType === "application/msword" ||
    mimeType.includes("wordprocessingml")
  )
    return <FileWordOutlined />;
  return null;
};

const getFileType = (mimeType) => {
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType === "application/pdf") return "PDF";
  if (
    mimeType === "application/msword" ||
    mimeType.includes("wordprocessingml")
  )
    return "Word";
  if (
    mimeType.includes("sheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  )
    return "Excel";
  return "Document";
};

export default function Documents() {
  const documents = useSelector(selectDocuments);
  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const handleUpload = async (file) => {
    // Get MIME type, with fallback based on file extension
    let mimeType = file.type;
    const ext = file.name.split(".").pop()?.toLowerCase();

    // Handle missing or unreliable MIME types (common with Excel files)
    if (
      !mimeType ||
      mimeType === "" ||
      mimeType === "application/octet-stream"
    ) {
      const extMap = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        csv: "text/csv",
      };

      mimeType = extMap[ext] || mimeType;
    }

    if (!ALLOWED_TYPES.includes(mimeType)) {
      message.error(`File type not allowed. MIME: ${mimeType || "unknown"}`);
      console.warn("Unsupported file type:", {
        name: file.name,
        mimeType,
        ext,
      });
      return false;
    }

    setUploading(true);
    try {
      // Create data URL for preview
      const reader = new FileReader();
      const isExcel =
        mimeType.includes("sheet") ||
        mimeType.includes("excel") ||
        mimeType === "text/csv" ||
        ["xls", "xlsx", "csv"].includes(ext);

      reader.onload = async (e) => {
        let dataUrl = null;
        let previewHtml = null;

        if (isExcel) {
          const workbook = XLSX.read(e.target.result, { type: "binary" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          previewHtml = XLSX.utils.sheet_to_html(firstSheet);
        } else {
          dataUrl = e.target.result;
        }

        const docPayload = {
          name: file.name,
          type: mimeType,
          fileType: getFileType(mimeType),
          size: file.size,
          uploadedAt: new Date().toISOString(),
          dataUrl,
          previewHtml,
        };

        try {
          const res = await addItem("documents", docPayload);
          dispatch(addDocument({ id: res.id, ...docPayload }));
          message.success(`${file.name} uploaded successfully`);
        } catch (err) {
          message.error("Failed to upload document");
          console.error(err);
        }
      };

      if (isExcel) reader.readAsBinaryString(file);
      else reader.readAsDataURL(file);
    } catch (err) {
      message.error("Upload failed");
      console.error(err);
    } finally {
      setUploading(false);
    }

    return false; // Prevent default upload
  };

  const handlePreview = (doc) => {
    setPreviewDoc(doc);
    setPreviewOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteItem("documents", id);
      dispatch(deleteDocument(id));
      message.success("Document deleted");
    } catch (err) {
      message.error("Failed to delete document");
      console.error(err);
    }
  };

  const handleDownload = (doc) => {
    const link = document.createElement("a");
    link.href = doc.dataUrl;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: "File",
      dataIndex: "name",
      render: (name, record) => (
        <Space>
          {getFileIcon(record.type)}
          <span>{name}</span>
        </Space>
      ),
      width: 250,
    },
    {
      title: "Type",
      dataIndex: "fileType",
      render: (type) => <Tag>{type}</Tag>,
      width: 100,
    },
    {
      title: "Size",
      dataIndex: "size",
      render: (size) => `${(size / 1024).toFixed(2)} KB`,
      width: 120,
    },
    {
      title: "Uploaded",
      dataIndex: "uploadedAt",
      render: (date) => new Date(date).toLocaleDateString(),
      width: 130,
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          >
            Preview
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          >
            Download
          </Button>
          <ProtectedAction
            onAuthorized={() => {
              Modal.confirm({
                title: "Delete document?",
                onOk: () => handleDelete(record.id),
              });
            }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Delete
            </Button>
          </ProtectedAction>
        </Space>
      ),
      width: 280,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Documents"
        extra={`Total: ${documents.length} file(s)`}
      />

      <Card className="mb-6">
        <Upload
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.xls,.xlsx,.csv"
          beforeUpload={handleUpload}
          multiple={false}
          disabled={uploading}
        >
          <Button loading={uploading} size="large" type="primary">
            📤 Upload Document
          </Button>
        </Upload>
        <p className="text-gray-600 text-sm mt-2">
          Supported: PDF, Word (.doc/.docx), Images (.jpg/.png/.gif/.webp)
        </p>
        <p className="text-gray-600 text-sm mt-2">
          Supported: PDF, Word, Images, Excel (.xls/.xlsx/.csv)
        </p>
      </Card>

      <Card>
        {documents.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <Table
              rowKey="id"
              dataSource={documents}
              columns={columns}
              pagination={{ pageSize: 10 }}
              scroll={{ x: "max-content" }}
            />
          </div>
        ) : (
          <Empty description="No documents uploaded yet" />
        )}
      </Card>

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        title={previewDoc?.name}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={900}
        bodyStyle={{ maxHeight: "80vh", overflowY: "auto" }}
      >
        {previewDoc && (
          <div className="bg-gray-100 p-4 rounded">
            {previewDoc.fileType === "Excel" ? (
              <div
                dangerouslySetInnerHTML={{ __html: previewDoc.previewHtml }}
                style={{ overflowX: "auto", background: "white", padding: 10 }}
              />
            ) : previewDoc.fileType === "Image" ? (
              <img
                src={previewDoc.dataUrl}
                alt={previewDoc.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "600px",
                  margin: "0 auto",
                  display: "block",
                }}
              />
            ) : previewDoc.fileType === "PDF" ? (
              <iframe
                src={previewDoc.dataUrl}
                title={previewDoc.name}
                style={{
                  width: "100%",
                  height: "600px",
                  border: "none",
                  borderRadius: "4px",
                }}
              />
            ) : previewDoc.fileType === "Word" ? (
              <div className="bg-white p-4 rounded text-center">
                <p className="text-gray-600 mb-4">
                  Word document preview not available in browser. Download to
                  view.
                </p>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(previewDoc)}
                >
                  Download {previewDoc.name}
                </Button>
              </div>
            ) : (
              <div className="text-center text-gray-600">
                <p>Preview not available</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
