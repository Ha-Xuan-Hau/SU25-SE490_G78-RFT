"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import {
  useProviderState,
  getProviderIdFromState,
} from "@/recoils/provider.state";
import {
  SearchOutlined,
  PlusCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  RollbackOutlined,
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
  DatePicker,
  Card,
  Tag,
  Divider,
  Progress,
  Spin,
  Tabs,
} from "antd";
import type { InputRef } from "antd";
import type { ColumnType } from "antd/es/table";
import Highlighter from "react-highlight-words";
import dayjs from "dayjs";
import {
  getBookingsByProviderAndStatus,
  updateBookingStatus,
  cancelBooking,
} from "@/apis/booking.api";
import {
  showApiError,
  showApiSuccess,
  showError,
  showSuccess,
} from "@/utils/toast.utils";
import CancelBookingModal from "@/components/CancelBookingModal";

// Define TypeScript interfaces for backend booking data
interface ApiResponse {
  success: boolean;
  data?: BookingData[];
  error?: string;
  statusCode?: number;
}

interface BookingData {
  id: string;
  userId: string;
  userName: string;
  vehicleId: string;
  vehicleLicensePlate: string;
  vehicleType: string;
  vehicleThumb?: string;
  vehicleImage?: string;
  vehicleModel?: string;
  vehicleSeats?: number;
  vehicleNumberSeat?: number; // Backend uses this field name
  vehicleYear?: number;
  vehicleYearManufacture?: number; // Backend uses this field name
  vehicleBrand?: string;
  vehicleTransmission?: string;
  vehicleFuelType?: string;
  vehicleCostPerDay?: number;
  vehicleDescription?: string;
  vehicleProviderId?: string;
  timeBookingStart: number[]; // [year, month, day, hour, minute]
  timeBookingEnd: number[]; // [year, month, day, hour, minute]
  phoneNumber: string;
  address: string;
  codeTransaction: string;
  timeTransaction: number[]; // [year, month, day, hour, minute, second]
  totalCost: number;
  status: string;
  createdAt: number[];
  updatedAt: number[];
  penaltyType?: string;
  penaltyValue?: number;
  minCancelHour?: number;
}

// Use BookingData directly instead of transforming to ContractData

interface FormValues {
  id: string;
  userName: string;
  phoneNumber: string;
  address: string;
  vehicleLicensePlate: string;
  timeBookingStart: number[];
  timeBookingEnd: number[];
  totalCost: number;
  timeFinish?: dayjs.Dayjs;
  costSettlement?: number;
  note?: string;
}

// Updated enum for 4-step process
enum ContractStatus {
  CONFIRMED = "CONFIRMED", // Đã xác nhận - Chờ giao xe
  DELIVERED = "DELIVERED", // Đã giao xe
  RECEIVED_BY_CUSTOMER = "RECEIVED_BY_CUSTOMER", // Khách đã nhận xe
  RETURNED = "RETURNED", // Khách đã trả xe
  COMPLETED = "COMPLETED", // Đã hoàn thành (tất toán)
  CANCELLED = "CANCELLED", // Đã hủy
}

export default function ManageAcceptedBookings() {
  const [form] = Form.useForm();
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [searchedColumn, setSearchedColumn] = useState<string>("");
  const searchInput = useRef<InputRef>(null);
  const [days, setDays] = useState<number>();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingData[]>([]);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [providerLoading, setProviderLoading] = useState<boolean>(true);
  const [cancelModalVisible, setCancelModalVisible] = useState<boolean>(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );

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

  // Load booking data from API
  const fetchBookings = useCallback(
    async (forceRefresh = false) => {
      try {
        const providerId = getProviderIdFromState(provider);
        console.log("Provider ID from state:", providerId);
        console.log("Provider object:", provider);

        if (!providerId) {
          // Don't show error if provider is still loading
          if (!providerLoading) {
            showApiError("Vui lòng đăng nhập để xem danh sách booking");
          }
          return;
        }

        // Check if we've already fetched for this provider (unless forced refresh)
        if (!forceRefresh && hasFetchedRef.current === providerId) {
          console.log("Already fetched bookings for provider:", providerId);
          return;
        }

        setLoading(true);
        console.log("Fetching bookings for provider:", providerId);

        // Fetch bookings with relevant statuses
        const statuses = [
          "CONFIRMED",
          "DELIVERED",
          "RECEIVED_BY_CUSTOMER",
          "RETURNED",
        ];
        const allBookings: BookingData[] = [];

        for (const status of statuses) {
          try {
            console.log(`Fetching bookings for status: ${status}`);
            console.log(
              `API call: getBookingsByProviderAndStatus("${providerId}", "${status}")`
            );

            const response = (await getBookingsByProviderAndStatus(
              providerId,
              status
            )) as ApiResponse;

            console.log(`Raw response for ${status}:`, response);
            console.log(`Response type:`, typeof response);

            if (response && response.success && response.data) {
              console.log(`Response.data for ${status}:`, response.data);
              console.log(
                `Response.data is array:`,
                Array.isArray(response.data)
              );

              if (Array.isArray(response.data)) {
                console.log(
                  `Found ${response.data.length} bookings with status ${status}`
                );
                if (response.data.length > 0) {
                  console.log(
                    `Sample booking for ${status}:`,
                    response.data[0]
                  );
                }
                allBookings.push(...response.data);
              } else {
                console.log(
                  `Response.data is not an array for ${status}:`,
                  typeof response.data
                );
              }
            } else if (response && !response.success) {
              console.error(
                `API returned error for ${status}:`,
                response.error
              );
            } else {
              console.log(`No valid response received for status ${status}`);
            }
          } catch (statusError) {
            console.error(
              `Error fetching bookings for status ${status}:`,
              statusError
            );
            const error = statusError as Error;
            console.error(`Error details:`, {
              message: error?.message,
              stack: error?.stack,
              name: error?.name,
            });
          }
        }

        console.log("All fetched bookings:", allBookings);
        setBookings(allBookings);
        hasFetchedRef.current = providerId; // Mark as fetched for this provider

        if (allBookings.length === 0) {
          console.log("No bookings found for provider:", providerId);
        } else {
          console.log(
            `Total ${allBookings.length} bookings found for provider:`,
            providerId
          );
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

  // Filter bookings based on active tab and search query
  const filterBookings = useCallback(() => {
    let filtered = bookings;

    // Filter by status tab
    if (activeTab !== "ALL") {
      filtered = filtered.filter((booking) => booking.status === activeTab);
    }

    // Filter by search query (customer name or vehicle license plate)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (booking) =>
          booking.userName.toLowerCase().includes(query) ||
          booking.vehicleLicensePlate.toLowerCase().includes(query)
      );
    }

    setFilteredBookings(filtered);
  }, [bookings, activeTab, searchQuery]);

  // Update filtered bookings when bookings, activeTab, or searchQuery changes
  useEffect(() => {
    filterBookings();
  }, [filterBookings]);

  // Load booking data when provider is ready
  useEffect(() => {
    if (!providerLoading) {
      fetchBookings();
    }
  }, [fetchBookings, providerLoading]);

  // Update status tag display function
  const getStatusTag = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <Tag color="cyan" icon={<CheckCircleOutlined />}>
            Đã xác nhận
          </Tag>
        );
      case "DELIVERED":
        return (
          <Tag color="blue" icon={<CarOutlined />}>
            Đã giao xe
          </Tag>
        );
      case "RECEIVED_BY_CUSTOMER":
        return (
          <Tag color="geekblue" icon={<UserOutlined />}>
            Khách đã nhận xe
          </Tag>
        );
      case "RETURNED":
        return (
          <Tag color="orange" icon={<RollbackOutlined />}>
            Đã trả xe
          </Tag>
        );
      case "COMPLETED":
        return (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Đã hoàn thành
          </Tag>
        );
      case "CANCELLED":
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

  const handleChange = () => {
    // Handle table changes if needed
  };

  // Cancel contract function using API with reason
  const cancelContract = async (reason: string) => {
    if (!selectedBookingId) return;

    setLoading(true);
    try {
      const result = (await cancelBooking(
        selectedBookingId,
        reason,
        "provider"
      )) as any;
      if (result.success) {
        message.success("Hợp đồng đã được hủy thành công");
        setCancelModalVisible(false);
        setSelectedBookingId(null);
        await fetchBookings(true); // Force refresh data
      } else {
        message.error(result.error || "Lỗi khi hủy hợp đồng");
      }
    } catch (error) {
      console.error("Error canceling contract:", error);
      message.error("Lỗi khi hủy hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  // Show cancel modal
  const showCancelModal = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setCancelModalVisible(true);
  };

  // Hide cancel modal
  const hideCancelModal = () => {
    setCancelModalVisible(false);
    setSelectedBookingId(null);
  };

  // Update contract status using API
  const updateContractStatus = async (bookingId: string, newStatus: string) => {
    setLoading(true);
    try {
      let action = "";
      switch (newStatus) {
        case "DELIVERED":
          action = "deliver";
          break;
        case "RECEIVED_BY_CUSTOMER":
          action = "receive";
          break;
        case "RETURNED":
          action = "return";
          break;
        case "COMPLETED":
          action = "complete";
          break;
        default:
          action = "confirm";
      }

      const res = (await updateBookingStatus(bookingId, action)) as {
        success?: boolean;
        error?: string;
      };
      if (!res.success) {
        showApiError(res.error);
        return;
      }
      showApiSuccess("Cập nhật trạng thái hợp đồng thành công");
      await fetchBookings(true);
    } catch (error: any) {
      console.error("Error updating contract status:", error);
      showApiError(
        error?.response?.data?.message || "Lỗi khi cập nhật trạng thái hợp đồng"
      );
    } finally {
      setLoading(false);
    }
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
    const totalCost = form.getFieldValue("totalCost");
    if (totalCost && days) {
      // Calculate settlement cost based on actual days vs planned days
      const timeBookingStart = form.getFieldValue("timeBookingStart");
      const timeBookingEnd = form.getFieldValue("timeBookingEnd");

      if (timeBookingStart && timeBookingEnd) {
        const startDate = new Date(
          timeBookingStart[0],
          timeBookingStart[1] - 1,
          timeBookingStart[2]
        );
        const endDate = new Date(
          timeBookingEnd[0],
          timeBookingEnd[1] - 1,
          timeBookingEnd[2]
        );
        const plannedDays = dateDiffInDays(endDate, startDate);
        const dailyRate = totalCost / plannedDays;

        // If returned early, refund the unused days
        const refund = dailyRate * Math.max(0, days);
        const newAmount = totalCost - refund;

        form.setFieldsValue({
          costSettlement: newAmount || 0,
        });
      }
    }
  }, [days, form]);

  const handleDays = (value: dayjs.Dayjs | null) => {
    if (!value) return;

    const timeBookingEnd = form.getFieldValue("timeBookingEnd");

    if (!timeBookingEnd) return;

    const endDate = new Date(
      timeBookingEnd[0],
      timeBookingEnd[1] - 1,
      timeBookingEnd[2]
    );
    const finishDate = new Date(value.format("YYYY-MM-DD"));

    const totalDays = dateDiffInDays(endDate, finishDate);
    setDays(totalDays);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText("");
  };

  // Action button rendering for 4-step process
  const renderActionButton = (booking: BookingData) => {
    switch (booking.status) {
      case "CONFIRMED":
        return (
          <div className="space-y-2">
            <Button
              type="primary"
              size="small"
              onClick={() => updateContractStatus(booking.id, "DELIVERED")}
              className="w-full"
            >
              Xác nhận giao xe
            </Button>

            <Button
              danger
              size="small"
              onClick={() => showCancelModal(booking.id)}
              className="w-full"
            >
              Hủy hợp đồng
            </Button>
          </div>
        );

      case "DELIVERED":
        return (
          <div className="space-y-2">
            <Button
              danger
              size="small"
              onClick={() => showCancelModal(booking.id)}
              className="w-full"
            >
              Hủy hợp đồng
            </Button>

            <div className="text-xs text-gray-500 text-center">
              Chờ khách xác nhận nhận xe
            </div>
          </div>
        );

      case "RECEIVED_BY_CUSTOMER":
        return (
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">
              Khách đang sử dụng xe
            </div>
            <div className="text-xs text-blue-600">Chờ khách trả xe</div>
          </div>
        );

      case "RETURNED":
        return (
          <Button
            type="primary"
            size="small"
            onClick={() => showModal(booking)}
            icon={<PlusCircleOutlined />}
            className="w-full"
          >
            Xác nhận trả xe
          </Button>
        );

      default:
        return null;
    }
  };

  const getColumnSearchProps = (
    dataIndex: keyof BookingData
  ): ColumnType<BookingData> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Tìm ${String(dataIndex)}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() =>
            handleSearch(selectedKeys as string[], confirm, String(dataIndex))
          }
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() =>
              handleSearch(selectedKeys as string[], confirm, String(dataIndex))
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
      searchedColumn === String(dataIndex) ? (
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

  // Define the response type for updateBookingStatus
  interface UpdateBookingStatusResponse {
    success: boolean;
    data?: any;
    error?: string;
  }

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const payload = {
        costSettlement: values.costSettlement,
        note: values.note,
        timeFinish: values.timeFinish
          ? [
              values.timeFinish.year(),
              values.timeFinish.month() + 1,
              values.timeFinish.date(),
              values.timeFinish.hour(),
              values.timeFinish.minute(),
              values.timeFinish.second(),
            ]
          : undefined,
      };
      const res = (await updateBookingStatus(
        values.id,
        "complete",
        payload
      )) as UpdateBookingStatusResponse;
      if (!res.success) {
        message.error(res.error || "Lỗi khi tất toán hợp đồng");
        return;
      }
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === values.id
            ? { ...booking, status: "COMPLETED" }
            : booking
        )
      );
      showApiSuccess("Tất toán hợp đồng thành công");
      setOpen(false);
      await fetchBookings(true);
    } catch {
      showApiError("Lỗi khi tất toán hợp đồng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const showModal = (booking: BookingData) => {
    if (booking.status !== ContractStatus.RETURNED) {
      message.warning("Chỉ có thể tất toán hợp đồng khi xe đã được trả");
      return;
    }

    setOpen(true);
    form.setFieldsValue({
      id: booking.id,
      userName: booking.userName,
      phoneNumber: booking.phoneNumber,
      address: booking.address,
      vehicleThumb: booking.vehicleThumb,
      vehicleLicensePlate: booking.vehicleLicensePlate,
      timeBookingStart: booking.timeBookingStart,
      timeBookingEnd: booking.timeBookingEnd,
      totalCost: booking.totalCost,
      timeFinish: booking.updatedAt
        ? dayjs(
            `${booking.updatedAt[0]}-${booking.updatedAt[1]}-${booking.updatedAt[2]} ${booking.updatedAt[3]}:${booking.updatedAt[4]}:${booking.updatedAt[5]}`
          )
        : undefined,
      costSettlement: booking.totalCost,
    });
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const disabledDate = (current: dayjs.Dayjs) => {
    const timeBookingStart = form.getFieldValue("timeBookingStart");
    const timeBookingEnd = form.getFieldValue("timeBookingEnd");

    if (!timeBookingStart || !timeBookingEnd) return false;

    // timeBookingStart and timeBookingEnd are arrays [year, month, day, hour, minute]
    const startDate = new Date(
      timeBookingStart[0],
      timeBookingStart[1] - 1,
      timeBookingStart[2]
    );
    const endDate = new Date(
      timeBookingEnd[0],
      timeBookingEnd[1] - 1,
      timeBookingEnd[2]
    );
    endDate.setDate(endDate.getDate() + 1); // Allow one day after end date

    return current < dayjs(startDate) || current > dayjs(endDate);
  };

  // Calculate progress percentage for 4-step process
  const getContractProgressPercent = (status: string): number => {
    const totalSteps = 4; // Total steps in the new process
    let currentStep = 0;

    switch (status) {
      case "CONFIRMED":
        currentStep = 1;
        break;
      case "DELIVERED":
        currentStep = 2;
        break;
      case "RECEIVED_BY_CUSTOMER":
        currentStep = 3;
        break;
      case "RETURNED":
        currentStep = 4;
        break;
      case "COMPLETED":
        return 100;
      case "CANCELLED":
        return 100;
      default:
        return 0;
    }

    return (currentStep / totalSteps) * 100;
  };

  // Tab items for status filtering
  const tabItems = [
    {
      key: "ALL",
      label: `Tất cả (${bookings.length})`,
      children: null,
    },
    {
      key: "CONFIRMED",
      label: (
        <span className="flex items-center gap-2">
          <CheckCircleOutlined />
          Chờ giao xe ({bookings.filter((b) => b.status === "CONFIRMED").length}
          )
        </span>
      ),
      children: null,
    },
    {
      key: "DELIVERED",
      label: (
        <span className="flex items-center gap-2">
          <CarOutlined />
          Đã giao xe ({bookings.filter((b) => b.status === "DELIVERED").length})
        </span>
      ),
      children: null,
    },
    {
      key: "RECEIVED_BY_CUSTOMER",
      label: (
        <span className="flex items-center gap-2">
          <UserOutlined />
          Khách đã nhận (
          {bookings.filter((b) => b.status === "RECEIVED_BY_CUSTOMER").length})
        </span>
      ),
      children: null,
    },
    {
      key: "RETURNED",
      label: (
        <span className="flex items-center gap-2">
          <RollbackOutlined />
          Đã trả xe ({bookings.filter((b) => b.status === "RETURNED").length})
        </span>
      ),
      children: null,
    },
  ];

  const columns: ColumnType<BookingData>[] = [
    // Column hợp đồng
    {
      title: "Hợp đồng",
      key: "contract",
      width: 280,
      ...getColumnSearchProps("vehicleLicensePlate"),
      render: (_, record) => {
        const vehicleImage = record.vehicleImage || "/placeholder.svg";
        return (
          <div className="flex items-center gap-3">
            <Image.PreviewGroup
              preview={{
                onChange: (current, prev) =>
                  console.log(`current index: ${current}, prev index: ${prev}`),
              }}
              items={[vehicleImage]}
            >
              <Image
                width={80}
                height={60}
                src={vehicleImage}
                alt="Contract"
                className="rounded-md object-cover"
                fallback="/placeholder.svg?height=60&width=80"
              />
            </Image.PreviewGroup>
            <div>
              <div className="font-semibold">{record.id}</div>

              <div className="text-sm text-gray-400">{record.vehicleThumb}</div>

              {/* Hiển thị tiến trình của hợp đồng */}
              <div className="mt-1">
                <Progress
                  percent={getContractProgressPercent(record.status)}
                  size="small"
                  showInfo={false}
                />
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Khách hàng",
      key: "customer",
      width: 220,
      ...getColumnSearchProps("userName"),
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
      render: (_, record) => {
        const convertArrayToDateString = (timeArray: number[]): string => {
          const [year, month, day, hour = 0, minute = 0] = timeArray;
          const date = new Date(year, month - 1, day, hour, minute);
          return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        };

        return (
          <div>
            <div className="text-sm">
              <strong>Bắt đầu:</strong>{" "}
              {convertArrayToDateString(record.timeBookingStart)}
            </div>
            <div className="text-sm">
              <strong>Kết thúc:</strong>{" "}
              {convertArrayToDateString(record.timeBookingEnd)}
            </div>
          </div>
        );
      },
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalCost",
      key: "totalCost",
      width: 120,
      render: (cost) => (
        <div className="font-semibold text-green-600">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(cost)}
        </div>
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
        {
          text: "Khách đã nhận xe",
          value: ContractStatus.RECEIVED_BY_CUSTOMER,
        },
        { text: "Đã trả xe", value: ContractStatus.RETURNED },
        { text: "Đã hoàn thành", value: ContractStatus.COMPLETED },
        { text: "Đã hủy", value: ContractStatus.CANCELLED },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right",
      width: 140,
      render: (_, booking) => (
        <Space direction="vertical" size="small">
          {/* Các nút chuyển trạng thái */}
          {renderActionButton(booking)}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Quản lý đơn đặt xe
          </h2>
          <p className="text-gray-600">
            Quản lý các hợp đồng thuê xe và tạo hợp đồng tất toán
          </p>
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
              <p>Bạn cần đăng nhập để xem danh sách hợp đồng</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header with Search Bar and Tabs */}
            <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <Input
                placeholder="Tìm kiếm theo tên khách hàng hoặc biển số xe..."
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="large"
                allowClear
                className="max-w-md"
              />

              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                size="large"
              />
            </div>

            <Table
              onChange={handleChange}
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
              locale={{
                emptyText: loading
                  ? "Đang tải dữ liệu..."
                  : searchQuery
                  ? "Không tìm thấy kết quả phù hợp"
                  : "Không có dữ liệu",
              }}
            />
          </>
        )}
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
                <Form.Item label="Tên khách hàng" name="userName">
                  <Input disabled />
                </Form.Item>
                <Form.Item label="Số điện thoại" name="phoneNumber">
                  <Input disabled />
                </Form.Item>
                <Form.Item label="Mã đặt xe" name="id">
                  <Input disabled />
                </Form.Item>
                <Form.Item label="Tổng giá tiền thuê (VNĐ)" name="totalCost">
                  <InputNumber
                    disabled
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value!.replace(/VNĐ\s?|(,*)/g, "")}
                    className="w-full"
                  />
                </Form.Item>
                <Form.Item label="Tên xe" name="vehicleThumb">
                  <Input disabled />
                </Form.Item>
                <Form.Item label="Biển số xe" name="vehicleLicensePlate">
                  <Input disabled />
                </Form.Item>
              </div>

              <Form.Item label="Địa chỉ" name="address">
                <Input.TextArea disabled rows={2} />
              </Form.Item>

              <Divider>Thông tin tất toán</Divider>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Thời gian trả xe thực tế" name="timeFinish">
                  <DatePicker
                    format="DD-MM-YYYY HH:mm:ss"
                    disabledDate={disabledDate}
                    onChange={handleDays}
                    className="w-full"
                    placeholder="Chọn ngày trả xe"
                    disabled
                  />
                </Form.Item>
                <Form.Item
                  label="Giá trị kết toán hợp đồng (VNĐ)"
                  name="costSettlement"
                >
                  <InputNumber
                    disabled
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value!.replace(/VNĐ\s?|(,*)/g, "")}
                    className="w-full"
                  />
                </Form.Item>
              </div>

              <Form.Item label="Ghi chú" name="note">
                <Input.TextArea rows={3} placeholder="Nhập ghi chú (nếu có)" />
              </Form.Item>

              {/* Hidden fields */}
              <Form.Item hidden name="id">
                <Input />
              </Form.Item>
              <Form.Item hidden name="timeBookingStart">
                <Input />
              </Form.Item>
              <Form.Item hidden name="timeBookingEnd">
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

      {/* Cancel Booking Modal */}
      <CancelBookingModal
        visible={cancelModalVisible}
        onCancel={hideCancelModal}
        onConfirm={cancelContract}
        bookingId={selectedBookingId || ""}
        userType="provider"
        loading={loading}
      />
    </div>
  );
}

// Set layout for the component
ManageAcceptedBookings.Layout = ProviderLayout;
