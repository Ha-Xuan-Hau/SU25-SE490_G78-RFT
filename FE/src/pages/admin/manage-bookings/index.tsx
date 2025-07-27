"use client";

import { useState } from "react";
import { Typography, Table, Button, Tag, Input, Avatar, Tooltip } from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  CalendarOutlined,
  UserOutlined,
  MailOutlined,
  CarOutlined,
  DollarOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

const { Title } = Typography;
const { Search } = Input;

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  phoneNumber: string;
  address: string;
  timeBookingStart: string;
  timeBookingEnd: string;
  codeTransaction: string;
  timeTransaction: string;
  totalCost: number;
  status:
    | "UNPAID"
    | "PENDING"
    | "CONFIRMED"
    | "CANCELLED"
    | "DELIVERED"
    | "RECEIVED_BY_CUSTOMER"
    | "RETURNED"
    | "COMPLETED";
  penaltyType: "PERCENT" | "FIXED";
  penaltyValue: number;
  minCancelHour: number;
  couponId?: string;
  createdAt: string;
  updatedAt: string;
}

// Mockup data với ID dài
const mockBookings: Booking[] = [
  {
    id: "3f4f6195-e7ee-4dc1-91dd-c6f24a42f95b",
    userId: "user_003",
    userName: "Lê Minh Cường",
    userEmail: "leminhcuong@gmail.com",
    phoneNumber: "0901234567",
    address: "456 Đường Nguyễn Huệ, Quận 3, TP.HCM",
    timeBookingStart: "2025-07-20T18:00:00Z",
    timeBookingEnd: "2025-07-22T07:00:00Z",
    codeTransaction: "BOOK-4E2X56F",
    timeTransaction: "2025-07-20T15:30:00Z",
    totalCost: 680000,
    status: "CONFIRMED",
    penaltyType: "PERCENT",
    penaltyValue: 10.0,
    minCancelHour: 24,
    couponId: "coupon_003",
    createdAt: "2025-07-20T14:30:00Z",
    updatedAt: "2025-07-20T15:45:00Z",
  },
  {
    id: "3f4f6195-e7ee-4dc1-91dd-c6f24a42f95b",
    userId: "user_003",
    userName: "Lê Minh Cường",
    userEmail: "leminhcuong@gmail.com",
    phoneNumber: "0901234567",
    address: "456 Đường Nguyễn Huệ, Quận 3, TP.HCM",
    timeBookingStart: "2025-07-20T15:00:00Z",
    timeBookingEnd: "2025-07-22T07:00:00Z",
    codeTransaction: "BOOK-NPE4176",
    timeTransaction: "2025-07-20T14:45:00Z",
    totalCost: 750000,
    status: "DELIVERED",
    penaltyType: "PERCENT",
    penaltyValue: 10.0,
    minCancelHour: 24,
    createdAt: "2025-07-20T14:30:00Z",
    updatedAt: "2025-07-21T16:20:00Z",
  },
];

export default function ManageBookingsPage() {
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  // Filter bookings based on search text
  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchText.toLowerCase();
    return (
      booking.userName.toLowerCase().includes(searchLower) ||
      booking.userEmail.toLowerCase().includes(searchLower) ||
      booking.id.toLowerCase().includes(searchLower) ||
      booking.codeTransaction.toLowerCase().includes(searchLower) ||
      booking.phoneNumber.includes(searchLower) ||
      booking.address.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = (bookingId: string) => {
    router.push(`/booking-detail/${bookingId}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UNPAID":
        return "error";
      case "PENDING":
        return "warning";
      case "CONFIRMED":
        return "processing";
      case "CANCELLED":
        return "default";
      case "DELIVERED":
        return "cyan";
      case "RECEIVED_BY_CUSTOMER":
        return "blue";
      case "RETURNED":
        return "purple";
      case "COMPLETED":
        return "success";
      default:
        return "default";
    }
  };

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

  const calculateDuration = (start: string, end: string) => {
    const startTime = dayjs(start);
    const endTime = dayjs(end);
    const hours = endTime.diff(startTime, "hour");
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return `${days} ngày${remainingHours > 0 ? ` ${remainingHours}h` : ""}`;
    }
    return `${hours}h`;
  };

  const columns: ColumnsType<Booking> = [
    {
      title: "STT",
      key: "index",
      width: 50,
      render: (_, __, index) => index + 1,
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
          <Avatar icon={<UserOutlined />} size="small" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm truncate">
              {record.userName}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {record.userEmail}
            </div>
            <div className="text-xs text-gray-500">📱 {record.phoneNumber}</div>
          </div>
        </div>
      ),
      sorter: (a, b) => a.userName.localeCompare(b.userName),
    },
    {
      title: "Thời gian thuê",
      key: "duration",
      width: 140,
      render: (_, record) => (
        <div className="text-xs">
          <div className="text-primary font-medium">
            {dayjs(record.timeBookingStart).format("DD/MM HH:mm")}
          </div>
          <div className="text-gray-400">đến</div>
          <div className="text-primary font-medium">
            {dayjs(record.timeBookingEnd).format("DD/MM HH:mm")}
          </div>
          <div className="text-blue-600 font-semibold">
            ({calculateDuration(record.timeBookingStart, record.timeBookingEnd)}
            )
          </div>
        </div>
      ),
      sorter: (a, b) =>
        dayjs(a.timeBookingStart).unix() - dayjs(b.timeBookingStart).unix(),
    },
    {
      title: "Mã GD",
      dataIndex: "codeTransaction",
      key: "codeTransaction",
      width: 100,
      render: (code) => (
        <Tooltip title={code}>
          <span className="font-mono text-xs font-semibold">{code}</span>
        </Tooltip>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalCost",
      key: "totalCost",
      width: 100,
      render: (cost) => (
        <span className="font-semibold text-sm">{formatAmount(cost)}</span>
      ),
      sorter: (a, b) => a.totalCost - b.totalCost,
      align: "right",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
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
      width: 100,
      render: (createdAt) => (
        <span className="text-gray-600 text-xs">
          {dayjs(createdAt).format("DD/MM/YY HH:mm")}
        </span>
      ),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 80,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewDetails(record.id)}
        >
          Chi tiết
        </Button>
      ),
      align: "center",
      fixed: "right",
    },
  ];

  const getStatusCounts = () => {
    return {
      unpaid: bookings.filter((b) => b.status === "UNPAID").length,
      pending: bookings.filter((b) => b.status === "PENDING").length,
      confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
      delivered: bookings.filter((b) => b.status === "DELIVERED").length,
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
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span>
              Chờ xác nhận:{" "}
              <span className="font-semibold">{statusCounts.pending}</span>
            </span>
            <span>
              Đã xác nhận:{" "}
              <span className="font-semibold">{statusCounts.confirmed}</span>
            </span>
            <span>
              Hoàn thành:{" "}
              <span className="font-semibold">{statusCounts.completed}</span>
            </span>
            <span>
              Tổng:{" "}
              <span className="font-semibold">{filteredBookings.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">Chưa thanh toán</div>
          <div className="text-xl font-semibold">{statusCounts.unpaid}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">Chờ xác nhận</div>
          <div className="text-xl font-semibold">{statusCounts.pending}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">Đã xác nhận</div>
          <div className="text-xl font-semibold">{statusCounts.confirmed}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">Đã giao xe</div>
          <div className="text-xl font-semibold">{statusCounts.delivered}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">Hoàn thành</div>
          <div className="text-xl font-semibold">{statusCounts.completed}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">Đã hủy</div>
          <div className="text-xl font-semibold">{statusCounts.cancelled}</div>
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
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} đơn đặt xe`,
            }}
            scroll={{ x: 1000, y: 600 }}
            className="border-0"
            size="small"
          />
        </div>
      </div>
    </div>
  );
}

ManageBookingsPage.Layout = AdminLayout;
