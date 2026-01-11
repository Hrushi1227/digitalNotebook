import {
  CloseOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  DatePicker,
  Drawer,
  Empty,
  Input,
  List,
  Select,
  Tabs,
  Tag,
} from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectDocuments } from "../../store/documentsSlice";
import { selectMaterials } from "../../store/materialsSlice";
import { selectPayments } from "../../store/paymentsSlice";
import { selectWorkers } from "../../store/workersSlice";

const { RangePicker } = DatePicker;

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const workers = useSelector(selectWorkers);
  const materials = useSelector(selectMaterials);
  const payments = useSelector(selectPayments);
  const documents = useSelector(selectDocuments);
  const navigate = useNavigate();

  // Search logic
  const searchResults = useMemo(() => {
    const query = searchText.toLowerCase().trim();
    if (!query && !dateRange && !selectedCategory && !selectedWorker)
      return null;

    const results = {
      workers: [],
      materials: [],
      payments: [],
      documents: [],
    };

    // Search workers
    workers.forEach((worker) => {
      const matchesText =
        !query ||
        worker.name?.toLowerCase().includes(query) ||
        worker.phone?.includes(query) ||
        worker.role?.toLowerCase().includes(query) ||
        worker.address?.toLowerCase().includes(query);

      if (matchesText) {
        results.workers.push(worker);
      }
    });

    // Search materials
    materials.forEach((material) => {
      const matchesText =
        !query ||
        material.name?.toLowerCase().includes(query) ||
        material.vendor?.toLowerCase().includes(query) ||
        material.billNumber?.toLowerCase().includes(query) ||
        material.note?.toLowerCase().includes(query);

      const matchesCategory =
        !selectedCategory || material.category === selectedCategory;

      const matchesDate =
        !dateRange ||
        (dayjs(material.date).isAfter(dateRange[0]) &&
          dayjs(material.date).isBefore(dateRange[1]));

      if (matchesText && matchesCategory && matchesDate) {
        results.materials.push(material);
      }
    });

    // Search payments
    payments.forEach((payment) => {
      const matchesText =
        !query ||
        payment.workerName?.toLowerCase().includes(query) ||
        payment.note?.toLowerCase().includes(query) ||
        payment.amount?.toString().includes(query);

      const matchesWorker =
        !selectedWorker || payment.workerId === selectedWorker;

      const matchesDate =
        !dateRange ||
        (dayjs(payment.date).isAfter(dateRange[0]) &&
          dayjs(payment.date).isBefore(dateRange[1]));

      if (matchesText && matchesWorker && matchesDate) {
        results.payments.push(payment);
      }
    });

    // Search documents
    documents.forEach((doc) => {
      const matchesText =
        !query ||
        doc.name?.toLowerCase().includes(query) ||
        doc.fileType?.toLowerCase().includes(query);

      const matchesDate =
        !dateRange ||
        (dayjs(doc.uploadedAt).isAfter(dateRange[0]) &&
          dayjs(doc.uploadedAt).isBefore(dateRange[1]));

      if (matchesText && matchesDate) {
        results.documents.push(doc);
      }
    });

    return results;
  }, [
    searchText,
    dateRange,
    selectedCategory,
    selectedWorker,
    workers,
    materials,
    payments,
    documents,
  ]);

  const totalResults = searchResults
    ? searchResults.workers.length +
      searchResults.materials.length +
      searchResults.payments.length +
      searchResults.documents.length
    : 0;

  const clearFilters = () => {
    setDateRange(null);
    setSelectedCategory(null);
    setSelectedWorker(null);
  };

  const hasActiveFilters = dateRange || selectedCategory || selectedWorker;

  const materialCategories = [
    "Cement & Sand",
    "POP & Plaster",
    "Electrical",
    "Paint",
    "Wood & Furniture",
    "Plumbing",
    "Tiles & Flooring",
    "Hardware",
    "Other",
  ];

  const tabItems = [
    {
      key: "all",
      label: `All (${totalResults})`,
      children: (
        <div>
          {searchResults?.workers.length > 0 && (
            <>
              <div className="text-gray-500 text-sm mb-2 font-medium">
                Workers
              </div>
              <List
                dataSource={searchResults.workers}
                renderItem={(worker) => (
                  <List.Item
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      navigate(`/workers/${worker.id}`);
                      setOpen(false);
                    }}
                  >
                    <List.Item.Meta
                      title={worker.name}
                      description={
                        <div>
                          <Tag color="blue">{worker.role}</Tag>
                          <span className="text-gray-500">{worker.phone}</span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </>
          )}

          {searchResults?.materials.length > 0 && (
            <>
              <div className="text-gray-500 text-sm mb-2 mt-4 font-medium">
                Materials
              </div>
              <List
                dataSource={searchResults.materials}
                renderItem={(material) => (
                  <List.Item
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      navigate("/materials");
                      setOpen(false);
                    }}
                  >
                    <List.Item.Meta
                      title={material.name}
                      description={
                        <div>
                          <Tag color="green">₹{material.price}</Tag>
                          <Tag>{material.category}</Tag>
                          <span className="text-gray-500 ml-2">
                            {material.date}
                          </span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </>
          )}

          {searchResults?.payments.length > 0 && (
            <>
              <div className="text-gray-500 text-sm mb-2 mt-4 font-medium">
                Payments
              </div>
              <List
                dataSource={searchResults.payments}
                renderItem={(payment) => (
                  <List.Item
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      navigate("/payments");
                      setOpen(false);
                    }}
                  >
                    <List.Item.Meta
                      title={payment.workerName}
                      description={
                        <div>
                          <Tag color="red">₹{payment.amount}</Tag>
                          <span className="text-gray-500">{payment.date}</span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </>
          )}

          {searchResults?.documents.length > 0 && (
            <>
              <div className="text-gray-500 text-sm mb-2 mt-4 font-medium">
                Documents
              </div>
              <List
                dataSource={searchResults.documents}
                renderItem={(doc) => (
                  <List.Item
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      navigate("/documents");
                      setOpen(false);
                    }}
                  >
                    <List.Item.Meta
                      title={doc.name}
                      description={
                        <div>
                          <Tag color="purple">{doc.fileType}</Tag>
                          <span className="text-gray-500 ml-2">
                            {dayjs(doc.uploadedAt).format("MMM DD, YYYY")}
                          </span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </>
          )}

          {totalResults === 0 && searchText && (
            <Empty description="No results found" />
          )}
        </div>
      ),
    },
    {
      key: "workers",
      label: `Workers (${searchResults?.workers.length || 0})`,
      children: (
        <List
          dataSource={searchResults?.workers || []}
          locale={{ emptyText: "No workers found" }}
          renderItem={(worker) => (
            <List.Item
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => {
                navigate(`/workers/${worker.id}`);
                setOpen(false);
              }}
            >
              <List.Item.Meta
                title={worker.name}
                description={
                  <div>
                    <Tag color="blue">{worker.role}</Tag>
                    <span className="text-gray-500">{worker.phone}</span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: "materials",
      label: `Materials (${searchResults?.materials.length || 0})`,
      children: (
        <List
          dataSource={searchResults?.materials || []}
          locale={{ emptyText: "No materials found" }}
          renderItem={(material) => (
            <List.Item
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => {
                navigate("/materials");
                setOpen(false);
              }}
            >
              <List.Item.Meta
                title={material.name}
                description={
                  <div>
                    <Tag color="green">₹{material.price}</Tag>
                    <Tag>{material.category}</Tag>
                    <span className="text-gray-500 ml-2">{material.date}</span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: "payments",
      label: `Payments (${searchResults?.payments.length || 0})`,
      children: (
        <List
          dataSource={searchResults?.payments || []}
          locale={{ emptyText: "No payments found" }}
          renderItem={(payment) => (
            <List.Item
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => {
                navigate("/payments");
                setOpen(false);
              }}
            >
              <List.Item.Meta
                title={payment.workerName}
                description={
                  <div>
                    <Tag color="red">₹{payment.amount}</Tag>
                    <span className="text-gray-500">{payment.date}</span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: "documents",
      label: `Documents (${searchResults?.documents.length || 0})`,
      children: (
        <List
          dataSource={searchResults?.documents || []}
          locale={{ emptyText: "No documents found" }}
          renderItem={(doc) => (
            <List.Item
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => {
                navigate("/documents");
                setOpen(false);
              }}
            >
              <List.Item.Meta
                title={doc.name}
                description={
                  <div>
                    <Tag color="purple">{doc.fileType}</Tag>
                    <span className="text-gray-500 ml-2">
                      {dayjs(doc.uploadedAt).format("MMM DD, YYYY")}
                    </span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
  ];

  return (
    <>
      {/* Search Button */}
      <Button
        icon={<SearchOutlined />}
        onClick={() => setOpen(true)}
        size="large"
      >
        Search
      </Button>

      {/* Search Drawer */}
      <Drawer
        title="Search Everything"
        placement="right"
        onClose={() => {
          setOpen(false);
          setSearchText("");
          clearFilters();
          setShowFilters(false);
        }}
        open={open}
        width={window.innerWidth > 768 ? 600 : "100%"}
      >
        {/* Search Input */}
        <Input
          size="large"
          placeholder="Search workers, materials, payments, documents..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          autoFocus
        />

        {/* Filter Toggle */}
        <div className="mt-3 mb-3">
          <Badge dot={hasActiveFilters}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </Badge>
          {hasActiveFilters && (
            <Button type="link" onClick={clearFilters} icon={<CloseOutlined />}>
              Clear Filters
            </Button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded mb-4 space-y-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">Date Range</div>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                className="w-full"
              />
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">
                Material Category
              </div>
              <Select
                placeholder="Select category"
                value={selectedCategory}
                onChange={setSelectedCategory}
                allowClear
                className="w-full"
              >
                {materialCategories.map((cat) => (
                  <Select.Option key={cat} value={cat}>
                    {cat}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Worker</div>
              <Select
                placeholder="Select worker"
                value={selectedWorker}
                onChange={setSelectedWorker}
                allowClear
                className="w-full"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {workers.map((worker) => (
                  <Select.Option key={worker.id} value={worker.id}>
                    {worker.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mt-4">
          {searchText || hasActiveFilters ? (
            <Tabs items={tabItems} />
          ) : (
            <div className="text-center text-gray-400 mt-20">
              <SearchOutlined style={{ fontSize: 48 }} />
              <div className="mt-4">Start typing to search...</div>
              <div className="text-sm mt-2">
                Search across workers, materials, payments, and documents
              </div>
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
}
