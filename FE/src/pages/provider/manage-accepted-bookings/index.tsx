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
  Checkbox,
} from "antd";
import type { InputRef } from "antd";
import type { ColumnType } from "antd/es/table";
import Highlighter from "react-highlight-words";
import dayjs from "dayjs";
import {
  getBookingsByProviderAndStatus,
  updateBookingStatus,
  cancelBooking,
  cancelBookingByProviderDueToNoShow,
} from "@/apis/booking.api";
import {
  showApiError,
  showApiSuccess,
  showError,
  showSuccess,
} from "@/utils/toast.utils";
import CancelBookingModal from "@/components/CancelBookingModal";
import ReportButton from "@/components/ReportComponent";

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

  const [deliveryConfirmModal, setDeliveryConfirmModal] =
    useState<boolean>(false);
  const [selectedDeliveryBookingId, setSelectedDeliveryBookingId] = useState<
    string | null
  >(null);

  const [returnConfirmModal, setReturnConfirmModal] = useState<boolean>(false);
  const [selectedReturnBookingId, setSelectedReturnBookingId] = useState<
    string | null
  >(null);

  //late showtime
  const [noShowModalVisible, setNoShowModalVisible] = useState<boolean>(false);
  const [selectedNoShowBookingId, setSelectedNoShowBookingId] = useState<
    string | null
  >(null);

  //state report
  const [reportGuideVisible, setReportGuideVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([]);
  const [selectedBookingForReport, setSelectedBookingForReport] =
    useState<BookingData | null>(null);

  // Ref to track if we've already fetched data for current provider
  const hasFetchedRef = useRef<string | null>(null);

  // Provider state
  const [provider] = useProviderState();

  // Thêm state để quản lý checkbox
  const [deliveryChecklist, setDeliveryChecklist] = useState({
    licenseCheck: false,
    personalInfoCheck: false,
    vehicleConditionCheck: false,
    rulesGuidanceCheck: false,
  });

  // Reset checklist khi mở modal
  const showDeliveryConfirmModal = (bookingId: string) => {
    setSelectedDeliveryBookingId(bookingId);
    setDeliveryConfirmModal(true);
    // Reset checklist
    setDeliveryChecklist({
      licenseCheck: false,
      personalInfoCheck: false,
      vehicleConditionCheck: false,
      rulesGuidanceCheck: false,
    });
  };

  // Kiểm tra tất cả checkbox đã được check
  const isAllChecklistCompleted =
    Object.values(deliveryChecklist).every(Boolean);

  const formatTimestamp = (
    timestamp: number | string | number[] | undefined | null
  ): string => {
    if (!timestamp) return "";

    if (Array.isArray(timestamp) && timestamp.length >= 5) {
      const [year, month, day, hour, minute] = timestamp;
      return `${day.toString().padStart(2, "0")}/${month
        .toString()
        .padStart(2, "0")}/${year} ${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
    }

    if (typeof timestamp === "number" || typeof timestamp === "string") {
      const date = new Date(
        typeof timestamp === "number" ? timestamp * 1000 : timestamp
      );
      return `${date.getDate().toString().padStart(2, "0")}/${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${date.getFullYear()} ${date
        .getHours()
        .toString()
        .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    }

    return "";
  };

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
        message.success("Đơn hàng đã được hủy thành công");
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

  // Thêm function để kiểm tra đã quá giờ nhận xe chưa
  const isOverPickupTime = (booking: BookingData): boolean => {
    if (booking.status !== "CONFIRMED") return false;

    const now = new Date();
    const pickupTime = new Date(
      booking.timeBookingStart[0], // year
      booking.timeBookingStart[1] - 1, // month (0-indexed)
      booking.timeBookingStart[2], // day
      booking.timeBookingStart[3] || 0, // hour
      booking.timeBookingStart[4] || 0 // minute
    );

    return now > pickupTime;
  };

  // Thêm handlers cho modal "Khách không xuất hiện"
  const showNoShowModal = (bookingId: string) => {
    setSelectedNoShowBookingId(bookingId);
    setNoShowModalVisible(true);
  };

  const hideNoShowModal = () => {
    setNoShowModalVisible(false);
    setSelectedNoShowBookingId(null);
  };

  // Thêm function để xử lý khi khách không xuất hiện
  const handleNoShow = async () => {
    if (!selectedNoShowBookingId) return;

    setLoading(true);
    try {
      const result = await cancelBookingByProviderDueToNoShow(
        selectedNoShowBookingId
      );

      showApiSuccess("Đã hủy đơn do khách không xuất hiện");
      setNoShowModalVisible(false);
      setSelectedNoShowBookingId(null);
      await fetchBookings(true); // Force refresh data
    } catch (error) {
      console.error("Error handling no-show:", error);
      showApiError("Lỗi khi xử lý đơn hàng");
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

  // Show delivery confirmation modal
  // const showDeliveryConfirmModal = (bookingId: string) => {
  //   setSelectedDeliveryBookingId(bookingId);
  //   setDeliveryConfirmModal(true);
  // };

  // Hide delivery confirmation modal
  const hideDeliveryConfirmModal = () => {
    setDeliveryConfirmModal(false);
    setSelectedDeliveryBookingId(null);
  };

  // Confirm delivery
  const confirmDelivery = async () => {
    if (!selectedDeliveryBookingId) return;

    setDeliveryConfirmModal(false);
    await updateContractStatus(selectedDeliveryBookingId, "DELIVERED");
    setSelectedDeliveryBookingId(null);
  };

  // Show return confirmation modal
  const showReturnConfirmModal = (bookingId: string) => {
    setSelectedReturnBookingId(bookingId);
    setReturnConfirmModal(true);
  };

  // Hide return confirmation modal
  const hideReturnConfirmModal = () => {
    setReturnConfirmModal(false);
    setSelectedReturnBookingId(null);
  };

  // Confirm return
  const confirmReturn = async () => {
    if (!selectedReturnBookingId) return;

    setReturnConfirmModal(false);

    // Tìm booking để mở modal tất toán
    const booking = bookings.find((b) => b.id === selectedReturnBookingId);
    if (booking) {
      showModal(booking); // Mở modal tất toán hợp đồng
    }

    setSelectedReturnBookingId(null);
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
  // const renderActionButton = (booking: BookingData) => {
  //   switch (booking.status) {
  //     case "CONFIRMED":
  //       return (
  //         <div className="space-y-2">
  //           <Button
  //             type="primary"
  //             size="small"
  //             onClick={() => showDeliveryConfirmModal(booking.id)}
  //             className="w-full"
  //           >
  //             Xác nhận giao xe
  //           </Button>

  //           <Button
  //             danger
  //             size="small"
  //             onClick={() => showCancelModal(booking.id)}
  //             className="w-full"
  //           >
  //             Hủy hợp đồng
  //           </Button>
  //         </div>
  //       );

  //     case "DELIVERED":
  //       return (
  //         <div className="space-y-2">
  //           <Button
  //             danger
  //             size="small"
  //             onClick={() => showCancelModal(booking.id)}
  //             className="w-full"
  //           >
  //             Hủy hợp đồng
  //           </Button>

  //           <div className="text-xs text-gray-500 text-center">
  //             Chờ khách xác nhận nhận xe
  //           </div>
  //         </div>
  //       );

  //     case "RECEIVED_BY_CUSTOMER":
  //       return (
  //         <div className="text-center">
  //           <div className="text-xs text-gray-500 mb-1">
  //             Khách đang sử dụng xe
  //           </div>
  //           <div className="text-xs text-blue-600">Chờ khách trả xe</div>
  //         </div>
  //       );

  //     case "RETURNED":
  //       return (
  //         <Button
  //           type="primary"
  //           size="small"
  //           onClick={() => showReturnConfirmModal(booking.id)}
  //           icon={<PlusCircleOutlined />}
  //           className="w-full"
  //         >
  //           Xác nhận trả xe
  //         </Button>
  //       );

  //     default:
  //       return null;
  //   }
  // };

  // Thay thế function renderActionButton hiện có
  const renderActionButton = (booking: BookingData) => {
    const baseActions = [];

    switch (booking.status) {
      case "CONFIRMED":
        baseActions.push(
          <Button
            key="deliver"
            type="primary"
            size="small"
            onClick={() => showDeliveryConfirmModal(booking.id)}
            className="w-full"
          >
            Xác nhận giao xe
          </Button>
        );

        // Kiểm tra nếu đã quá giờ nhận xe
        if (isOverPickupTime(booking)) {
          baseActions.push(
            <Button
              key="no-show"
              danger
              size="small"
              onClick={() => showNoShowModal(booking.id)}
              className="w-full"
            >
              Khách không nhận xe?
            </Button>
          );
        } else {
          baseActions.push(
            <Button
              key="cancel"
              danger
              size="small"
              onClick={() => showCancelModal(booking.id)}
              className="w-full"
            >
              Hủy hợp đồng
            </Button>
          );
        }
        break;

      case "DELIVERED":
        baseActions.push(
          <Button
            key="cancel"
            danger
            size="small"
            onClick={() => showCancelModal(booking.id)}
            className="w-full"
          >
            Hủy hợp đồng
          </Button>,
          <div key="waiting" className="text-xs text-gray-500 text-center">
            Chờ khách xác nhận nhận xe
          </div>
        );
        break;

      case "RECEIVED_BY_CUSTOMER":
        baseActions.push(
          <div key="in-use" className="text-center">
            <div className="text-xs text-gray-500 mb-1">
              Khách đang sử dụng xe
            </div>
            <div className="text-xs text-blue-600">Chờ khách trả xe</div>
          </div>
        );
        break;

      case "RETURNED":
        baseActions.push(
          <Button
            key="complete"
            type="primary"
            size="small"
            onClick={() => showReturnConfirmModal(booking.id)}
            icon={<PlusCircleOutlined />}
            className="w-full"
          >
            Xác nhận trả xe
          </Button>
        );
        break;
    }

    // Thêm nút báo cáo nếu có thể báo cáo
    if (canReport(booking) && getReportTypes(booking).length > 0) {
      baseActions.push(
        <Button
          key="report"
          type="default"
          size="small"
          onClick={() => handleReportClick(booking)}
          className="w-full border-red-400 text-red-600 hover:bg-red-50"
          icon={<ExclamationCircleOutlined />}
        >
          Báo cáo
        </Button>
      );
    }

    return <div className="space-y-2">{baseActions}</div>;
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
        // timeFinish: values.timeFinish,
        // ? [
        //     values.timeFinish.year(),
        //     values.timeFinish.month() + 1,
        //     values.timeFinish.date(),
        //     values.timeFinish.hour(),
        //     values.timeFinish.minute(),
        //     values.timeFinish.second(),
        //   ]
        // : undefined,
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
      timeFinish: formatTimestamp(booking.updatedAt),
      // ? dayjs(
      //     `${booking.updatedAt[0]}-${booking.updatedAt[1]}-${booking.updatedAt[2]} ${booking.updatedAt[3]}:${booking.updatedAt[4]}:${booking.updatedAt[5]}`
      //   )
      // : undefined,
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
    // Column đơn hàng
    {
      title: "Đơn hàng",
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
              <div className="font-semibold">
                <a
                  href={`/booking-detail/${record.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-blue-600"
                >
                  {record.id}
                </a>
              </div>

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

  // Kiểm tra có thể báo cáo không
  const canReport = (booking: BookingData) => {
    const reportableStatuses = [
      "CONFIRMED",
      "DELIVERED",
      "RECEIVED_BY_CUSTOMER",
      "RETURNED",
      "CANCELLED",
    ];
    return reportableStatuses.includes(booking.status);
  };

  // Lấy danh sách loại báo cáo theo trạng thái
  const getReportTypes = (booking: BookingData) => {
    switch (booking.status) {
      case "CONFIRMED":
        return ["FAKE_DOCUMENT"];

      case "RECEIVED_BY_CUSTOMER":
        return ["DAMAGED_VEHICLE", "LATE_RETURN_NO_CONTACT"];

      case "RETURNED":
        return [
          "DAMAGED_VEHICLE",
          "LATE_RETURN_NO_CONTACT",
          "DIRTY_CAR",
          "DISPUTE_REFUND",
        ];

      case "CANCELLED":
        return ["FAKE_ORDER"];

      default:
        return [];
    }
  };

  // Lấy nội dung hướng dẫn
  const getGuideContent = (booking: BookingData) => {
    switch (booking.status) {
      case "CONFIRMED":
        return {
          title: "Hướng dẫn báo cáo vấn đề trước khi giao xe",
          description:
            "Bạn đang trong giai đoạn chuẩn bị giao xe. Các vấn đề có thể báo cáo:",
          issues: [
            "📄 Khách cung cấp CMND/CCCD không đúng với hệ thống",
            "🚫 CMND/CCCD giả hoặc không hợp lệ",
          ],
        };

      case "RECEIVED_BY_CUSTOMER":
        return {
          title: "Hướng dẫn báo cáo vấn đề khi khách đang thuê xe",
          description: "Khách đang sử dụng xe. Các vấn đề có thể báo cáo:",
          issues: [
            "🔧 Khách làm hư hỏng xe trong quá trình sử dụng",
            "⏰ Khách không trả xe đúng giờ và mất liên lạc",
            "📞 Không thể liên lạc được trong thời gian quá hạn",
          ],
        };

      case "RETURNED":
        return {
          title: "Hướng dẫn báo cáo vấn đề sau khi nhận xe trả lại",
          description: "Xe đã được trả lại. Các vấn đề có thể báo cáo:",
          issues: [
            "🔧 Phát hiện xe bị hư hỏng khi nhận lại",
            "🧹 Xe bẩn, có rác hoặc mùi khó chịu",
            "💰 Tranh chấp về phí phạt hoặc hoàn tiền",
            "⏰ Vấn đề về việc trả xe muộn",
          ],
        };

      // case "CANCELLED":
      //   return {
      //     title: "Hướng dẫn báo cáo đơn bị hủy",
      //     description: "Đơn đặt xe đã bị hủy. Các vấn đề có thể báo cáo:",
      //     issues: [
      //       "🚫 Khách có hành vi gian lận hoặc đặt đơn giả",
      //       "📱 Khách cố tình hủy liên tục để phá hoại hệ thống",
      //     ],
      //   };

      default:
        return null;
    }
  };

  // Handler cho nút báo cáo
  const handleReportClick = (booking: BookingData) => {
    const reportTypes = getReportTypes(booking);
    setSelectedBookingForReport(booking);
    setSelectedReportTypes(reportTypes);
    setReportGuideVisible(true);
  };

  // Handler khi đồng ý báo cáo
  const handleAgreeReport = () => {
    setReportGuideVisible(false);
    setReportModalVisible(true);
  };

  // Handler khi đóng modal báo cáo
  const handleReportModalClose = () => {
    setReportModalVisible(false);
    setSelectedReportTypes([]);
    setSelectedBookingForReport(null);
  };

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
                  <Input readOnly />
                </Form.Item>
                <Form.Item label="Số điện thoại" name="phoneNumber">
                  <Input readOnly />
                </Form.Item>
                <Form.Item label="Mã đặt xe" name="id">
                  <Input readOnly />
                </Form.Item>
                <Form.Item label="Tổng giá tiền thuê (VNĐ)" name="totalCost">
                  <InputNumber
                    readOnly
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value!.replace(/VNĐ\s?|(,*)/g, "")}
                    className="w-full"
                  />
                </Form.Item>
                <Form.Item label="Tên xe" name="vehicleThumb">
                  <Input readOnly />
                </Form.Item>
                <Form.Item label="Biển số xe" name="vehicleLicensePlate">
                  <Input readOnly />
                </Form.Item>
              </div>

              <Form.Item label="Địa chỉ" name="address">
                <Input.TextArea readOnly rows={2} />
              </Form.Item>

              <Divider>Thông tin tất toán</Divider>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Thời gian trả xe thực tế" name="timeFinish">
                  <Input readOnly value={form.getFieldValue("timeFinish")} />
                </Form.Item>
                <Form.Item
                  label="Giá trị kết toán hợp đồng (VNĐ)"
                  name="costSettlement"
                >
                  <InputNumber
                    readOnly
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
            <Button onClick={handleCancel}>Đóng</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Xác nhận tất toán
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Delivery Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CarOutlined className="text-blue-500" />
            <span>Xác nhận giao xe</span>
          </div>
        }
        open={deliveryConfirmModal}
        onCancel={hideDeliveryConfirmModal}
        footer={[
          <Button key="cancel" onClick={hideDeliveryConfirmModal}>
            Đóng
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={confirmDelivery}
            loading={loading}
            icon={<CheckCircleOutlined />}
            disabled={!isAllChecklistCompleted} // Disable nếu chưa check hết
          >
            Xác nhận đã giao xe
          </Button>,
        ]}
        width={500}
        destroyOnClose
      >
        <div className="py-4">
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <ExclamationCircleOutlined className="text-yellow-600 text-xl mt-1" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">
                  Lưu ý quan trọng khi giao xe:
                </h4>
                <p className="text-yellow-700 text-sm leading-relaxed">
                  Yêu cầu kiểm tra kỹ thông tin người thuê xe, đảm bảo rằng giấy
                  phép lái xe phải chính xác với giấy phép lái xe trên hệ thống.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Checkbox
                checked={deliveryChecklist.licenseCheck}
                onChange={(e) =>
                  setDeliveryChecklist((prev) => ({
                    ...prev,
                    licenseCheck: e.target.checked,
                  }))
                }
              />
              <span>Kiểm tra giấy phép lái xe của khách hàng</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Checkbox
                checked={deliveryChecklist.personalInfoCheck}
                onChange={(e) =>
                  setDeliveryChecklist((prev) => ({
                    ...prev,
                    personalInfoCheck: e.target.checked,
                  }))
                }
              />
              <span>Đối chiếu thông tin cá nhân với hệ thống</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Checkbox
                checked={deliveryChecklist.vehicleConditionCheck}
                onChange={(e) =>
                  setDeliveryChecklist((prev) => ({
                    ...prev,
                    vehicleConditionCheck: e.target.checked,
                  }))
                }
              />
              <span>Kiểm tra tình trạng xe trước khi giao</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Checkbox
                checked={deliveryChecklist.rulesGuidanceCheck}
                onChange={(e) =>
                  setDeliveryChecklist((prev) => ({
                    ...prev,
                    rulesGuidanceCheck: e.target.checked,
                  }))
                }
              />
              <span>Hướng dẫn khách hàng về quy định sử dụng xe</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm font-medium text-center">
              {isAllChecklistCompleted
                ? "Bạn có chắc chắn đã hoàn thành các bước kiểm tra và sẵn sàng giao xe?"
                : "Vui lòng hoàn thành tất cả các bước kiểm tra trước khi giao xe"}
            </p>
          </div>
        </div>
      </Modal>

      {/* Return Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <RollbackOutlined className="text-green-500" />
            <span>Xác nhận trả xe</span>
          </div>
        }
        open={returnConfirmModal}
        onCancel={hideReturnConfirmModal}
        footer={[
          <Button key="cancel" onClick={hideReturnConfirmModal}>
            Đóng
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={confirmReturn}
            loading={loading}
            icon={<CheckCircleOutlined />}
          >
            Tiếp tục tất toán
          </Button>,
        ]}
        width={500}
        destroyOnClose
      >
        <div className="py-4">
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <ExclamationCircleOutlined className="text-green-600 text-xl mt-1" />
              <div>
                <h4 className="font-semibold text-green-800 mb-2">
                  Những lưu ý quan trọng khi nhận xe trả lại:
                </h4>
                <p className="text-green-700 text-sm leading-relaxed">
                  Chủ xe vui lòng kiểm tra kỹ tình trạng xe trước khi xác nhận
                  nhận xe từ khách hàng.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircleOutlined className="text-green-500" />
              <span>
                {" "}
                Kiểm tra tình trạng bên ngoài xe (trầy xước, móp méo, ...)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircleOutlined className="text-green-500" />
              <span>
                Kiểm tra nội thất trong xe (ghế ngồi, vô lăng, bảng điều khiển,
                ...)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircleOutlined className="text-green-500" />
              <span> Kiểm tra mức tiêu hao nhiên liệu của xe </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircleOutlined className="text-green-500" />
              <span>Kiểm tra các giấy tờ và vật dụng của xe</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircleOutlined className="text-green-500" />
              <span>Kiểm tra số kilometer hiện tại của xe</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm font-medium text-center">
              Sau khi xác nhận, bạn sẽ được chuyển đến màn hình tất toán hợp
              đồng để điền thông tin chi tiết.
            </p>
          </div>
        </div>
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

      {/* Modal hướng dẫn báo cáo */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <ExclamationCircleOutlined className="text-red-500" />
            <span>Hướng dẫn báo cáo</span>
          </div>
        }
        open={reportGuideVisible}
        onCancel={() => setReportGuideVisible(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setReportGuideVisible(false)}>
            Đóng
          </Button>,
          <Button key="agree" type="primary" danger onClick={handleAgreeReport}>
            Đồng ý báo cáo
          </Button>,
        ]}
      >
        {selectedBookingForReport &&
          getGuideContent(selectedBookingForReport) && (
            <div className="py-4">
              {/* Thông báo cảnh báo */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <ExclamationCircleOutlined className="text-yellow-600 mt-1" />
                  <div className="text-sm text-yellow-800">
                    <div className="font-medium mb-1">Lưu ý quan trọng:</div>
                    <p>
                      Vui lòng chỉ báo cáo khi thực sự gặp vấn đề. Báo cáo sai
                      sự thật có thể dẫn đến việc tài khoản bị hạn chế.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nội dung hướng dẫn */}
              <div className="mb-6">
                <h4 className="font-semibold text-lg mb-3">
                  {getGuideContent(selectedBookingForReport)?.title}
                </h4>
                <p className="text-gray-600 mb-4">
                  {getGuideContent(selectedBookingForReport)?.description}
                </p>

                <div className="space-y-2">
                  {getGuideContent(selectedBookingForReport)?.issues.map(
                    (issue, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm">{issue}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Thông tin booking */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CarOutlined className="text-blue-600" />
                  <span className="font-medium">Thông tin đơn báo cáo:</span>
                </div>
                <div className="text-sm text-gray-700">
                  <div>
                    <strong>Mã đặt xe:</strong> {selectedBookingForReport.id}
                  </div>
                  <div>
                    <strong>Khách hàng:</strong>{" "}
                    {selectedBookingForReport.userName}
                  </div>
                  <div>
                    <strong>Xe thuê:</strong>{" "}
                    {selectedBookingForReport.vehicleThumb} - Biển số:{" "}
                    {selectedBookingForReport.vehicleLicensePlate}
                  </div>
                  <div>
                    <strong>Trạng thái:</strong>{" "}
                    {getStatusTag(selectedBookingForReport.status)}
                  </div>
                </div>
              </div>
            </div>
          )}
      </Modal>

      {/* Modal "Khách không xuất hiện?" */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ExclamationCircleOutlined className="text-red-500" />
            <span>Xác nhận khách không xuất hiện</span>
          </div>
        }
        open={noShowModalVisible}
        onCancel={hideNoShowModal}
        footer={[
          <Button key="cancel" onClick={hideNoShowModal}>
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={handleNoShow}
            loading={loading}
          >
            Xác nhận
          </Button>,
        ]}
        width={600}
        destroyOnClose
      >
        <div className="py-4">
          {/* Cảnh báo nghiêm trọng */}
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <ExclamationCircleOutlined className="text-red-600 text-2xl mt-1" />
              <div>
                <h4 className="font-bold text-red-800 mb-2 text-lg">
                  ⚠️ CẢNH BÁO NGHIÊM TRỌNG
                </h4>
                <div className="text-red-700 text-sm space-y-2">
                  <p className="font-semibold">
                    Nếu thông tin không chính xác, bạn sẽ bị báo cáo và tài
                    khoản có thể bị cấm vĩnh viễn.
                  </p>
                  <p>Chỉ xác nhận &quot;khách không xuất hiện&quot; khi:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Đã quá giờ hẹn giao xe</li>
                    <li>Đã cố gắng liên lạc với khách hàng nhiều lần</li>
                    <li>Khách hàng không phản hồi hoặc không đến nhận xe</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin đơn hàng */}
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">
              Thông tin đơn hàng:
            </h4>
            {selectedNoShowBookingId && (
              <div className="space-y-2 text-sm">
                {(() => {
                  const booking = bookings.find(
                    (b) => b.id === selectedNoShowBookingId
                  );
                  if (!booking) return null;

                  const pickupTime = new Date(
                    booking.timeBookingStart[0],
                    booking.timeBookingStart[1] - 1,
                    booking.timeBookingStart[2],
                    booking.timeBookingStart[3] || 0,
                    booking.timeBookingStart[4] || 0
                  );

                  return (
                    <>
                      <div>
                        <strong>Mã đặt xe:</strong> {booking.id}
                      </div>
                      <div>
                        <strong>Khách hàng:</strong> {booking.userName}
                      </div>
                      <div>
                        <strong>Số điện thoại:</strong> {booking.phoneNumber}
                      </div>
                      <div>
                        <strong>Xe thuê:</strong> {booking.vehicleThumb} -{" "}
                        {booking.vehicleLicensePlate}
                      </div>
                      <div>
                        <strong>Giờ hẹn nhận xe:</strong>{" "}
                        {pickupTime.toLocaleString("vi-VN")}
                      </div>
                      <div className="text-red-600">
                        <strong>Đã trễ:</strong>{" "}
                        {(() => {
                          const lateMs = Date.now() - pickupTime.getTime();
                          const lateMinutes = Math.floor(lateMs / (1000 * 60));
                          const days = Math.floor(lateMinutes / (60 * 24));
                          const hours = Math.floor(
                            (lateMinutes % (60 * 24)) / 60
                          );
                          const minutes = lateMinutes % 60;
                          let result = "";
                          if (days > 0) result += `${days} ngày `;
                          if (hours > 0) result += `${hours} giờ `;
                          result += `${minutes} phút`;
                          return result.trim();
                        })()}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Xác nhận cuối cùng */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <QuestionCircleOutlined className="text-yellow-600 mt-1" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">
                  Bạn có chắc chắn khách hàng không xuất hiện để nhận xe không?
                </p>
                <p>
                  Hành động này sẽ hủy đơn hàng và có thể ảnh hưởng đến uy tín
                  của khách hàng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ReportButton Modal - Chỉ render khi cần */}
      {reportModalVisible &&
        selectedReportTypes.length > 0 &&
        selectedBookingForReport &&
        (selectedReportTypes.length === 1 ? (
          <ReportButton
            key={`report-${selectedBookingForReport.id}-${
              selectedReportTypes[0]
            }-${Date.now()}`} // Thêm key unique
            targetId={selectedBookingForReport.userId}
            reportType={selectedReportTypes[0]}
            booking={selectedBookingForReport.id} // Sửa từ booking thành bookingId
            buttonText=""
            size="small"
            type="text"
            icon={false}
            autoOpen={true}
            onModalClose={handleReportModalClose}
          />
        ) : (
          <ReportButton
            key={`report-multi-${
              selectedBookingForReport.id
            }-${selectedReportTypes.join("-")}-${Date.now()}`} // Thêm key unique
            targetId={selectedBookingForReport.userId}
            reportTypes={selectedReportTypes}
            booking={selectedBookingForReport.id} // Sửa từ booking thành bookingId
            showTypeSelector={true}
            buttonText=""
            size="small"
            type="text"
            icon={false}
            autoOpen={true}
            onModalClose={handleReportModalClose}
          />
        ))}
    </div>
  );
}

// Set layout for the component
ManageAcceptedBookings.Layout = ProviderLayout;
