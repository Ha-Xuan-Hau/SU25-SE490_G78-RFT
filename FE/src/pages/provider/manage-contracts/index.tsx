"use client";

import { useState, useRef, useEffect } from "react";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import {
  SearchOutlined,
  PlusCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  DownloadOutlined,
  RollbackOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CarOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import {
  message,
  Button,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Table,
  Space,
  Tooltip,
  DatePicker,
  Card,
  Tag,
  Divider,
  Progress,
} from "antd";
import type { InputRef } from "antd";
import type { ColumnType } from "antd/es/table";
import { Worker } from "@react-pdf-viewer/core";
import { Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import Highlighter from "react-highlight-words";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { saveAs } from "file-saver";

// Define TypeScript interfaces
interface ContractData {
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
  cost: number;
  numberSeat: number;
  yearManufacture: number;
  timeBookingStart: string;
  timeBookingEnd: string;
  totalCost: string;
  totalCostNumber: number;
  file: string;
  status: string;
}

interface FormValues {
  _id: string;
  bookBy: string;
  phone: string;
  address: string;
  numberCar: string;
  timeBookingStart: string;
  timeBookingEnd: string;
  totalCost: string;
  totalCostNumber: number;
  cost: number;
  timeFinish?: dayjs.Dayjs;
  cost_settlement?: number;
  note?: string;
  images?: string[];
}

enum ContractStatus {
  CONFIRMED = "Đã xác nhận",
  DELIVERED = "Đã giao xe",
  RECEIVED = "Đã nhận xe",
  RENTING = "Đang thuê",
  RETURNED = "Đã trả xe",
  SETTLED = "Tất toán",
  CANCELED = "Đã hủy",
}

const mockContracts: ContractData[] = [
  {
    id: 1,
    _id: "contract1",
    bookingId: "booking1",
    image: [
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
    ],
    createBy: "Admin User",
    bookBy: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0987654321",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    numberCar: "30A-12345",
    model: "Toyota Camry",
    cost: 800000,
    numberSeat: 5,
    yearManufacture: 2021,
    timeBookingStart: "15-06-2023 08:00",
    timeBookingEnd: "20-06-2023 08:00",
    totalCost: "4,000,000 VNĐ",
    totalCostNumber: 4000000,
    file: "https://example.com/contract1.pdf",
    status: ContractStatus.RENTING,
  },
  {
    id: 2,
    _id: "contract2",
    bookingId: "booking2",
    image: ["/placeholder.svg?height=200&width=300"],
    createBy: "Staff User",
    bookBy: "Trần Thị B",
    email: "tranthib@example.com",
    phone: "0901234567",
    address: "456 Đường DEF, Quận 2, TP.HCM",
    numberCar: "30A-54321",
    model: "Honda Civic",
    cost: 700000,
    numberSeat: 4,
    yearManufacture: 2022,
    timeBookingStart: "18-06-2023 10:00",
    timeBookingEnd: "22-06-2023 10:00",
    totalCost: "2,800,000 VNĐ",
    totalCostNumber: 2800000,
    file: "https://example.com/contract2.pdf",
    status: ContractStatus.SETTLED,
  },
  {
    id: 3,
    _id: "contract3",
    bookingId: "booking3",
    image: [
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
    ],
    createBy: "Admin User",
    bookBy: "Lê Văn C",
    email: "levanc@example.com",
    phone: "0912345678",
    address: "789 Đường GHI, Quận 3, TP.HCM",
    numberCar: "30A-98765",
    model: "Ford Ranger",
    cost: 900000,
    numberSeat: 7,
    yearManufacture: 2020,
    timeBookingStart: "22-06-2023 09:00",
    timeBookingEnd: "25-06-2023 09:00",
    totalCost: "2,700,000 VNĐ",
    totalCostNumber: 2700000,
    file: "https://example.com/contract3.pdf",
    status: ContractStatus.CONFIRMED,
  },
  {
    id: 4,
    _id: "contract4",
    bookingId: "booking4",
    image: [
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
    ],
    createBy: "Admin User",
    bookBy: "Lê Văn C",
    email: "levanc@example.com",
    phone: "0912345678",
    address: "789 Đường GHI, Quận 3, TP.HCM",
    numberCar: "30A-98765",
    model: "Ford Ranger",
    cost: 900000,
    numberSeat: 7,
    yearManufacture: 2020,
    timeBookingStart: "22-06-2023 09:00",
    timeBookingEnd: "25-06-2023 09:00",
    totalCost: "2,700,000 VNĐ",
    totalCostNumber: 2700000,
    file: "https://example.com/contract3.pdf",
    status: ContractStatus.RETURNED,
  },
];

export default function ProviderManageContracts() {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const [urlFile, setUrlFile] = useState<string>("");
  const [form] = Form.useForm();
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [searchedColumn, setSearchedColumn] = useState<string>("");
  const searchInput = useRef<InputRef>(null);
  const router = useRouter();
  const [days, setDays] = useState<number>();
  const [filteredInfo, setFilteredInfo] = useState<Record<string, any>>({});
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Load contract data with loading state
  useEffect(() => {
    setLoading(true);
    // Simulate API call with timeout
    setTimeout(() => {
      setContracts(mockContracts);
      setLoading(false);
    }, 800);
  }, []);

  // Định nghĩa enum cho trạng thái hợp đồng
  enum ContractStatus {
    CONFIRMED = "Đã xác nhận",
    DELIVERED = "Đã giao xe",
    RECEIVED = "Đã nhận xe",
    RENTING = "Đang thuê",
    RETURNED = "Đã trả xe",
    SETTLED = "Tất toán",
    CANCELED = "Đã hủy",
  }

  // Cập nhật hàm getStatusTag
  const getStatusTag = (status: string) => {
    switch (status) {
      case ContractStatus.CONFIRMED:
        return (
          <Tag color="cyan" icon={<CheckCircleOutlined />}>
            Đã xác nhận
          </Tag>
        );
      case ContractStatus.DELIVERED:
        return (
          <Tag color="blue" icon={<CarOutlined />}>
            Đã giao xe
          </Tag>
        );
      case ContractStatus.RECEIVED:
        return (
          <Tag color="geekblue" icon={<UserOutlined />}>
            Đã nhận xe
          </Tag>
        );
      case ContractStatus.RENTING:
        return (
          <Tag color="purple" icon={<ClockCircleOutlined />}>
            Đang thuê
          </Tag>
        );
      case ContractStatus.RETURNED:
        return (
          <Tag color="orange" icon={<RollbackOutlined />}>
            Đã trả xe
          </Tag>
        );
      case ContractStatus.SETTLED:
        return (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Tất toán
          </Tag>
        );
      case ContractStatus.CANCELED:
        return (
          <Tag color="red" icon={<ExclamationCircleOutlined />}>
            Đã hủy
          </Tag>
        );
      default:
        return (
          <Tag color="default" icon={<QuestionCircleOutlined />}>
            {status}
          </Tag>
        );
    }
  };

  const handleChange = (pagination: any, filters: Record<string, any>) => {
    setFilteredInfo(filters);
  };

  const cancelContract = (contractId: string) => {
    setLoading(true);

    setTimeout(() => {
      setContracts((prevContracts) =>
        prevContracts.map((contract) =>
          contract._id === contractId
            ? { ...contract, status: ContractStatus.CANCELED }
            : contract
        )
      );

      message.success("Hợp đồng đã được hủy thành công");
      setLoading(false);
    }, 1000);
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

  function dateDiffInDays(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const timeDiff = Math.abs(date1.getTime() - date2.getTime());
    return Math.round(timeDiff / oneDay);
  }

  useEffect(() => {
    const newAmount =
      form.getFieldValue("totalCostNumber") -
      (form.getFieldValue("cost") * days! * 70) / 100;
    form.setFieldsValue({
      cost_settlement: newAmount || null,
    });
  }, [days, form]);

  const handleDays = (value: dayjs.Dayjs | null) => {
    if (!value) return;

    const startDate = new Date(value.format("YYYY-MM-DD"));
    const arrayDayEnd = form
      .getFieldValue("timeBookingEnd")
      .split(" ")[0]
      .split("-");
    const endDate = new Date(
      `${arrayDayEnd[1]}-${arrayDayEnd[0]}-${arrayDayEnd[2]}`
    );
    const totalDays = dateDiffInDays(endDate, startDate);
    setDays(totalDays);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText("");
  };

  // Hàm hiển thị nút thao tác tương ứng với trạng thái
  const renderActionButton = (contract: ContractData) => {
    switch (contract.status) {
      case ContractStatus.CONFIRMED:
        return (
          <div className="space-y-2">
            <Button
              type="primary"
              size="small"
              onClick={() =>
                updateContractStatus(contract._id, ContractStatus.DELIVERED)
              }
              className="w-full"
            >
              Xác nhận giao xe
            </Button>

            {/* Thêm nút hủy hợp đồng */}
            <Button
              danger
              size="small"
              onClick={() => {
                Modal.confirm({
                  title: "Xác nhận hủy hợp đồng",
                  content:
                    "Bạn có chắc chắn muốn hủy hợp đồng này không? Hành động này không thể hoàn tác.",
                  okText: "Đồng ý",
                  cancelText: "Hủy",
                  onOk: () => cancelContract(contract._id),
                });
              }}
              className="w-full"
            >
              Hủy hợp đồng
            </Button>
          </div>
        );

      case ContractStatus.DELIVERED:
        return (
          <Button
            type="primary"
            size="small"
            onClick={() =>
              updateContractStatus(contract._id, ContractStatus.RECEIVED)
            }
            className="w-full"
          >
            Xác nhận khách nhận xe
          </Button>
        );

      // Các case khác giữ nguyên như cũ
      case ContractStatus.RECEIVED:
        return (
          <Button
            type="primary"
            size="small"
            onClick={() =>
              updateContractStatus(contract._id, ContractStatus.RENTING)
            }
            className="w-full"
          >
            Bắt đầu thuê
          </Button>
        );

      case ContractStatus.RENTING:
        return (
          <Button
            type="primary"
            size="small"
            onClick={() =>
              updateContractStatus(contract._id, ContractStatus.RETURNED)
            }
            className="w-full"
          >
            Xác nhận trả xe
          </Button>
        );

      case ContractStatus.RETURNED:
        return (
          <Button
            type="primary"
            size="small"
            onClick={() => showModal(contract)}
            icon={<PlusCircleOutlined />}
            className="w-full"
          >
            Tất toán
          </Button>
        );

      // case ContractStatus.SETTLED:
      //   return (
      //     <Button size="small" disabled className="w-full">
      //       Đã tất toán
      //     </Button>
      //   );

      // case ContractStatus.CANCELED:
      //   return (
      //     <Button size="small" disabled className="w-full">
      //       Đã hủy
      //     </Button>
      //   );

      default:
        return null;
    }
  };

  // Hàm cập nhật trạng thái hợp đồng
  const updateContractStatus = (
    contractId: string,
    newStatus: ContractStatus
  ) => {
    setLoading(true);

    // Giả lập API call
    setTimeout(() => {
      setContracts((prevContracts) =>
        prevContracts.map((contract) =>
          contract._id === contractId
            ? { ...contract, status: newStatus }
            : contract
        )
      );

      message.success(`Cập nhật trạng thái hợp đồng thành ${newStatus}`);
      setLoading(false);
    }, 1000);
  };

  const getColumnSearchProps = (
    dataIndex: keyof ContractData
  ): ColumnType<ContractData> => ({
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
          placeholder={`Tìm ${dataIndex}`}
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
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value: any, record: ContractData) => {
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

  const generateDocument = (contract: ContractData) => {
    message.success(`Đang tạo file tất toán hợp đồng cho ${contract.bookBy}`);
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

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      setTimeout(() => {
        setContracts((prevContracts) =>
          prevContracts.map((contract) =>
            contract._id === values._id
              ? { ...contract, status: "Đã tất toán" }
              : contract
          )
        );
        message.success("Tạo hợp đồng tất toán thành công");
        setOpen(false);
        setLoading(false);
      }, 1500);
    } catch (error) {
      message.error("Lỗi khi tạo hợp đồng tất toán. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };

  const showModalView = (contract: ContractData) => {
    setIsModalOpen(true);
    setUrlFile(contract.file);
  };

  const handleOkView = () => {
    setIsModalOpen(false);
  };

  const handleCancelView = () => {
    setIsModalOpen(false);
  };

  const showModal = (contract: ContractData) => {
    if (contract.status !== ContractStatus.RETURNED) {
      message.warning("Chỉ có thể tất toán hợp đồng khi xe đã được trả");
      return;
    }

    setOpen(true);
    form.setFieldsValue({
      ...contract,
    });
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const disabledDate = (current: dayjs.Dayjs) => {
    if (
      !form.getFieldValue("timeBookingEnd") ||
      !form.getFieldValue("timeBookingStart")
    )
      return false;

    const arrayDayEnd = form
      .getFieldValue("timeBookingEnd")
      .split(" ")[0]
      .split("-");
    const dEnd = new Date(
      `${arrayDayEnd[1]}-${arrayDayEnd[0]}-${arrayDayEnd[2]}`
    );
    dEnd.setDate(dEnd.getDate() + 1);

    const arrayDayStart = form
      .getFieldValue("timeBookingStart")
      .split(" ")[0]
      .split("-");
    const dStart = new Date(
      `${arrayDayStart[1]}-${arrayDayStart[0]}-${arrayDayStart[2]}`
    );

    return current < dayjs(dStart) || current > dayjs(dEnd);
  };

  // Hàm tính phần trăm tiến độ của hợp đồng - tính toán động
  const getContractProgressPercent = (status: string): number => {
    const totalSteps = 6; // Tổng số bước

    // Bước hiện tại dựa trên trạng thái
    let currentStep = 0;

    switch (status) {
      case ContractStatus.CONFIRMED:
        currentStep = 1;
        break;
      case ContractStatus.DELIVERED:
        currentStep = 2;
        break;
      case ContractStatus.RECEIVED:
        currentStep = 3;
        break;
      case ContractStatus.RENTING:
        currentStep = 4;
        break;
      case ContractStatus.RETURNED:
        currentStep = 5;
        break;
      case ContractStatus.SETTLED:
        currentStep = 6;
        break;
      case ContractStatus.CANCELED:
        return 100;
      default:
        return 0;
    }

    // Tính phần trăm dựa trên bước hiện tại
    return (currentStep / totalSteps) * 100;
  };

  // Hàm lấy text hiển thị tiến độ
  const getContractProgressText = (status: string): string => {
    switch (status) {
      case ContractStatus.CONFIRMED:
        return "1/6: Chờ giao xe";
      case ContractStatus.DELIVERED:
        return "2/6: Chờ khách nhận xe";
      case ContractStatus.RECEIVED:
        return "3/6: Chuẩn bị bắt đầu thuê";
      case ContractStatus.RENTING:
        return "4/6: Đang trong quá trình thuê";
      case ContractStatus.RETURNED:
        return "5/6: Chờ tất toán";
      case ContractStatus.SETTLED:
        return "6/6: Đã hoàn thành";
      case ContractStatus.CANCELED:
        return "Hợp đồng đã hủy";
      default:
        return "Chưa xác định";
    }
  };

  const columns: ColumnType<ContractData>[] = [
    // Thêm vào phần render của cột hợp đồng
    {
      title: "Hợp đồng",
      key: "contract",
      width: 280,
      ...getColumnSearchProps("numberCar"),
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
              alt="Contract"
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

            {/* Hiển thị tiến trình của hợp đồng */}
            <div className="mt-1">
              <Progress
                percent={getContractProgressPercent(record.status)}
                size="small"
                showInfo={false}
              />
              {/* <div className="text-xs text-gray-500 mt-1">
                {getContractProgressText(record.status)}
              </div> */}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Khách hàng",
      key: "customer",
      width: 220,
      ...getColumnSearchProps("bookBy"),
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
      title: "Tổng tiền",
      dataIndex: "totalCost",
      key: "totalCost",
      width: 120,
      render: (cost) => (
        <div className="font-semibold text-green-600">{cost}</div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      filters: [
        { text: "Đã xác nhận", value: ContractStatus.CONFIRMED },
        { text: "Đã giao xe", value: ContractStatus.DELIVERED },
        { text: "Đã nhận xe", value: ContractStatus.RECEIVED },
        { text: "Đang thuê", value: ContractStatus.RENTING },
        { text: "Đã trả xe", value: ContractStatus.RETURNED },
        { text: "Tất toán", value: ContractStatus.SETTLED },
        { text: "Đã hủy", value: ContractStatus.CANCELED },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right",
      width: 140,
      render: (_, contract) => (
        <Space direction="vertical" size="small">
          <Space size="small">
            {/* Thao tác xem hợp đồng luôn hiển thị */}
            <Tooltip title="Xem hợp đồng">
              <Button
                size="small"
                onClick={() => showModalView(contract)}
                icon={<EyeOutlined />}
              />
            </Tooltip>
            {contract.status !== ContractStatus.CANCELED && (
              <Tooltip title="Tải file hợp đồng">
                <Button
                  size="small"
                  onClick={() => generateDocument(contract)}
                  icon={<DownloadOutlined />}
                />
              </Tooltip>
            )}
          </Space>

          {/* Các nút chuyển trạng thái */}
          {renderActionButton(contract)}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Quản lý hợp đồng</h1>
          <p className="text-gray-600">
            Quản lý các hợp đồng thuê xe và tạo hợp đồng tất toán
          </p>
        </div>

        <Table
          onChange={handleChange}
          columns={columns}
          dataSource={contracts}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} mục`,
          }}
          size="middle"
          locale={{
            emptyText: loading ? "Đang tải dữ liệu..." : "Không có dữ liệu",
          }}
        />
      </Card>

      {/* Modal for creating settlement contract */}
      <Modal
        title="Tất toán hợp đồng"
        open={open}
        footer={null}
        width={900}
        onCancel={handleCancel}
        destroyOnClose
      >
        <Form
          form={form}
          onFinish={onSubmit}
          layout="vertical"
          className="mt-6"
        >
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Tên khách hàng" name="bookBy">
                  <Input readOnly />
                </Form.Item>
                <Form.Item label="Số điện thoại" name="phone">
                  <Input readOnly />
                </Form.Item>
                <Form.Item label="Biển số xe" name="numberCar">
                  <Input readOnly />
                </Form.Item>
                <Form.Item label="Tổng giá tiền thuê" name="totalCost">
                  <Input readOnly />
                </Form.Item>
                <Form.Item
                  label="Thời gian bắt đầu thuê"
                  name="timeBookingStart"
                >
                  <Input readOnly />
                </Form.Item>
                <Form.Item
                  label="Thời gian kết thúc thuê"
                  name="timeBookingEnd"
                >
                  <Input readOnly />
                </Form.Item>
              </div>

              <Form.Item label="Địa chỉ" name="address">
                <Input.TextArea readOnly rows={2} />
              </Form.Item>

              <Divider>Thông tin tất toán</Divider>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Thời gian trả xe thực tế" name="timeFinish">
                  <DatePicker
                    format="DD-MM-YYYY"
                    disabledDate={disabledDate}
                    onChange={handleDays}
                    className="w-full"
                    placeholder="Chọn ngày trả xe"
                  />
                </Form.Item>
                <Form.Item
                  label="Giá trị kết toán hợp đồng"
                  name="cost_settlement"
                >
                  <InputNumber
                    readOnly
                    formatter={(value) =>
                      `${value} VNĐ`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value!.replace(/VNĐ\s?|(,*)/g, "")}
                    className="w-full"
                    placeholder="Tự động tính toán"
                  />
                </Form.Item>
              </div>

              <Form.Item label="Ghi chú" name="note">
                <Input.TextArea rows={3} placeholder="Nhập ghi chú (nếu có)" />
              </Form.Item>

              {/* Hidden fields */}
              <Form.Item hidden name="_id">
                <Input />
              </Form.Item>
              <Form.Item hidden name="cost">
                <Input />
              </Form.Item>
              <Form.Item hidden name="totalCostNumber">
                <Input />
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Xác nhận tất toán
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal for viewing PDF contract */}
      <Modal
        title="Xem hợp đồng"
        open={isModalOpen}
        onOk={handleOkView}
        onCancel={handleCancelView}
        width={1000}
        footer={null}
      >
        <div style={{ height: "750px" }}>
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            {urlFile ? (
              <Viewer
                fileUrl={urlFile}
                plugins={[defaultLayoutPluginInstance]}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Không có file để hiển thị
              </div>
            )}
          </Worker>
        </div>
      </Modal>
    </div>
  );
}

// Set layout for the component
ProviderManageContracts.Layout = ProviderLayout;
