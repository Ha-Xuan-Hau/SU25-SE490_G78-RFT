"use client";

import { useState, useRef, useEffect } from "react";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import {
  SearchOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  DownloadOutlined,
  PlusOutlined,
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
  Upload,
  Space,
  Tooltip,
  DatePicker,
  Card,
  Tag,
  Divider,
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

// Mock data for contracts
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
    status: "Đang thực hiện",
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
    status: "Đã tất toán",
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
    status: "Đang thực hiện",
  },
];

export default function ProviderManageContracts() {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const [urlFile, setUrlFile] = useState<string>("");
  const [form] = Form.useForm();
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [searchedColumn, setSearchedColumn] = useState<string>("");
  const searchInput = useRef<InputRef>(null);
  const router = useRouter();
  const [days, setDays] = useState<number>();
  const [filteredInfo, setFilteredInfo] = useState<Record<string, any>>({});
  const [contracts, setContracts] = useState<ContractData[]>(mockContracts);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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

  const getStatusTag = (status: string) => {
    switch (status) {
      case "Đang thực hiện":
        return (
          <Tag color="blue" icon={<MinusCircleOutlined />}>
            Đang thực hiện
          </Tag>
        );
      case "Đã tất toán":
        return (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Đã tất toán
          </Tag>
        );
      default:
        return (
          <Tag color="red" icon={<ExclamationCircleOutlined />}>
            Đã hủy
          </Tag>
        );
    }
  };

  const columns: ColumnType<ContractData>[] = [
    {
      title: "Hợp đồng",
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
      onFilter: (value, record: ContractData) => {
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
        { text: "Đang thực hiện", value: "Đang thực hiện" },
        { text: "Đã tất toán", value: "Đã tất toán" },
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
            {contract.status === "Đã tất toán" ? (
              <Button
                type="primary"
                size="small"
                disabled
                icon={<PlusCircleOutlined />}
              >
                Tất toán
              </Button>
            ) : (
              <Tooltip title="Tạo hợp đồng tất toán">
                <Button
                  type="primary"
                  size="small"
                  onClick={() => showModal(contract)}
                  icon={<PlusCircleOutlined />}
                >
                  Tất toán
                </Button>
              </Tooltip>
            )}
            <Tooltip title="Xem hợp đồng">
              <Button
                size="small"
                onClick={() => showModalView(contract)}
                icon={<EyeOutlined />}
              />
            </Tooltip>
          </Space>
          <Tooltip title="Tải file tất toán">
            <Button
              size="small"
              onClick={() => generateDocument(contract)}
              icon={<DownloadOutlined />}
              className="w-full"
            >
              Tải file
            </Button>
          </Tooltip>
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

            <div>
              <Form.Item
                label="Ảnh hợp đồng tất toán"
                name="images"
                rules={[
                  {
                    required: true,
                    message: "Hãy đăng ảnh tất toán hợp đồng lên!",
                  },
                ]}
              >
                <Upload
                  listType="picture-card"
                  maxCount={3}
                  beforeUpload={() => false}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                  </div>
                </Upload>
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
