"use client";

import { useState, useRef } from "react";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import {
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  message,
  Button,
  Image,
  Input,
  Modal,
  Table,
  Space,
  Card,
  Tag,
  Tooltip,
} from "antd";
import type { InputRef } from "antd";
import type { ColumnType } from "antd/es/table";
import { Worker } from "@react-pdf-viewer/core";
import { Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import Highlighter from "react-highlight-words";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { saveAs } from "file-saver";

// Define TypeScript interfaces
interface FinalContractData {
  id: number;
  _id: string;
  bookingId: string;
  image: string[];
  createBy: string;
  bookBy: string;
  email: string;
  phone: string;
  address: string;
  numberCar: string;
  model: string;
  numberSeat: number;
  yearManufacture: number;
  timeBookingStart: string;
  timeBookingEnd: string;
  totalCost: number | string;
  status: string;
  file?: string;
}

// Mock data for contracts
const mockFinalContracts: FinalContractData[] = [
  {
    id: 1,
    _id: "finalcontract-001",
    bookingId: "booking-001",
    image: [
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
    ],
    createBy: "Provider User",
    bookBy: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0987654321",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    numberCar: "30A-12345",
    model: "Toyota Camry",
    numberSeat: 5,
    yearManufacture: 2021,
    timeBookingStart: "15-06-2023",
    timeBookingEnd: "18-06-2023",
    totalCost: "2,400,000 VNĐ",
    status: "Đã tất toán",
    file: "https://example.com/contract1.pdf",
  },
  {
    id: 2,
    _id: "finalcontract-002",
    bookingId: "booking-002",
    image: ["/placeholder.svg?height=200&width=300"],
    createBy: "Provider User",
    bookBy: "Trần Thị B",
    email: "tranthib@example.com",
    phone: "0901234567",
    address: "456 Đường DEF, Quận 2, TP.HCM",
    numberCar: "30A-54321",
    model: "Honda Civic",
    numberSeat: 4,
    yearManufacture: 2022,
    timeBookingStart: "18-06-2023",
    timeBookingEnd: "22-06-2023",
    totalCost: "2,800,000 VNĐ",
    status: "Đã tất toán",
    file: "https://example.com/contract2.pdf",
  },
  {
    id: 3,
    _id: "finalcontract-003",
    bookingId: "booking-003",
    image: [
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
    ],
    createBy: "Provider User",
    bookBy: "Lê Văn C",
    email: "levanc@example.com",
    phone: "0912345678",
    address: "789 Đường GHI, Quận 3, TP.HCM",
    numberCar: "30A-98765",
    model: "Ford Ranger",
    numberSeat: 7,
    yearManufacture: 2020,
    timeBookingStart: "22-06-2023",
    timeBookingEnd: "25-06-2023",
    totalCost: "2,100,000 VNĐ",
    status: "Đã tất toán",
    file: "https://example.com/contract3.pdf",
  },
];

export default function ProviderManageFinalContracts() {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const [urlFile, setUrlFile] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [searchedColumn, setSearchedColumn] = useState<string>("");
  const searchInput = useRef<InputRef>(null);
  const [filteredInfo, setFilteredInfo] = useState<Record<string, any>>({});

  // Use mock data
  const dataSource = mockFinalContracts;

  const handleChange = (pagination: any, filters: Record<string, any>) => {
    setFilteredInfo(filters);
  };

  const handleSearch = (
    selectedKeys: string[],
    confirm: () => void,
    dataIndex: string
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (
    dataIndex: keyof FinalContractData
  ): ColumnType<FinalContractData> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Tìm kiếm ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() =>
            handleSearch(selectedKeys as string[], confirm, dataIndex)
          }
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() =>
              handleSearch(selectedKeys as string[], confirm, dataIndex)
            }
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Tìm
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Xóa
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value: any, record: FinalContractData) => {
      const recordValue = record[dataIndex];
      return recordValue
        ? recordValue
            .toString()
            .toLowerCase()
            .includes((value as string).toLowerCase())
        : false;
    },
    onFilterDropdownOpenChange: (visible: boolean) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text: string) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const generateDocument = (contract: FinalContractData) => {
    message.success(`Đang tạo file hợp đồng tất toán cho ${contract.bookBy}`);
    setTimeout(() => {
      const blob = new Blob(["Dummy contract content"], {
        type: "application/octet-stream",
      });
      saveAs(
        blob,
        `Tat_toan_hop_dong_${contract.bookBy}_${contract.numberCar}.docx`
      );
    }, 1000);
  };

  const showModalView = (contract: FinalContractData) => {
    setIsModalOpen(true);
    setUrlFile(contract.file || "");
  };

  const handleOkView = () => {
    setIsModalOpen(false);
  };

  const handleCancelView = () => {
    setIsModalOpen(false);
  };

  const columns: ColumnType<FinalContractData>[] = [
    {
      title: "Hợp đồng tất toán",
      key: "contract",
      width: 280,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Image.PreviewGroup
            preview={{
              onChange: (current, prev) =>
                console.log(`current index: ${current}, prev index: ${prev}`),
            }}
            items={record.image}
          >
            <Image
              width={80}
              height={60}
              src={record.image[0] || "/placeholder.svg"}
              alt="Final Contract"
              className="rounded-md object-cover"
              fallback="/placeholder.svg?height=60&width=80"
            />
          </Image.PreviewGroup>
          <div>
            <div className="font-semibold">{record.numberCar}</div>
            <div className="text-sm text-gray-500">{record.model}</div>
            <div className="text-xs text-gray-400">
              {record.numberSeat} chỗ • {record.yearManufacture}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Khách hàng",
      key: "customer",
      width: 220,
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.bookBy}</div>
          <div className="text-sm text-gray-500">{record.phone}</div>
          <div className="text-xs text-gray-400">{record.email}</div>
          <div
            className="text-xs text-gray-400 truncate"
            title={record.address}
          >
            {record.address}
          </div>
        </div>
      ),
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
        close,
      }) => (
        <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
          <Input
            ref={searchInput}
            placeholder="Tìm khách hàng"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() =>
              handleSearch(selectedKeys as string[], confirm, "bookBy")
            }
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() =>
                handleSearch(selectedKeys as string[], confirm, "bookBy")
              }
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Tìm
            </Button>
            <Button
              onClick={() => clearFilters && handleReset(clearFilters)}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
      ),
      onFilter: (value, record: FinalContractData) => {
        return record.bookBy
          ? record.bookBy
              .toString()
              .toLowerCase()
              .includes((value as string).toLowerCase())
          : false;
      },
      onFilterDropdownOpenChange: (visible: boolean) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    {
      title: "Thời gian thuê",
      key: "time",
      width: 180,
      render: (_, record) => (
        <div>
          <div className="text-sm">
            <strong>Bắt đầu:</strong> {record.timeBookingStart}
          </div>
          <div className="text-sm">
            <strong>Kết thúc:</strong> {record.timeBookingEnd}
          </div>
        </div>
      ),
    },
    {
      title: "Số tiền kết toán",
      dataIndex: "totalCost",
      key: "totalCost",
      width: 140,
      render: (cost) => (
        <div className="font-semibold text-green-600">{cost}</div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color="green" className="px-2 py-1">
          {status}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right",
      width: 140,
      render: (_, contract) => (
        <Space direction="vertical" size="small">
          <Space size="small">
            <Tooltip title="Xem hợp đồng">
              <Button
                size="small"
                onClick={() => showModalView(contract)}
                icon={<EyeOutlined />}
              >
                Xem
              </Button>
            </Tooltip>
            <Tooltip title="Tải file hợp đồng">
              <Button
                size="small"
                type="primary"
                onClick={() => generateDocument(contract)}
                icon={<DownloadOutlined />}
              >
                Tải
              </Button>
            </Tooltip>
          </Space>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Tất toán hợp đồng</h1>
          <p className="text-gray-600">
            Quản lý các hợp đồng đã tất toán và tải file hợp đồng
          </p>
        </div>

        <Table
          onChange={handleChange}
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} mục`,
          }}
          size="middle"
        />
      </Card>

      {/* Modal for viewing PDF contract */}
      <Modal
        title="Xem hợp đồng tất toán"
        open={isModalOpen}
        onOk={handleOkView}
        footer={null}
        width={1000}
        onCancel={handleCancelView}
      >
        <div style={{ height: "750px" }}>
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            {urlFile ? (
              <Viewer
                fileUrl={urlFile}
                plugins={[defaultLayoutPluginInstance]}
              />
            ) : (
              <div className="flex justify-center items-center h-full text-gray-500">
                Không có file PDF để hiển thị
              </div>
            )}
          </Worker>
        </div>
      </Modal>
    </div>
  );
}

// Set layout for the component
ProviderManageFinalContracts.Layout = ProviderLayout;
