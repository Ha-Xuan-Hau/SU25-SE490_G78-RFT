"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import {
  useProviderState,
  getProviderIdFromState,
} from "@/recoils/provider.state";
import {
  getBookingsByProviderAndStatus,
  confirmBookingByProvider,
  cancelBookingByProvider,
} from "@/apis/booking.api";
import { showApiError, showApiSuccess } from "@/utils/toast.utils";
import {
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Table,
  Space,
  Tooltip,
  Card,
  Tag,
  Spin,
} from "antd";
import type { ColumnType } from "antd/es/table";

// Define TypeScript interfaces for Booking data
interface BookingData {
  id: string;
  userId: string;
  userName: string;
  vehicleId: string;
  vehicleLicensePlate: string;
  vehicleType: string;
  timeBookingStart: string | number[];
  timeBookingEnd: string | number[];
  phoneNumber: string;
  address: string;
  codeTransaction: string;
  timeTransaction: string | number[];
  totalCost: number;
  status: string;
  createdAt: string | number[];
  updatedAt: string | number[];
  // Vehicle information that comes from the backend
  vehicleBrand: string;
  vehicleModel: string;
  vehicleNumberSeat: number;
  vehicleYearManufacture: number;
  vehicleThumb: string;
  vehicleImage: string;
  vehicleProviderId: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  message?: string;
}

export default function ManagePendingBookings() {
  // States
  const [form] = Form.useForm();
  const [open, setOpen] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [actionLoading, setActionLoading] = useState<string>("");
  const [providerLoading, setProviderLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Ref to track if we've already fetched data for current provider
  const hasFetchedRef = useRef<string | null>(null);

  // Provider state
  const [provider] = useProviderState();

  // Debug provider state and handle loading timeout
  useEffect(() => {
    console.log("Provider state:", provider);
    // Set provider loading to false once we have determined the provider state
    if (provider !== null) {
      setProviderLoading(false);
    } else {
      // Check if we've waited long enough or if there's no token
      const token = localStorage.getItem("access_token");
      if (!token) {
        setProviderLoading(false);
      } else {
        // Set a timeout to stop loading after 5 seconds
        const timeout = setTimeout(() => {
          console.warn("Provider loading timeout");
          setProviderLoading(false);
        }, 5000);

        return () => clearTimeout(timeout);
      }
    }
  }, [provider]);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // API calls - Fetch pending bookings
  const fetchPendingBookings = useCallback(
    async (forceRefresh = false) => {
      try {
        const providerId = getProviderIdFromState(provider);
        console.log("Provider ID from state:", providerId);

        if (!providerId) {
          // Don't show error if provider is still loading
          if (!providerLoading) {
            showApiError("Vui lòng đăng nhập để xem danh sách đơn đặt xe");
          }
          return;
        }

        // Check if we've already fetched for this provider (unless forced refresh)
        if (!forceRefresh && hasFetchedRef.current === providerId) {
          console.log("Already fetched bookings for provider:", providerId);
          return;
        }

        setLoading(true);
        console.log("Fetching pending bookings for provider:", providerId);

        const result = (await getBookingsByProviderAndStatus(
          providerId,
          "PENDING"
        )) as ApiResponse<BookingData[]>;

        if (result.success) {
          setBookings(result.data || []);
          hasFetchedRef.current = providerId; // Mark as fetched for this provider
        } else {
          showApiError(result.error, "Không thể tải dữ liệu đơn đặt xe");
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        showApiError(error, "Có lỗi xảy ra khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    },
    [provider, providerLoading]
  );

  // Fetch bookings when provider is ready
  useEffect(() => {
    if (!providerLoading) {
      fetchPendingBookings();
    }
  }, [fetchPendingBookings, providerLoading]);

  // Show confirmation modal before accepting booking
  const showAcceptConfirmation = (booking: BookingData) => {
    setSelectedBooking(booking);
    setConfirmModalOpen(true);
  };

  // Handle confirmed acceptance
  const handleConfirmAccept = async () => {
    if (!selectedBooking) return;

    try {
      setActionLoading(selectedBooking.id);
      setConfirmModalOpen(false);

      // Use the confirm API endpoint
      const bookingResult = (await confirmBookingByProvider(
        selectedBooking.id
      )) as ApiResponse<unknown>;

      if (bookingResult.success) {
        showApiSuccess("Đã chấp nhận đơn đặt xe thành công!");
        // Refresh data
        fetchPendingBookings(true);
      } else {
        showApiError(bookingResult.error, "Không thể chấp nhận đơn đặt xe");
      }
    } catch (error) {
      console.error("Error confirming booking:", error);
      showApiError(error, "Có lỗi xảy ra khi chấp nhận đơn");
    } finally {
      setActionLoading("");
      setSelectedBooking(null);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);

      // Cancel booking
      const bookingResult = (await cancelBookingByProvider(
        bookingId
      )) as ApiResponse<unknown>;

      if (bookingResult.success) {
        showApiSuccess("Đã hủy đơn đặt xe thành công!");
        // Refresh data
        fetchPendingBookings(true);
      } else {
        showApiError(bookingResult.error, "Không thể hủy đơn đặt xe");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      showApiError(error, "Có lỗi xảy ra khi hủy đơn");
    } finally {
      setActionLoading("");
    }
  };

  const showModal = (booking: BookingData) => {
    setOpen(true);
    form.setFieldsValue({
      id: booking.id,
      userName: booking.userName,
      phoneNumber: booking.phoneNumber,
      address: booking.address,
      vehicleLicensePlate: booking.vehicleLicensePlate,
      timeBookingStart: formatDateTime(booking.timeBookingStart),
      timeBookingEnd: formatDateTime(booking.timeBookingEnd),
      totalCost: booking.totalCost.toLocaleString("vi-VN") + " VNĐ",
      codeTransaction: booking.codeTransaction,
      vehicleThumb: booking.vehicleThumb,
      vehicleImage: booking.vehicleImage,
    });
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDateTime = (dateValue: string | number[]) => {
    try {
      // Handle array format from backend: [year, month, day, hour, minute]
      if (Array.isArray(dateValue)) {
        const [year, month, day, hour, minute] = dateValue;
        // Month in JavaScript Date is 0-indexed, so subtract 1
        const date = new Date(year, month - 1, day, hour, minute || 0);
        return date.toLocaleString("vi-VN");
      }
      // Handle ISO string format (yyyy-MM-ddTHH:mm:ss)
      if (typeof dateValue === "string") {
        const date = new Date(dateValue);
        return date.toLocaleString("vi-VN");
      }
      return "Invalid date";
    } catch (error) {
      console.error("Error formatting date:", error, dateValue);
      return "Invalid date";
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Tag color="orange" icon={<MinusCircleOutlined />}>
            Chờ xác nhận
          </Tag>
        );
      case "CONFIRMED":
        return (
          <Tag color="blue" icon={<CheckCircleOutlined />}>
            Đã xác nhận
          </Tag>
        );
      case "CANCELLED":
        return (
          <Tag color="red" icon={<ExclamationCircleOutlined />}>
            Đã hủy
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPendingBookings(true);
    setTimeout(() => setRefreshing(false), 1000); // Stop refreshing after 1 second
  };

  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchText.toLowerCase();
    if (!searchLower.trim()) return true;

    return (
      booking.userName?.toLowerCase().includes(searchLower) ||
      booking.vehicleLicensePlate?.toLowerCase().includes(searchLower) ||
      booking.phoneNumber?.toLowerCase().includes(searchLower)
    );
  });

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
            src={record.vehicleImage || "/placeholder.svg"}
            alt={record.vehicleModel || "Vehicle"}
            className="rounded-md object-cover"
            fallback="/placeholder.svg?height=60&width=80"
          />
          <div>
            <div className="font-semibold">{record.id}</div>
            <div className="text-sm text-gray-500">
              {record.vehicleBrand} {record.vehicleLicensePlate}
            </div>
            <div className="text-xs text-gray-400">{record.vehicleThumb}</div>
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
          <div className="font-semibold">{record.userName}</div>
          <div className="text-sm text-gray-500">{record.phoneNumber}</div>
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
            <strong>Bắt đầu:</strong> {formatDateTime(record.timeBookingStart)}
          </div>
          <div className="text-sm">
            <strong>Kết thúc:</strong> {formatDateTime(record.timeBookingEnd)}
          </div>
        </div>
      ),
    },
    {
      title: "Tổng tiền",
      key: "totalCost",
      width: 120,
      render: (_, record) => (
        <div className="font-semibold text-green-600">
          {formatCurrency(record.totalCost)}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right",
      width: 120,
      render: (_, booking) => (
        <Tooltip title="Xem chi tiết">
          <Button
            size="small"
            onClick={() => showModal(booking)}
            icon={<SearchOutlined />}
          >
            Chi tiết
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Quản lý đơn đặt xe chờ xác nhận
            </h2>
            <p className="text-gray-600">
              Danh sách các đơn đặt xe đã thanh toán và đang chờ bạn xác nhận
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Input.Search
              placeholder="Tìm theo tên khách hàng hoặc biển số"
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
            <Tooltip title="Làm mới danh sách">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={refreshing}
              />
            </Tooltip>
          </div>
        </div>

        {providerLoading ? (
          <div className="text-center py-8">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">
              Đang kiểm tra thông tin đăng nhập...
            </p>
          </div>
        ) : !provider ? (
          <div className="text-center py-8">
            <div className="text-gray-500">
              <h3 className="text-lg font-semibold mb-2">Vui lòng đăng nhập</h3>
              <p>Bạn cần đăng nhập để xem danh sách đơn đặt xe</p>
            </div>
          </div>
        ) : isMobile ? (
          <>
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
                        src={booking.vehicleImage || "/placeholder.svg"}
                        alt={booking.vehicleModel || "Vehicle"}
                        className="rounded-md object-cover"
                        fallback="/placeholder.svg?height=60&width=80"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-lg">
                          {booking.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.vehicleBrand} {booking.vehicleLicensePlate}
                        </div>
                        <div className="text-xs text-gray-400">
                          {booking.vehicleModel} chỗ •{" "}
                          {booking.vehicleYearManufacture}
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
                          {booking.userName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Điện thoại:
                        </span>
                        <span className="text-sm">{booking.phoneNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Địa chỉ:</span>
                        <span className="text-sm text-right max-w-[70%]">
                          {booking.address}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Bắt đầu:</span>
                        <span className="text-sm">
                          {formatDateTime(booking.timeBookingStart)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Kết thúc:</span>
                        <span className="text-sm">
                          {formatDateTime(booking.timeBookingEnd)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Tổng tiền:
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(booking.totalCost)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Mã giao dịch:
                        </span>
                        <span className="text-sm font-mono">
                          {booking.codeTransaction}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Button
                        size="middle"
                        onClick={() => showModal(booking)}
                        icon={<SearchOutlined />}
                        className="w-1/2"
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Không có đơn đặt xe nào đang chờ xác nhận
              </div>
            )}
          </>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredBookings}
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
          />
        )}
      </Card>

      {/* Confirmation Modal for Accept Booking */}
      <Modal
        title="Xác nhận chấp nhận đơn đặt xe"
        open={confirmModalOpen}
        onOk={handleConfirmAccept}
        onCancel={() => {
          setConfirmModalOpen(false);
          setSelectedBooking(null);
        }}
        okText="Xác nhận"
        cancelText="Hủy bỏ"
        okButtonProps={{
          loading: actionLoading === selectedBooking?.id,
          danger: false,
          type: "primary",
          icon: <CheckOutlined />,
        }}
      >
        {selectedBooking && (
          <div className="py-4">
            <p className="mb-4">
              Bạn có chắc chắn muốn chấp nhận đơn đặt xe này không?
            </p>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <Image
                  width={80}
                  height={60}
                  src={selectedBooking.vehicleImage || "/placeholder.svg"}
                  alt={`${selectedBooking.vehicleBrand} ${selectedBooking.vehicleModel}`}
                  className="rounded-md object-cover"
                  fallback="/placeholder.svg?height=60&width=80"
                />
                <div>
                  <div className="font-semibold">
                    {selectedBooking.vehicleLicensePlate}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedBooking.vehicleBrand}{" "}
                    {selectedBooking.vehicleModel}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">Khách hàng:</span>
                <span>{selectedBooking.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Điện thoại:</span>
                <span>{selectedBooking.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Địa chỉ nhận xe:</span>
                <span className="text-right">{selectedBooking.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Thời gian bắt đầu:</span>
                <span>{formatDateTime(selectedBooking.timeBookingStart)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Thời gian kết thúc:</span>
                <span>{formatDateTime(selectedBooking.timeBookingEnd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tổng tiền:</span>
                <span className="text-green-600 font-semibold">
                  {formatCurrency(selectedBooking.totalCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Mã giao dịch:</span>
                <span>{selectedBooking.codeTransaction}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Thời gian giao dịch:</span>
                <span>{formatDateTime(selectedBooking.timeTransaction)}</span>
              </div>
            </div>

            <div className="mt-4 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm text-gray-800">
                <strong>Lưu ý:</strong> Sau khi xác nhận, đơn đặt xe sẽ được
                chuyển sang trạng thái &ldquo;Đã xác nhận&rdquo; và hợp đồng sẽ
                được tạo. Khách hàng sẽ nhận được thông báo để tiếp tục quá
                trình thuê xe.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal for booking details */}
      <Modal
        title="Chi tiết đơn đặt xe"
        open={open}
        footer={null}
        width={800}
        onCancel={handleCancel}
      >
        <div className="mt-4 mb-6 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Image
              width={100}
              height={75}
              src={form.getFieldValue("vehicleImage") || "/placeholder.svg"}
              alt="Vehicle"
              className="rounded-md object-cover"
              fallback="/placeholder.svg?height=75&width=100"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {form.getFieldValue("vehicleLicensePlate")}
            </h3>
            <p className="text-blue-600 text-sm">{getStatusTag("PENDING")}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-gray-800 mb-2">
            Thông tin thanh toán
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Mã giao dịch:</span>
              <span className="font-medium">
                {form.getFieldValue("codeTransaction")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tổng tiền:</span>
              <span className="font-semibold text-green-600">
                {form.getFieldValue("totalCost")}
              </span>
            </div>
          </div>
        </div>

        <Form form={form} layout="vertical">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-3">
                Thông tin khách hàng
              </h4>
              <Form.Item label="Tên khách hàng" name="userName">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Số điện thoại" name="phoneNumber">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Địa chỉ nhận xe" name="address">
                <Input.TextArea readOnly rows={2} />
              </Form.Item>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-3">
                Thông tin đặt xe
              </h4>
              <Form.Item label="Biển số xe" name="vehicleLicensePlate">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Thời gian bắt đầu thuê" name="timeBookingStart">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Thời gian kết thúc thuê" name="timeBookingEnd">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Booking ID" hidden name="id">
                <Input readOnly />
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={handleCancel}>Đóng</Button>

            <Popconfirm
              title="Hủy đơn đặt xe?"
              description="Bạn có chắc muốn hủy đơn đặt xe này?"
              okText="Hủy đơn"
              cancelText="Không"
              onConfirm={() => {
                const bookingId = form.getFieldValue("id");
                handleCancel();
                cancelBooking(bookingId);
              }}
            >
              <Button
                danger
                icon={<CloseOutlined />}
                loading={actionLoading === form.getFieldValue("id")}
              >
                Hủy đơn
              </Button>
            </Popconfirm>

            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => {
                const bookingId = form.getFieldValue("id");
                const booking = bookings.find((b) => b.id === bookingId);
                handleCancel();
                if (booking) {
                  showAcceptConfirmation(booking);
                }
              }}
              loading={actionLoading === form.getFieldValue("id")}
            >
              Chấp nhận đơn
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

// Set layout for the component
ManagePendingBookings.Layout = ProviderLayout;
