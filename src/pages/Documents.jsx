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
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as XLSX from "xlsx";
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

// Apply basic styling to Excel HTML preview
const styleExcelHtml = (html) =>
  `
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
    th { font-weight: 700; background: #f8fafc; }
    tr:nth-child(even) { background: #f9fafb; }
  </style>
  ${html}
`;

// Convert first sheet to headers + rows (array-of-objects) for Firestore-safe storage/render
const parseExcelSheet = (sheet, maxRows = 100) => {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
  if (!rows.length) return { headers: [], rows: [] };

  const headers = rows[0].map((cell, idx) =>
    cell && cell.toString().trim() !== ""
      ? cell.toString()
      : `Column ${idx + 1}`
  );

  const dataRows = rows.slice(1, maxRows + 1).map((row) => {
    const record = {};
    headers.forEach((_, idx) => {
      const val = row?.[idx];
      record[`col_${idx}`] =
        val === undefined || val === null ? "" : val.toString();
    });
    return record;
  });

  return { headers, rows: dataRows };
};

export default function Documents() {
  const documents = useSelector(selectDocuments);
  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [processingFiles, setProcessingFiles] = useState(new Set());

  // Cleanup processingFiles Set periodically to prevent memory leak
  useEffect(() => {
    const cleanup = setInterval(() => {
      setProcessingFiles((prev) => {
        // Keep only recent entries (last 100 files)
        if (prev.size > 100) {
          const entries = Array.from(prev);
          return new Set(entries.slice(-50));
        }
        return prev;
      });
    }, 60000); // Cleanup every minute

    return () => clearInterval(cleanup);
  }, []);

  // Clear previewDoc when modal closes
  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewDoc(null);
  };

  const handleUpload = async (file) => {
    // Prevent duplicate uploads - check if file is already being processed
    const fileKey = `${file.name}_${file.size}_${file.lastModified}`;
    if (processingFiles.has(fileKey)) {
      return false; // Already processing this file
    }

    // Check file size (Firebase Firestore has 1MB limit per document)
    // For Excel files, we store as base64 which increases size by ~33%
    const MAX_FILE_SIZE = 900 * 1024; // 900KB to be a bit more lenient
    if (file.size > MAX_FILE_SIZE) {
      message.error(
        `File too large: ${file.name}. Maximum size is ${(
          MAX_FILE_SIZE / 1024
        ).toFixed(0)}KB.`
      );
      return false;
    }

    // Mark file as being processed
    setProcessingFiles((prev) => new Set(prev).add(fileKey));

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
      message.error(`File type not allowed: ${file.name}`);
      console.warn("Unsupported file type:", {
        name: file.name,
        mimeType,
        ext,
      });
      return false;
    }

    // Increment upload counter for multiple file support
    setUploadingCount((prev) => prev + 1);
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
        let previewTableHeaders = [];
        let previewTableRows = [];

        if (isExcel) {
          try {
            const workbook = XLSX.read(e.target.result, { type: "binary" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            // We prefer AntD table preview; drop the bulky HTML to keep payload small
            previewHtml = null;
            const { headers, rows } = parseExcelSheet(firstSheet);
            previewTableHeaders = headers;
            previewTableRows = rows;
            // Store Excel file as base64 for download
            // Optimized binary string conversion
            const binaryString = e.target.result;
            const binary = Array.from(binaryString, (char) =>
              String.fromCharCode(char.charCodeAt(0) & 0xff)
            ).join("");
            dataUrl = `data:${mimeType};base64,${btoa(binary)}`;
          } catch (excelErr) {
            console.error("Error processing Excel file:", excelErr);
            message.error(`Failed to process Excel file: ${file.name}`);
            setProcessingFiles((prev) => {
              const next = new Set(prev);
              next.delete(fileKey);
              return next;
            });
            setUploadingCount((prev) => {
              const newCount = prev - 1;
              if (newCount === 0) setUploading(false);
              return newCount;
            });
            return;
          }
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
          previewTableHeaders,
          previewTableRows,
        };

        try {
          const res = await addItem("documents", docPayload);
          dispatch(addDocument({ id: res.id, ...docPayload }));
          message.success(`${file.name} uploaded successfully`);
        } catch (err) {
          const detail = err?.message || "Unknown error";
          message.error(`Failed to upload document: ${file.name} (${detail})`);
          console.error("Upload error details:", err);
          console.error("Payload size:", JSON.stringify(docPayload).length);
        } finally {
          // Remove file from processing set
          setProcessingFiles((prev) => {
            const next = new Set(prev);
            next.delete(fileKey);
            return next;
          });
          setUploadingCount((prev) => {
            const newCount = prev - 1;
            if (newCount === 0) setUploading(false);
            return newCount;
          });
        }
      };

      reader.onerror = () => {
        message.error(`Failed to read file: ${file.name}`);
        setProcessingFiles((prev) => {
          const next = new Set(prev);
          next.delete(fileKey);
          return next;
        });
        setUploadingCount((prev) => {
          const newCount = prev - 1;
          if (newCount === 0) setUploading(false);
          return newCount;
        });
      };

      if (isExcel) reader.readAsBinaryString(file);
      else reader.readAsDataURL(file);
    } catch (err) {
      message.error(`Upload failed: ${file.name}`);
      console.error(err);
      setProcessingFiles((prev) => {
        const next = new Set(prev);
        next.delete(fileKey);
        return next;
      });
      setUploadingCount((prev) => {
        const newCount = prev - 1;
        if (newCount === 0) setUploading(false);
        return newCount;
      });
    }

    return false; // Prevent default upload
  };

  const handlePreview = (doc) => {
    setPreviewDoc(doc);
    setPreviewOpen(true);
  };

  const renderExcelPreview = (doc) => {
    const headers = doc?.previewTableHeaders || [];
    const rows = doc?.previewTableRows || [];

    if (headers.length) {
      const columns = headers.map((header, idx) => {
        const title =
          header && header.toString().trim() !== ""
            ? header
            : `Column ${idx + 1}`;
        const key = `col_${idx}`;
        return { title, dataIndex: key, key };
      });

      const dataSource =
        rows?.map((row, rIdx) => {
          // Rows are stored as objects keyed by col_X
          return { key: rIdx, ...row };
        }) || [];

      return (
        <Table
          columns={columns}
          dataSource={dataSource}
          size="small"
          pagination={false}
          scroll={{ x: true, y: 400 }}
        />
      );
    }

    if (doc?.previewHtml) {
      return (
        <div
          dangerouslySetInnerHTML={{ __html: doc.previewHtml }}
          style={{ overflowX: "auto", background: "white", padding: 10 }}
        />
      );
    }

    return (
      <div className="text-center text-gray-600">
        <p>No preview available</p>
      </div>
    );
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
    if (!doc.dataUrl) {
      message.error("File data not available for download");
      return;
    }

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
          multiple={true}
          disabled={uploading}
        >
          <Button loading={uploading} size="large" type="primary">
            📤 Upload Documents
          </Button>
        </Upload>
        <p className="text-gray-600 text-sm mt-2">
          Supported: PDF, Word (.doc/.docx), Images (.jpg/.png/.gif/.webp),
          Excel (.xls/.xlsx/.csv)
        </p>
        <p className="text-gray-500 text-xs mt-1">
          You can select and upload multiple files at once
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
        onCancel={handlePreviewClose}
        footer={null}
        width={900}
        bodyStyle={{ maxHeight: "80vh", overflowY: "auto" }}
      >
        {previewDoc && (
          <div className="bg-gray-100 p-4 rounded">
            {previewDoc.fileType === "Excel" ? (
              renderExcelPreview(previewDoc)
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
