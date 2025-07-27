"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Tabs,
  Button,
  Input,
  Modal,
  Image,
  Tag,
  Card,
  Typography,
  Avatar,
} from "antd";
import { SearchOutlined, EyeOutlined, UserOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "@/layouts/AdminLayout";

const { Title } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;

// Types based on API response
interface VehicleFeature {
  name: string;
}

interface VehicleImage {
  imageUrl: string;
}

interface Penalty {
  id: string;
  userId?: string;
  userName?: string;
  penaltyType: string;
  penaltyValue: number;
  minCancelHour: number;
  description: string;
}

interface ExtraFeeRule {
  maxKmPerDay?: number;
  feePerExtraKm?: number;
  allowedHourLate?: number;
  feePerExtraHour?: number;
  cleaningFee?: number;
  smellRemovalFee?: number;
  batteryChargeFeePerPercent?: number;
  apply_batteryChargeFee?: boolean;
  driverFeePerDay?: number;
  hasDriverOption?: boolean;
  driverFeePerHour?: number;
  hasHourlyRental?: boolean;
}

interface Vehicle {
  id: string;
  licensePlate?: string;
  vehicleType: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userProfilePicture?: string;
  vehicleFeatures: VehicleFeature[];
  vehicleImages: VehicleImage[];
  haveDriver: string;
  insuranceStatus: string;
  shipToAddress: string;
  description: string;
  costPerDay: number;
  status: string;
  thumb: string;
  numberSeat?: number;
  yearManufacture: number;
  transmission: string;
  fuelType: string;
  numberVehicle: number;
  brandName: string;
  modelName?: string;
  totalRatings: number;
  rating?: number;
  address: string;
  userComments?: any;
  openTime: string;
  closeTime: string;
  penalty: Penalty;
  extraFeeRule?: ExtraFeeRule;
}

// Mock data dựa trên API response
const mockCarData: Vehicle[] = [
  {
    id: "vehicle_005",
    licensePlate: "51A-12349",
    vehicleType: "CAR",
    userId: "user_001",
    userName: "Nguyễn Văn An",
    userEmail: "nguyenvanan@gmail.com",
    userProfilePicture:
      "https://res.cloudinary.com/dcakldjvc/image/upload/v1752737886/uwtsvefnelh2l1uec4pt.jpg",
    vehicleFeatures: [
      { name: "GPS" },
      { name: "Bluetooth" },
      { name: "Air Conditioning" },
      { name: "Electric Charging" },
    ],
    vehicleImages: [
      {
        imageUrl:
          "https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*",
      },
      {
        imageUrl:
          "https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*",
      },
      {
        imageUrl:
          "https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*",
      },
      {
        imageUrl:
          "https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*",
      },
    ],
    haveDriver: "NO",
    insuranceStatus: "YES",
    shipToAddress: "YES",
    description: "Hyundai Elantra 2021, xe sedan thiết kế hiện đại",
    costPerDay: 700000,
    status: "AVAILABLE",
    thumb: "Hyundai Elantra 2021",
    numberSeat: 5,
    yearManufacture: 2021,
    transmission: "AUTOMATIC",
    fuelType: "GASOLINE",
    numberVehicle: 1,
    brandName: "Hyundai",
    modelName: "4 chỗ (Sedan)",
    totalRatings: 10,
    address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
    openTime: "00:00:00",
    closeTime: "00:00:00",
    penalty: {
      id: "penalty_001",
      penaltyType: "PERCENT",
      penaltyValue: 10,
      minCancelHour: 24,
      description: "Phạt 10% nếu hủy trong vòng 24 giờ",
    },
    extraFeeRule: {
      maxKmPerDay: 300,
      feePerExtraKm: 4500,
      allowedHourLate: 2,
      feePerExtraHour: 45000,
      cleaningFee: 90000,
      smellRemovalFee: 130000,
      driverFeePerDay: 280000,
      hasDriverOption: true,
      driverFeePerHour: 90000,
      hasHourlyRental: true,
    },
  },
];

const mockMotorbikeGroups: Vehicle[] = [
  {
    id: "vehicle_001",
    licensePlate: "51B1-12356",
    vehicleType: "MOTORBIKE",
    userId: "user_001",
    userName: "Nguyễn Văn An",
    userEmail: "nguyenvanan@gmail.com",
    userProfilePicture:
      "https://res.cloudinary.com/dcakldjvc/image/upload/v1752737886/uwtsvefnelh2l1uec4pt.jpg",
    vehicleFeatures: [{ name: "Phanh ABS" }],
    vehicleImages: [
      {
        imageUrl:
          "https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*",
      },
      {
        imageUrl:
          "https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*",
      },
      {
        imageUrl:
          "https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*",
      },
      {
        imageUrl:
          "https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*",
      },
    ],
    haveDriver: "NO",
    insuranceStatus: "YES",
    shipToAddress: "YES",
    description: "Yamaha Jupiter 2020, xe ga tiết kiệm nhiên liệu",
    costPerDay: 170000,
    status: "AVAILABLE",
    thumb: "Yamaha Jupiter 2020",
    yearManufacture: 2020,
    transmission: "AUTOMATIC",
    fuelType: "GASOLINE",
    numberVehicle: 1,
    brandName: "Yamaha",
    totalRatings: 8,
    address: "456 Đường Nguyễn Huệ, Quận 3, TP.HCM",
    openTime: "07:00:00",
    closeTime: "22:00:00",
    penalty: {
      id: "penalty_002",
      penaltyType: "FIXED",
      penaltyValue: 50000,
      minCancelHour: 12,
      description:
        "Phí hủy cố định 50.000 ₫ nếu hủy quá 12 giờ sau khi đơn đặt xe được chấp nhận",
    },
  },
];

export default function VehiclePendingPage() {
  const [activeTab, setActiveTab] = useState("CAR");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // Modal states
  const [vehicleDetailModal, setVehicleDetailModal] = useState<{
    open: boolean;
    vehicle: Vehicle | null;
  }>({
    open: false,
    vehicle: null,
  });

  // Get current data and stats
  const getCurrentData = () => {
    switch (activeTab) {
      case "CAR":
        return mockCarData;
      case "MOTORBIKE":
        return mockMotorbikeGroups;
      case "BICYCLE":
        return mockMotorbikeGroups; // Use same structure for bicycle
      default:
        return [];
    }
  };

  const getAllVehicles = () => {
    const cars = mockCarData;
    const motorbikes = mockMotorbikeGroups;
    return [...cars, ...motorbikes];
  };

  const filteredData = getCurrentData().filter((item: any) => {
    if (activeTab === "CAR") {
      const vehicle = item as Vehicle;
      const matchesSearch =
        vehicle.thumb.toLowerCase().includes(searchText.toLowerCase()) ||
        vehicle.userName.toLowerCase().includes(searchText.toLowerCase()) ||
        (vehicle.licensePlate &&
          vehicle.licensePlate
            .toLowerCase()
            .includes(searchText.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || vehicle.status === statusFilter;

      return matchesSearch && matchesStatus;
    }
  });

  // Columns cho xe ô tô (hiển thị từng xe)
  const carColumns: ColumnsType<Vehicle> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
      align: "center",
    },
    {
      title: "Hình ảnh",
      key: "image",
      width: 100,
      render: (_, record) => (
        <Image
          src={record.vehicleImages?.[0]?.imageUrl || "/placeholder-car.jpg"}
          alt="Vehicle"
          width={60}
          height={45}
          className="rounded-lg object-cover"
          fallback="/placeholder-car.jpg"
        />
      ),
      align: "center",
    },
    {
      title: "Tên xe",
      key: "vehicleName",
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">{record.thumb}</div>
          <div className="text-sm text-gray-500">
            {record.brandName} {record.modelName && `• ${record.modelName}`}
          </div>
        </div>
      ),
    },
    {
      title: "Biển số",
      dataIndex: "licensePlate",
      key: "licensePlate",
      render: (licensePlate) => (
        <Tag color="blue" className="font-mono">
          {licensePlate}
        </Tag>
      ),
    },
    {
      title: "Chủ xe",
      key: "owner",
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">{record.userName}</div>
          <div className="text-sm text-gray-500">{record.userEmail}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => (
        <Tag
          color={record.status === "AVAILABLE" ? "green" : "orange"}
          className="rounded-full px-3 py-1"
        >
          {record.status === "AVAILABLE" ? "Đang hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => setVehicleDetailModal({ open: true, vehicle: record })}
        >
          Xem chi tiết
        </Button>
      ),
      align: "center",
    },
  ];

  // Columns cho xe máy/xe đạp (hiển thị nhóm)
  const groupColumns: ColumnsType<Vehicle> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
      align: "center",
    },
    {
      title: "Hình ảnh",
      key: "image",
      width: 100,
      render: (_, record) => (
        <Image
          src={record.vehicleImages?.[0]?.imageUrl || "/placeholder-car.jpg"}
          alt="Vehicle"
          width={60}
          height={45}
          className="rounded-lg object-cover"
          fallback="/placeholder-car.jpg"
        />
      ),
      align: "center",
    },
    {
      title: "Tên xe",
      key: "vehicleName",
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">{record.thumb}</div>
          <div className="text-sm text-gray-500">
            {record.brandName} {record.modelName && `• ${record.modelName}`}
          </div>
        </div>
      ),
    },
    {
      title: "Biển số",
      dataIndex: "licensePlate",
      key: "licensePlate",
      render: (licensePlate) => (
        <Tag color="blue" className="font-mono">
          {licensePlate}
        </Tag>
      ),
    },
    {
      title: "Chủ xe",
      key: "owner",
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">{record.userName}</div>
          <div className="text-sm text-gray-500">{record.userEmail}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => (
        <Tag
          color={record.status === "AVAILABLE" ? "green" : "orange"}
          className="rounded-full px-3 py-1"
        >
          {record.status === "AVAILABLE" ? "Đang hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => setVehicleDetailModal({ open: true, vehicle: record })}
        >
          Xem chi tiết
        </Button>
      ),
      align: "center",
    },
  ];

  const getCurrentColumns = () => {
    return activeTab === "CAR" ? carColumns : groupColumns;
  };

  // Tab items with counts
  const allVehicles = getAllVehicles();
  const tabItems = [
    {
      key: "CAR",
      label: `Xe ô tô (${mockCarData.length})`,
    },
    {
      key: "MOTORBIKE",
      label: `Xe máy (${mockMotorbikeGroups.length})`,
    },
    {
      key: "BICYCLE",
      label: `Xe đạp (${mockMotorbikeGroups.length})`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Title level={2} className="!mb-2">
          Quản lý phương tiện
        </Title>
        <p className="text-gray-600">
          Xem và giám sát tất cả phương tiện trong hệ thống
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Search
              placeholder="Tìm kiếm theo tên xe, biển số, chủ xe..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabs and Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="px-6 pt-4"
        />

        <div className="px-6 pb-6">
          <Table
            columns={getCurrentColumns() as any}
            dataSource={filteredData}
            loading={loading}
            rowKey={(record: any) =>
              record.id || `${record.thumb}-${record.vehicleNumber}`
            }
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} ${
                  activeTab === "CAR" ? "xe" : "nhóm xe"
                }`,
            }}
            scroll={{ x: 800 }}
            className="border-0"
          />
        </div>
      </div>

      {/* Vehicle Detail Modal */}
      <VehicleDetailModal
        open={vehicleDetailModal.open}
        vehicle={vehicleDetailModal.vehicle}
        onClose={() => setVehicleDetailModal({ open: false, vehicle: null })}
      />
    </div>
  );
}

// VehicleDetailModal Component
const VehicleDetailModal: React.FC<{
  open: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
}> = ({ open, vehicle, onClose }) => {
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (!vehicle) return null;

  const handleApprove = () => {
    // Logic to approve the vehicle (e.g., call API)
    console.log("Approved vehicle:", vehicle.id);
    onClose();
  };

  const handleReject = () => {
    // Logic to reject the vehicle (e.g., call API with rejectReason)
    console.log("Rejected vehicle:", vehicle.id, "Reason:", rejectReason);
    setRejectReason(""); // Clear the reason after rejection
    onClose();
  };

  const translateFuelType = (fuelType: string) => {
    switch (fuelType) {
      case "GASOLINE":
        return "Xăng";
      case "ELECTRIC":
        return "Điện";
      case "DIESEL":
        return "Dầu";
      case "HYBRID":
        return "Hybrid";
      default:
        return fuelType;
    }
  };

  const translateTransmission = (transmission: string) => {
    switch (transmission) {
      case "AUTOMATIC":
        return "Hộp số tự động";
      case "MANUAL":
        return "Hộp số sàn";
      default:
        return transmission;
    }
  };

  return (
    <Modal
      title={
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pb-4 border-b border-gray-100">
          <Avatar
            src={vehicle?.userProfilePicture}
            icon={<UserOutlined />}
            size={40}
          />
          <div className="flex-1">
            <div className="font-semibold text-base sm:text-lg">
              Chi tiết phương tiện
            </div>
            <div className="text-sm text-gray-500 break-words">
              {vehicle.thumb}
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button
          key="approve"
          type="primary"
          onClick={() => setIsConfirmModalVisible(true)}
        >
          Duyệt xe
        </Button>,
        <Button
          key="reject"
          type="default"
          onClick={() => setIsRejectModalVisible(true)}
        >
          Từ chối
        </Button>,
        <Button key="close" onClick={onClose} className="w-full sm:w-auto">
          Đóng
        </Button>,
      ]}
      width="95vw"
      style={{ maxWidth: "1200px" }}
      className="top-4 sm:top-8"
      bodyStyle={{ maxHeight: "80vh", overflowY: "auto" }}
    >
      <div className="pt-4 space-y-4 sm:space-y-6">
        {/* Vehicle Images */}
        <Card title="Hình ảnh xe" size="small">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {vehicle.vehicleImages?.map((img, index) => (
              <div key={index} className="relative">
                <Image
                  src={img.imageUrl}
                  alt={`Vehicle ${index + 1}`}
                  className="rounded-lg object-cover w-full h-24 sm:h-32"
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Main Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Basic Info */}
          <Card title="Thông tin cơ bản" size="small" className="lg:col-span-1">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên xe
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm break-words">
                  {vehicle.thumb}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại xe
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {vehicle.vehicleType === "CAR"
                    ? "Ô tô"
                    : vehicle.vehicleType === "MOTORBIKE"
                    ? "Xe máy"
                    : "Xe đạp"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biển số
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {vehicle.licensePlate || "Không có"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hãng xe
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {vehicle.brandName}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {vehicle.modelName || "Không có"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Năm sản xuất
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {vehicle.yearManufacture}
                </div>
              </div>

              {vehicle.numberSeat && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số ghế
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                    {vehicle.numberSeat}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Truyền động
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {translateTransmission(vehicle.transmission)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhiên liệu
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {translateFuelType(vehicle.fuelType)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá thuê/ngày
                </label>
                <div className="p-2 bg-gray-50 rounded font-semibold text-green-600 text-sm">
                  {vehicle.costPerDay.toLocaleString("vi-VN")} VNĐ
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <div className="p-2 bg-gray-50 rounded">
                  <Tag
                    color={vehicle.status === "AVAILABLE" ? "green" : "orange"}
                    className="text-xs"
                  >
                    {vehicle.status === "AVAILABLE"
                      ? "Đang hoạt động"
                      : "Không hoạt động"}
                  </Tag>
                </div>
              </div>
            </div>
          </Card>

          {/* Middle Column - Owner Info */}
          <Card title="Thông tin chủ xe" size="small" className="lg:col-span-1">
            <div className="text-center mb-4">
              <Avatar
                size={60}
                src={vehicle.userProfilePicture}
                icon={<UserOutlined />}
              />
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên chủ xe
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm break-words">
                  {vehicle.userName}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm break-all">
                  {vehicle.userEmail}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm break-words">
                  {vehicle.address}
                </div>
              </div>
            </div>
          </Card>

          {/* Right Column - Services & Features */}
          <Card
            title="Dịch vụ & Tiện ích"
            size="small"
            className="lg:col-span-1"
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Có lái xe
                </label>
                <div className="p-2 bg-gray-50 rounded">
                  <Tag
                    color={vehicle.haveDriver === "YES" ? "green" : "red"}
                    className="text-xs"
                  >
                    {vehicle.haveDriver === "YES" ? "Có" : "Không"}
                  </Tag>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bảo hiểm
                </label>
                <div className="p-2 bg-gray-50 rounded">
                  <Tag
                    color={vehicle.insuranceStatus === "YES" ? "green" : "red"}
                    className="text-xs"
                  >
                    {vehicle.insuranceStatus === "YES" ? "Có" : "Không"}
                  </Tag>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giao xe tận nơi
                </label>
                <div className="p-2 bg-gray-50 rounded">
                  <Tag
                    color={vehicle.shipToAddress === "YES" ? "green" : "red"}
                    className="text-xs"
                  >
                    {vehicle.shipToAddress === "YES" ? "Có" : "Không"}
                  </Tag>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiện ích xe
                </label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {vehicle.vehicleFeatures?.map((feature, index) => (
                    <Tag key={index} color="blue" className="text-xs mb-1">
                      {feature.name}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Extra Fees for Cars */}
        {vehicle.vehicleType === "CAR" && vehicle.extraFeeRule && (
          <Card title="Phụ phí có thể phát sinh" size="small">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Km tối đa/ngày
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                    {vehicle.extraFeeRule.maxKmPerDay || "Không giới hạn"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phí vượt km
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                    {vehicle.extraFeeRule.feePerExtraKm?.toLocaleString(
                      "vi-VN"
                    ) || 0}{" "}
                    VNĐ/km
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giờ trễ cho phép
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                    {vehicle.extraFeeRule.allowedHourLate || 0} giờ
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phí vượt giờ
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                    {vehicle.extraFeeRule.feePerExtraHour?.toLocaleString(
                      "vi-VN"
                    ) || 0}{" "}
                    VNĐ/giờ
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phí vệ sinh
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                    {vehicle.extraFeeRule.cleaningFee?.toLocaleString(
                      "vi-VN"
                    ) || 0}{" "}
                    VNĐ
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phí khử mùi
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                    {vehicle.extraFeeRule.smellRemovalFee?.toLocaleString(
                      "vi-VN"
                    ) || 0}{" "}
                    VNĐ
                  </div>
                </div>
              </div>
            </div>

            {vehicle.extraFeeRule.hasDriverOption && (
              <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-3 text-sm sm:text-base">
                  Dịch vụ tài xế
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Phí tài xế/ngày
                    </label>
                    <div className="p-2 bg-white rounded text-gray-900 text-sm">
                      {vehicle.extraFeeRule.driverFeePerDay?.toLocaleString(
                        "vi-VN"
                      ) || 0}{" "}
                      VNĐ
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Phí tài xế/giờ
                    </label>
                    <div className="p-2 bg-white rounded text-gray-900 text-sm">
                      {vehicle.extraFeeRule.driverFeePerHour?.toLocaleString(
                        "vi-VN"
                      ) || 0}{" "}
                      VNĐ
                    </div>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Cho thuê theo giờ
                    </label>
                    <div className="p-2 bg-white rounded">
                      <Tag
                        color={
                          vehicle.extraFeeRule.hasHourlyRental ? "green" : "red"
                        }
                        className="text-xs"
                      >
                        {vehicle.extraFeeRule.hasHourlyRental ? "Có" : "Không"}
                      </Tag>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Penalty Rules */}
        <Card title="Quy định thuê xe" size="small">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại phạt
              </label>
              <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                {vehicle.penalty?.penaltyType === "PERCENT"
                  ? "Phần trăm"
                  : "Cố định"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá trị phạt
              </label>
              <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                {vehicle.penalty?.penaltyType === "PERCENT"
                  ? `${vehicle.penalty.penaltyValue}%`
                  : `${vehicle.penalty?.penaltyValue?.toLocaleString(
                      "vi-VN"
                    )} VNĐ`}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian hủy tối thiểu
              </label>
              <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                {vehicle.penalty?.minCancelHour} giờ
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm break-words">
                {vehicle.penalty?.description}
              </div>
            </div>
          </div>
        </Card>

        {/* Description */}
        <Card title="Mô tả xe" size="small">
          <div className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm leading-relaxed break-words">
            {vehicle.description}
          </div>
        </Card>
      </div>

      {/* Confirm Approval Modal */}
      <Modal
        title="Xác nhận duyệt xe"
        open={isConfirmModalVisible}
        onCancel={() => setIsConfirmModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsConfirmModalVisible(false)}>
            Hủy
          </Button>,
          <Button key="confirm" type="primary" onClick={handleApprove}>
            Xác nhận
          </Button>,
        ]}
      >
        <p>Bạn có chắc chắn muốn duyệt xe này không?</p>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Từ chối xe"
        open={isRejectModalVisible}
        onCancel={() => setIsRejectModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsRejectModalVisible(false)}>
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleReject}
            disabled={!rejectReason}
          >
            Từ chối
          </Button>,
        ]}
      >
        <p>Nhập lý do từ chối:</p>
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Nhập lý do..."
        />
      </Modal>
    </Modal>
  );
};
VehiclePendingPage.Layout = AdminLayout;
