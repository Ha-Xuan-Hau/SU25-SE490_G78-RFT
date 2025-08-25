"use client";

import { useState, useEffect } from "react";
import { Typography, Table, Button, Tag, Input, Avatar, Tooltip } from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  UserOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";
import { getAllBookings } from "@/apis/admin.api";
import { showApiError, showApiSuccess } from "@/utils/toast.utils";
import { BookingResponseDTO } from "@/types/booking";

const { Title } = Typography;
const { Search } = Input;

export default function ManageBookingsPage() {
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<BookingResponseDTO[]>([]);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  // Format timestamp function
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

  // Fetch bookings data
  const fetchBookings = async (page = 1, size = 10, search = "") => {
    setLoading(true);
    try {
      const response = await getAllBookings({
        page: page - 1,
        size,
        search,
      });

      if (response.content) {
        setBookings(response.content);
        setTotal(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        setBookings(response);
        setTotal(response.length);
      } else if (response.data) {
        setBookings(response.data);
        setTotal(response.total || response.data.length);
      } else {
        setBookings([]);
        setTotal(0);
      }
    } catch (error) {
      showApiError(error, "Không thể tải danh sách đặt xe");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(currentPage, pageSize, searchText);
  }, [currentPage, pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText || searchText === "") {
        setCurrentPage(1);
        fetchBookings(1, pageSize, searchText);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  const filteredBookings = bookings.filter((booking) => {
    if (!searchText) return true;

    const searchLower = searchText.toLowerCase();
    return (
      booking.user?.fullName?.toLowerCase().includes(searchLower) ||
      booking.user?.email?.toLowerCase().includes(searchLower) ||
      booking.id?.toLowerCase().includes(searchLower) ||
      booking.codeTransaction?.toLowerCase().includes(searchLower) ||
      booking.phoneNumber?.includes(searchLower) ||
      booking.address?.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = (bookingId: string) => {
    router.push(`/booking-detail/${bookingId}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showApiSuccess("Đã copy vào clipboard");
  };

  // Màu sắc cho từng trạng thái
  const getStatusColor = (status: string) => {
    switch (status) {
      case "UNPAID":
        return "default"; // Màu đen/xám
      case "PENDING":
        return "warning"; // Màu vàng
      case "CONFIRMED":
        return "processing"; // Màu xanh dương
      case "CANCELLED":
        return "error"; // Màu đỏ
      case "DELIVERED":
      case "DELIVERING":
        return "cyan"; // Màu cyan
      case "RECEIVED_BY_CUSTOMER":
        return "blue"; // Màu xanh
      case "RETURNED":
        return "purple"; // Màu tím
      case "COMPLETED":
        return "success"; // Màu xanh lá
      default:
        return "default";
    }
  };

  // Text hiển thị cho từng trạng thái
  const getStatusText = (status: string) => {
    switch (status) {
      case "UNPAID":
        return "Chưa thanh toán";
      case "PENDING":
        return "Chờ xác nhận";
      case "CONFIRMED":
        return "Đã xác nhận";
      case "CANCELLED":
        return "Đã hủy";
      case "DELIVERED":
      case "DELIVERING":
        return "Đã giao xe";
      case "RECEIVED_BY_CUSTOMER":
        return "Khách đã nhận";
      case "RETURNED":
        return "Đã trả xe";
      case "COMPLETED":
        return "Hoàn thành";
      default:
        return status;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const columns: ColumnsType<BookingResponseDTO> = [
    {
      title: "STT",
      key: "index",
      width: 50,
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
      align: "center",
      fixed: "left",
    },
    {
      title: "Mã đặt xe",
      dataIndex: "id",
      key: "id",
      width: 120,
      render: (id) => (
        <div className="flex items-center gap-1">
          <Tooltip title={id}>
            <span className="font-mono text-xs font-semibold cursor-pointer">
              {id.split("-")[0]}...
            </span>
          </Tooltip>
          <Tooltip title="Copy ID">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(id)}
              className="p-0 h-4 w-4 text-gray-400 hover:text-blue-500"
            />
          </Tooltip>
        </div>
      ),
      sorter: (a, b) => a.id.localeCompare(b.id),
      fixed: "left",
    },
    {
      title: "Khách hàng",
      key: "user",
      width: 200,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Avatar
            src={record.user?.profilePicture}
            icon={<UserOutlined />}
            size="small"
          />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm truncate">
              {record.user?.fullName || "N/A"}
            </div>
            {/* <div className="text-xs text-gray-500 truncate">
              {record.user?.email || "N/A"}
            </div> */}
            <div className="text-xs text-gray-500">
              {record.phoneNumber || record.user?.phone || "N/A"}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) =>
        (a.user?.fullName || "").localeCompare(b.user?.fullName || ""),
    },
    // {
    //   title: "Xe thuê",
    //   key: "vehicles",
    //   width: 150,
    //   render: (_, record) => (
    //     <div className="text-xs">
    //       {record.vehicles && record.vehicles.length > 0 ? (
    //         <>
    //           <div className="font-medium">
    //             {record.vehicles[0].vehicleThumb}
    //           </div>
    //           <div className="text-gray-500">
    //             {record.vehicles[0].vehicleLicensePlate}
    //           </div>
    //           {record.vehicles.length > 1 && (
    //             <div className="text-blue-600">
    //               +{record.vehicles.length - 1} xe khác
    //             </div>
    //           )}
    //         </>
    //       ) : (
    //         <span className="text-gray-400">Không có thông tin</span>
    //       )}
    //     </div>
    //   ),
    // },
    {
      title: "Thời gian thuê",
      key: "duration",
      width: 160,
      render: (_, record) => {
        const startFormatted = formatTimestamp(record.timeBookingStart);
        const endFormatted = formatTimestamp(record.timeBookingEnd);

        // Hàm tính thời lượng thuê
        const calculateDuration = () => {
          let startDate: Date | null = null;
          let endDate: Date | null = null;

          // Xử lý các định dạng timestamp khác nhau
          if (
            Array.isArray(record.timeBookingStart) &&
            Array.isArray(record.timeBookingEnd)
          ) {
            if (
              record.timeBookingStart.length >= 5 &&
              record.timeBookingEnd.length >= 5
            ) {
              const [startYear, startMonth, startDay, startHour, startMinute] =
                record.timeBookingStart;
              const [endYear, endMonth, endDay, endHour, endMinute] =
                record.timeBookingEnd;
              startDate = new Date(
                startYear,
                startMonth - 1,
                startDay,
                startHour,
                startMinute
              );
              endDate = new Date(
                endYear,
                endMonth - 1,
                endDay,
                endHour,
                endMinute
              );
            }
          } else if (
            typeof record.timeBookingStart === "number" &&
            typeof record.timeBookingEnd === "number"
          ) {
            startDate = new Date(record.timeBookingStart * 1000);
            endDate = new Date(record.timeBookingEnd * 1000);
          } else if (
            typeof record.timeBookingStart === "string" &&
            typeof record.timeBookingEnd === "string"
          ) {
            startDate = new Date(record.timeBookingStart);
            endDate = new Date(record.timeBookingEnd);
          }

          if (
            !startDate ||
            !endDate ||
            isNaN(startDate.getTime()) ||
            isNaN(endDate.getTime())
          ) {
            return "";
          }

          const diffMs = endDate.getTime() - startDate.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor(
            (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const diffMinutes = Math.floor(
            (diffMs % (1000 * 60 * 60)) / (1000 * 60)
          );

          if (diffDays > 0) {
            return `${diffDays} ngày ${
              diffHours > 0 ? diffHours + " giờ" : ""
            }`;
          } else if (diffHours > 0) {
            return `${diffHours} giờ ${
              diffMinutes > 0 ? diffMinutes + " phút" : ""
            }`;
          } else if (diffMinutes > 0) {
            return `${diffMinutes} phút`;
          }
          return "";
        };

        const duration = record.rentalDuration || calculateDuration();

        return (
          <div className="text-xs">
            <div className="text-primary font-medium">
              {startFormatted
                ? startFormatted.split(" ")[0] +
                  " " +
                  startFormatted.split(" ")[1]
                : "-"}
            </div>
            <div className="text-gray-400">đến</div>
            <div className="text-primary font-medium">
              {endFormatted
                ? endFormatted.split(" ")[0] + " " + endFormatted.split(" ")[1]
                : "-"}
            </div>
            {duration && (
              <div className="text-blue-600 font-semibold mt-1">{duration}</div>
            )}
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
        <div>
          <div className="font-semibold text-sm">{formatAmount(cost || 0)}</div>
        </div>
      ),
      sorter: (a, b) => (a.totalCost || 0) - (b.totalCost || 0),
      align: "right",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => (
        <Tag color={getStatusColor(status)} className="text-xs">
          {getStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: "Chưa thanh toán", value: "UNPAID" },
        { text: "Chờ xác nhận", value: "PENDING" },
        { text: "Đã xác nhận", value: "CONFIRMED" },
        { text: "Đã hủy", value: "CANCELLED" },
        { text: "Đã giao xe", value: "DELIVERED" },
        { text: "Khách đã nhận", value: "RECEIVED_BY_CUSTOMER" },
        { text: "Đã trả xe", value: "RETURNED" },
        { text: "Hoàn thành", value: "COMPLETED" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Ngày đặt",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (createdAt) => (
        <span className="text-gray-600 text-xs">
          {formatTimestamp(createdAt)}
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 80,
      render: (_, record) => (
        <a
          href={`/booking-detail/${record.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button type="primary" icon={<EyeOutlined />} size="small">
            Chi tiết
          </Button>
        </a>
      ),
      align: "center",
      fixed: "right",
    },
  ];

  // Đếm số lượng cho TẤT CẢ 8 trạng thái
  const getStatusCounts = () => {
    return {
      unpaid: bookings.filter((b) => b.status === "UNPAID").length,
      pending: bookings.filter((b) => b.status === "PENDING").length,
      confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
      delivered: bookings.filter(
        (b) => b.status === "DELIVERED" || b.status === "DELIVERING"
      ).length,
      receivedByCustomer: bookings.filter(
        (b) => b.status === "RECEIVED_BY_CUSTOMER"
      ).length,
      returned: bookings.filter((b) => b.status === "RETURNED").length,
      completed: bookings.filter((b) => b.status === "COMPLETED").length,
      cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div>
        <Title level={2} className="!mb-2">
          Quản lý đặt xe
        </Title>
        <p className="text-gray-600">
          Xem và theo dõi tất cả các đơn đặt xe trong hệ thống
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Search
              placeholder="Tìm kiếm theo tên, email, mã đặt xe, mã giao dịch..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>
              Tổng:{" "}
              <span className="font-semibold text-lg">
                {total || filteredBookings.length}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Cards - HIỂN THỊ ĐẦY ĐỦ 8 TRẠNG THÁI */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-gray-800">
          <div className="text-xs text-gray-500">Chưa thanh toán</div>
          <div className="text-2xl font-bold text-gray-800">
            {statusCounts.unpaid}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <div className="text-xs text-gray-500">Chờ xác nhận</div>
          <div className="text-2xl font-bold text-yellow-600">
            {statusCounts.pending}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="text-xs text-gray-500">Đã xác nhận</div>
          <div className="text-2xl font-bold text-blue-600">
            {statusCounts.confirmed}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-cyan-500">
          <div className="text-xs text-gray-500">Đã giao xe</div>
          <div className="text-2xl font-bold text-cyan-600">
            {statusCounts.delivered}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-indigo-500">
          <div className="text-xs text-gray-500">Khách đã nhận</div>
          <div className="text-2xl font-bold text-indigo-600">
            {statusCounts.receivedByCustomer}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="text-xs text-gray-500">Đã trả xe</div>
          <div className="text-2xl font-bold text-purple-600">
            {statusCounts.returned}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="text-xs text-gray-500">Hoàn thành</div>
          <div className="text-2xl font-bold text-green-600">
            {statusCounts.completed}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
          <div className="text-xs text-gray-500">Đã hủy</div>
          <div className="text-2xl font-bold text-red-600">
            {statusCounts.cancelled}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <Table
            columns={columns}
            dataSource={filteredBookings}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total || filteredBookings.length,
              showSizeChanger: false, // ✅ Tắt option chọn số lượng/trang
              showQuickJumper: false, // ✅ Tắt ô nhập số trang (optional)
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size || 10);
              },
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} đơn đặt xe`,
            }}
            scroll={{ x: 1200, y: 600 }}
            className="border-0"
            size="small"
          />
        </div>
      </div>
    </div>
  );
}

ManageBookingsPage.Layout = AdminLayout;
