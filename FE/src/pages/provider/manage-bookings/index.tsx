"use client";

import { useState, useRef, useEffect } from "react";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import {
  SearchOutlined,
  PlusCircleOutlined,
  UploadOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
  DownloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  message,
  Button,
  Form,
  Image,
  Input,
  type InputRef,
  Modal,
  Popconfirm,
  Table,
  Upload,
  Space,
  Tooltip,
  Card,
  Tag,
  Tabs,
  Spin,
} from "antd";
import type { UploadProps } from "antd";
import type { ColumnType } from "antd/es/table";
import Highlighter from "react-highlight-words";
import { saveAs } from "file-saver";

// Define TypeScript interfaces
interface BookingData {
  id: number;
  _id: string;
  thumb: string;
  numberCar: string;
  model: string;
  numberSeat: number;
  yearManufacture: number;
  fullname: string;
  phone: string;
  address: string;
  totalCost: string;
  timeBookingStart: string;
  timeBookingEnd: string;
  codeTransaction: string;
  timeTransaction: string;
  status: string;
}

interface FormValues {
  _id: string;
  fullname: string;
  phone: string;
  address: string;
  numberCar: string;
  timeBookingStart: string;
  timeBookingEnd: string;
  totalCost: string;
  images: string[];
}

// Mock data for bookings
const mockBookings: BookingData[] = [
  {
    id: 1,
    _id: "booking1",
    thumb: "Xe 1",
    numberCar: "30A-12345",
    model: "Toyota Camry",
    numberSeat: 5,
    yearManufacture: 2021,
    fullname: "Nguyễn Văn A",
    phone: "0987654321",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    totalCost: "2,500,000 VNĐ",
    timeBookingStart: "15-06-2023 08:00",
    timeBookingEnd: "17-06-2023 08:00",
    codeTransaction: "TX123456",
    timeTransaction: "14-06-2023 10:30",
    status: "Chưa có hợp đồng",
  },
  {
    id: 2,
    _id: "booking2",
    thumb: "Xe 2",
    numberCar: "30A-54321",
    model: "Honda Civic",
    numberSeat: 4,
    yearManufacture: 2022,
    fullname: "Trần Thị B",
    phone: "0901234567",
    address: "456 Đường DEF, Quận 2, TP.HCM",
    totalCost: "3,200,000 VNĐ",
    timeBookingStart: "20-06-2023 09:00",
    timeBookingEnd: "23-06-2023 09:00",
    codeTransaction: "TX789012",
    timeTransaction: "19-06-2023 14:15",
    status: "Đã có hợp đồng",
  },
  {
    id: 3,
    _id: "booking3",
    thumb: "Xe 3",
    numberCar: "30A-98765",
    model: "Ford Ranger",
    numberSeat: 7,
    yearManufacture: 2020,
    fullname: "Lê Văn C",
    phone: "0912345678",
    address: "789 Đường GHI, Quận 3, TP.HCM",
    totalCost: "4,100,000 VNĐ",
    timeBookingStart: "25-06-2023 10:00",
    timeBookingEnd: "30-06-2023 10:00",
    codeTransaction: "TX345678",
    timeTransaction: "24-06-2023 08:45",
    status: "Đã hủy",
  },
];

export default function ProviderManageBookings() {
  // States
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [fileScan, setFileScan] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [searchedColumn, setSearchedColumn] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const searchInput = useRef<InputRef>(null);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Load data with loading state
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, []);

  // Filter bookings based on active tab
  const filteredBookings = mockBookings.filter((booking) => {
    if (activeTab === "all") return true;
    return booking.status === activeTab;
  });

  const tabs = [
    { key: "all", label: "Tất cả" },
    { key: "Chưa có hợp đồng", label: "Chưa có hợp đồng" },
    { key: "Đã có hợp đồng", label: "Đã có hợp đồng" },
    { key: "Đã hủy", label: "Đã hủy" },
  ];

  // Upload props
  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        setFileScan(file);
        return false;
      }
      message.error("Hãy chọn file docx");
      return false;
    },
    maxCount: 1,
  };

  // Helper functions
  const showModalScanPDF = () => {
    setIsModalOpen(true);
  };

  const handleCancelScan = () => {
    setIsModalOpen(false);
  };

  const handleUpload = () => {
    if (!fileScan) return;

    setUploading(true);
    // Simulate API call with timeout
    setTimeout(() => {
      message.success("Đã chuyển đổi file thành công");
      setUploading(false);
      setIsModalOpen(false);
      setFileScan(null);
    }, 2000);
  };

  const showModal = (booking: BookingData) => {
    setOpen(true);
    form.setFieldsValue({ ...booking });
  };

  const handleCancel = () => {
    setOpen(false);
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

  // Generate document
  const generateDocument = (booking: BookingData) => {
    message.success(`Đã tạo hợp đồng cho ${booking.fullname}`);
    setTimeout(() => {
      const blob = new Blob(["Dummy contract content"], {
        type: "application/octet-stream",
      });
      saveAs(blob, `hop_dong_${booking.fullname}_${booking.numberCar}.docx`);
    }, 1000);
  };

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    console.log("Form values:", values);
    message.success("Hợp đồng đã được tạo thành công!");
    setOpen(false);
  };

  const cancelBooking = (bookingId: string) => {
    message.success(`Đã hủy đặt xe #${bookingId}`);
  };

  // Column search props
  const getColumnSearchProps = (
    dataIndex: keyof BookingData
  ): ColumnType<BookingData> => ({
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
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText((selectedKeys as string[])[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Lọc
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            Đóng
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record: BookingData) => {
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

  const getStatusTag = (status: string) => {
    switch (status) {
      case "Chưa có hợp đồng":
        return (
          <Tag color="red" icon={<MinusCircleOutlined />}>
            Chưa có hợp đồng
          </Tag>
        );
      case "Đã có hợp đồng":
        return (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Đã có hợp đồng
          </Tag>
        );
      case "Đã hủy":
        return (
          <Tag color="red" icon={<ExclamationCircleOutlined />}>
            Đã hủy
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns: ColumnType<BookingData>[] = [
    {
      title: "Thông tin xe",
      key: "vehicle",
      width: 250,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Image
            width={80}
            height={60}
            src={record.thumb || "/placeholder.svg"}
            alt={record.model}
            className="rounded-md object-cover"
            fallback="/placeholder.svg?height=60&width=80"
          />
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
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.fullname}</div>
          <div className="text-sm text-gray-500">{record.phone}</div>
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
              handleSearch(selectedKeys as string[], confirm, "fullname")
            }
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() =>
                handleSearch(selectedKeys as string[], confirm, "fullname")
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
      onFilter: (value, record: BookingData) => {
        return record.fullname
          ? record.fullname
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
      width: 150,
      filters: [
        { text: "Chưa có hợp đồng", value: "Chưa có hợp đồng" },
        { text: "Đã có hợp đồng", value: "Đã có hợp đồng" },
        { text: "Đã hủy", value: "Đã hủy" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right",
      width: 120,
      render: (_, booking) => {
        if (booking.status === "Đã hủy") {
          return (
            <div className="text-gray-400 text-sm italic">
              Không thể thao tác với đơn đã hủy
            </div>
          );
        }

        // Nếu đơn chưa hủy, hiển thị các thao tác phù hợp
        return (
          <Space direction="vertical" size="small">
            <Space size="small">
              {booking.status === "Đã có hợp đồng" ? (
                <Button
                  type="primary"
                  size="small"
                  disabled
                  icon={<PlusCircleOutlined />}
                >
                  Tạo HĐ
                </Button>
              ) : (
                <Tooltip title="Tạo hợp đồng">
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => showModal(booking)}
                    icon={<PlusCircleOutlined />}
                  >
                    Tạo HĐ
                  </Button>
                </Tooltip>
              )}

              {/* Tải file hợp đồng chỉ khả dụng cho đơn có hợp đồng */}
              {booking.status === "Đã có hợp đồng" && (
                <Tooltip title="Tải file hợp đồng">
                  <Button
                    size="small"
                    onClick={() => generateDocument(booking)}
                    icon={<DownloadOutlined />}
                  />
                </Tooltip>
              )}
            </Space>

            {/* Nút hủy thuê chỉ hiển thị cho đơn chưa hủy */}
            <Popconfirm
              title="Hủy đơn thuê?"
              okText="Hủy đơn"
              cancelText="Hủy bỏ"
              onConfirm={() => cancelBooking(booking._id)}
            >
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                className="w-full"
              >
                Hủy thuê
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <Card>
        {isMobile ? (
          <>
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
              className="mb-4 no-more-icon"
              tabBarGutter={4}
              size="small"
              tabBarStyle={{
                flexWrap: "wrap",
                overflow: "visible",
              }}
            >
              {tabs.map((tab) => (
                <Tabs.TabPane tab={tab.label} key={tab.key} />
              ))}
            </Tabs>

            {loading ? (
              <div className="text-center py-8">
                <Spin size="large" />
              </div>
            ) : filteredBookings.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredBookings.map((booking) => (
                  <Card key={booking.id} className="shadow-md">
                    <div className="flex items-center gap-4 mb-2">
                      <Image
                        width={80}
                        height={60}
                        src={booking.thumb || "/placeholder.svg"}
                        alt={booking.model}
                        className="rounded-md object-cover"
                        fallback="/placeholder.svg?height=60&width=80"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-lg">
                          {booking.numberCar}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.model}
                        </div>
                        <div className="text-xs text-gray-400">
                          {booking.numberSeat} chỗ • {booking.yearManufacture}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">{getStatusTag(booking.status)}</div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Khách hàng:
                        </span>
                        <span className="text-sm font-medium">
                          {booking.fullname}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Điện thoại:
                        </span>
                        <span className="text-sm">{booking.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Thời gian thuê:
                        </span>
                        <span className="text-sm">
                          {booking.timeBookingStart}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Kết thúc:</span>
                        <span className="text-sm">
                          {booking.timeBookingEnd}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Tổng tiền:
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          {booking.totalCost}
                        </span>
                      </div>
                    </div>

                    {booking.status !== "Đã hủy" && (
                      <div className="flex gap-2">
                        {booking.status !== "Đã có hợp đồng" && (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => showModal(booking)}
                            className="flex-1"
                          >
                            Tạo HĐ
                          </Button>
                        )}
                        {booking.status === "Đã có hợp đồng" && (
                          <Button
                            size="small"
                            onClick={() => generateDocument(booking)}
                            className="flex-1"
                          >
                            Tải HĐ
                          </Button>
                        )}
                        <Popconfirm
                          title="Hủy đơn thuê?"
                          okText="Hủy đơn"
                          cancelText="Hủy bỏ"
                          onConfirm={() => cancelBooking(booking._id)}
                        >
                          <Button danger size="small" className="flex-1">
                            Hủy thuê
                          </Button>
                        </Popconfirm>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Không có dữ liệu
              </div>
            )}
          </>
        ) : (
          <Table
            columns={columns}
            dataSource={mockBookings}
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
        )}
      </Card>

      {/* Modal for contract creation */}
      <Modal
        title="Tạo Hợp Đồng"
        open={open}
        footer={null}
        width={800}
        onCancel={handleCancel}
      >
        <Form
          form={form}
          onFinish={onSubmit}
          layout="vertical"
          className="mt-6"
        >
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Form.Item label="Tên khách hàng" name="fullname">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Số điện thoại" name="phone">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Địa chỉ" name="address">
                <Input.TextArea readOnly rows={2} />
              </Form.Item>
              <Form.Item label="Biển số xe" name="numberCar">
                <Input readOnly />
              </Form.Item>
            </div>

            <div>
              <Form.Item label="Thời gian bắt đầu thuê" name="timeBookingStart">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Thời gian kết thúc thuê" name="timeBookingEnd">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Tổng giá tiền thuê" name="totalCost">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Booking id" hidden name="_id">
                <Input readOnly />
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit">
              Xác nhận tạo hợp đồng
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal for PDF scanning */}
      <Modal
        title="Scan PDF"
        open={isModalOpen}
        onCancel={handleCancelScan}
        footer={null}
      >
        <div className="py-4">
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>Chọn file</Button>
          </Upload>
          <Button
            type="primary"
            onClick={handleUpload}
            disabled={!fileScan}
            loading={uploading}
            style={{ marginTop: 16 }}
          >
            {uploading ? "Đang quét..." : "Bắt đầu quét"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// Set layout for the component
ProviderManageBookings.Layout = ProviderLayout;
