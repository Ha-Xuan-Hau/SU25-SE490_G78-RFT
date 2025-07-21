"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Tabs,
  Button,
  Input,
  Select,
  Modal,
  Image,
  Tag,
  Space,
  Card,
  Descriptions,
  Badge,
  Typography,
  Avatar,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  FilterOutlined,
  CarOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";
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

interface VehicleGroup {
  thumb: string;
  vehicle: Vehicle[];
  vehicleNumber: number;
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

const mockMotorbikeGroups: VehicleGroup[] = [
  {
    thumb: "Yamaha Jupiter 2020",
    vehicleNumber: 1,
    vehicle: [
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
    ],
  },
  {
    thumb: "Suzuki Raider 2022",
    vehicleNumber: 3,
    vehicle: [
      {
        id: "vehicle_023",
        licensePlate: "51B1-12357",
        vehicleType: "MOTORBIKE",
        userId: "user_002",
        userName: "Trần Thị Bình",
        userEmail: "tranthibinh@gmail.com",
        userProfilePicture:
          "https://res.cloudinary.com/dcakldjvc/image/upload/v1752737886/uwtsvefnelh2l1uec4pt.jpg",
        vehicleFeatures: [{ name: "Phanh ABS" }, { name: "Đèn LED" }],
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
        description: "Suzuki Raider 2022, xe mới",
        costPerDay: 180000,
        status: "AVAILABLE",
        thumb: "Suzuki Raider 2022",
        yearManufacture: 2022,
        transmission: "MANUAL",
        fuelType: "GASOLINE",
        numberVehicle: 1,
        brandName: "Suzuki",
        totalRatings: 2,
        address: "456 Đường Nguyễn Huệ, Quận 3, TP.HCM",
        openTime: "07:00:00",
        closeTime: "22:00:00",
        penalty: {
          id: "penalty_002",
          penaltyType: "FIXED",
          penaltyValue: 50000,
          minCancelHour: 12,
          description: "Phí hủy cố định 50.000 ₫",
        },
      },
      {
        id: "vehicle_024",
        licensePlate: "51B1-12358",
        vehicleType: "MOTORBIKE",
        userId: "user_002",
        userName: "Trần Thị Bình",
        userEmail: "tranthibinh@gmail.com",
        userProfilePicture:
          "https://res.cloudinary.com/dcakldjvc/image/upload/v1752737886/uwtsvefnelh2l1uec4pt.jpg",
        vehicleFeatures: [{ name: "Phanh ABS" }, { name: "Đèn LED" }],
        vehicleImages: [
          {
            imageUrl:
              "https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*",
          },
        ],
        haveDriver: "NO",
        insuranceStatus: "YES",
        shipToAddress: "YES",
        description: "Suzuki Raider 2022, xe mới",
        costPerDay: 180000,
        status: "AVAILABLE",
        thumb: "Suzuki Raider 2022",
        yearManufacture: 2022,
        transmission: "MANUAL",
        fuelType: "GASOLINE",
        numberVehicle: 1,
        brandName: "Suzuki",
        totalRatings: 2,
        address: "456 Đường Nguyễn Huệ, Quận 3, TP.HCM",
        openTime: "07:00:00",
        closeTime: "22:00:00",
        penalty: {
          id: "penalty_002",
          penaltyType: "FIXED",
          penaltyValue: 50000,
          minCancelHour: 12,
          description: "Phí hủy cố định 50.000 ₫",
        },
      },
      {
        id: "vehicle_025",
        licensePlate: "51B1-12359",
        vehicleType: "MOTORBIKE",
        userId: "user_002",
        userName: "Trần Thị Bình",
        userEmail: "tranthibinh@gmail.com",
        userProfilePicture:
          "https://res.cloudinary.com/dcakldjvc/image/upload/v1752737886/uwtsvefnelh2l1uec4pt.jpg",
        vehicleFeatures: [{ name: "Phanh ABS" }, { name: "Đèn LED" }],
        vehicleImages: [
          {
            imageUrl:
              "https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*",
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
        description: "Suzuki Raider 2022, xe mới",
        costPerDay: 180000,
        status: "UNAVAILABLE",
        thumb: "Suzuki Raider 2022",
        yearManufacture: 2022,
        transmission: "MANUAL",
        fuelType: "GASOLINE",
        numberVehicle: 1,
        brandName: "Suzuki",
        totalRatings: 1,
        address: "456 Đường Nguyễn Huệ, Quận 3, TP.HCM",
        openTime: "07:00:00",
        closeTime: "22:00:00",
        penalty: {
          id: "penalty_002",
          penaltyType: "FIXED",
          penaltyValue: 50000,
          minCancelHour: 12,
          description: "Phí hủy cố định 50.000 ₫",
        },
      },
    ],
  },
];

export default function VehicleManagementPage() {
  const [activeTab, setActiveTab] = useState("MOTORBIKE");
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

  const [groupVehiclesModal, setGroupVehiclesModal] = useState<{
    open: boolean;
    group: VehicleGroup | null;
  }>({
    open: false,
    group: null,
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
    const motorbikes = mockMotorbikeGroups.flatMap((group) => group.vehicle);
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
    } else {
      const group = item as VehicleGroup;
      const vehicle = group.vehicle[0];
      const matchesSearch =
        group.thumb.toLowerCase().includes(searchText.toLowerCase()) ||
        vehicle.userName.toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "AVAILABLE" &&
          group.vehicle.some((v) => v.status === "AVAILABLE")) ||
        (statusFilter === "UNAVAILABLE" &&
          group.vehicle.every((v) => v.status === "UNAVAILABLE"));

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
  const groupColumns: ColumnsType<VehicleGroup> = [
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
        <div className="relative">
          <Image
            src={
              record.vehicle[0]?.vehicleImages?.[0]?.imageUrl ||
              "/placeholder-motorbike.jpg"
            }
            alt="Vehicle"
            width={60}
            height={45}
            className="rounded-lg object-cover"
            fallback="/placeholder-motorbike.jpg"
          />
        </div>
      ),
      align: "center",
    },
    {
      title: "Tên xe",
      key: "vehicleName",
      render: (_, record) => {
        const vehicle = record.vehicle[0];
        return (
          <div>
            <div className="font-medium text-gray-900">{record.thumb}</div>
            <div className="text-sm text-gray-500">{vehicle.brandName}</div>
          </div>
        );
      },
    },
    {
      title: "Biển số",
      key: "licensePlate",
      render: (_, record) => {
        if (record.vehicleNumber === 1) {
          return (
            <Tag color="blue" className="font-mono">
              {record.vehicle[0].licensePlate}
            </Tag>
          );
        }
        return (
          <div>
            <Tag color="geekblue" className="mb-1">
              Nhiều xe
            </Tag>
            <div className="text-xs text-gray-500">Click để xem chi tiết</div>
          </div>
        );
      },
    },
    {
      title: "Chủ xe",
      key: "owner",
      render: (_, record) => {
        const vehicle = record.vehicle[0];
        return (
          <div>
            <div className="font-medium text-gray-900">{vehicle.userName}</div>
            <div className="text-sm text-gray-500">{vehicle.userEmail}</div>
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => {
        if (record.vehicleNumber === 1) {
          const status = record.vehicle[0].status;
          return (
            <Tag
              color={status === "AVAILABLE" ? "green" : "orange"}
              className="rounded-full px-3 py-1"
            >
              {status === "AVAILABLE" ? "Đang hoạt động" : "Không hoạt động"}
            </Tag>
          );
        }

        const activeCount = record.vehicle.filter(
          (v) => v.status === "AVAILABLE"
        ).length;
        const inactiveCount = record.vehicleNumber - activeCount;

        return (
          <div className="space-y-1">
            {activeCount > 0 && (
              <Tag color="green">{activeCount} hoạt động</Tag>
            )}
            {inactiveCount > 0 && (
              <Tag color="orange">{inactiveCount} tạm dừng</Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_, record) => {
        if (record.vehicleNumber === 1) {
          return (
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() =>
                setVehicleDetailModal({
                  open: true,
                  vehicle: record.vehicle[0],
                })
              }
            >
              Xem chi tiết
            </Button>
          );
        }

        return (
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => setGroupVehiclesModal({ open: true, group: record })}
          >
            Xem chi tiết
          </Button>
        );
      },
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
      key: "MOTORBIKE",
      label: `Xe máy (${mockMotorbikeGroups.length})`,
    },
    {
      key: "BICYCLE",
      label: `Xe đạp (${mockMotorbikeGroups.length})`,
    },
    {
      key: "CAR",
      label: `Xe ô tô (${mockCarData.length})`,
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {allVehicles.length}
          </div>
          <div className="text-sm text-gray-500">Tổng phương tiện</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {allVehicles.filter((v) => v.status === "AVAILABLE").length}
          </div>
          <div className="text-sm text-gray-500">Đang hoạt động</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {allVehicles.filter((v) => v.status === "UNAVAILABLE").length}
          </div>
          <div className="text-sm text-gray-500">Tạm dừng</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {new Set(allVehicles.map((v) => v.userId)).size}
          </div>
          <div className="text-sm text-gray-500">Chủ xe</div>
        </Card>
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
          <div className="flex gap-4 items-center">
            <Select
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-40"
              size="large"
              options={[
                { value: "all", label: "Tất cả" },
                { value: "AVAILABLE", label: "Hoạt động" },
                { value: "UNAVAILABLE", label: "Tạm dừng" },
              ]}
            />
            <div className="text-sm text-gray-500">
              Hiển thị:{" "}
              <span className="font-semibold text-blue-600">
                {filteredData.length}
              </span>{" "}
              {activeTab === "CAR" ? "xe" : "nhóm xe"}
            </div>
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

      {/* Group Vehicles Modal */}
      <GroupVehiclesModal
        open={groupVehiclesModal.open}
        group={groupVehiclesModal.group}
        onClose={() => setGroupVehiclesModal({ open: false, group: null })}
        onViewDetail={(vehicle) => {
          setGroupVehiclesModal({ open: false, group: null });
          setVehicleDetailModal({ open: true, vehicle });
        }}
      />
    </div>
  );
}

// Vehicle Detail Modal Component - CHỈ XEM - RESPONSIVE
const VehicleDetailModal: React.FC<{
  open: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
}> = ({ open, vehicle, onClose }) => {
  if (!vehicle) return null;

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
          key="close"
          size="large"
          onClick={onClose}
          className="w-full sm:w-auto"
        >
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
                  ID chủ xe
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm break-all">
                  {vehicle.userId}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian hoạt động
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {vehicle.openTime} - {vehicle.closeTime}
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
                  Số lượt đánh giá
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {vehicle.totalRatings} lượt
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
    </Modal>
  );
};

// Group Vehicles Modal Component - CHỈ XEM
const GroupVehiclesModal: React.FC<{
  open: boolean;
  group: VehicleGroup | null;
  onClose: () => void;
  onViewDetail: (vehicle: Vehicle) => void;
}> = ({ open, group, onClose, onViewDetail }) => {
  if (!group) return null;

  const columns: ColumnsType<Vehicle> = [
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
          src={
            record.vehicleImages?.[0]?.imageUrl || "/placeholder-motorbike.jpg"
          }
          alt="Vehicle"
          width={60}
          height={45}
          className="rounded-lg object-cover"
          fallback="/placeholder-motorbike.jpg"
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
          <div className="text-sm text-gray-500">{record.brandName}</div>
        </div>
      ),
    },
    {
      title: "Biển số",
      key: "licensePlate",
      render: (_, record) => (
        <Tag color="blue" className="font-mono">
          {record.licensePlate}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={status === "AVAILABLE" ? "green" : "orange"}
          className="rounded-full px-3 py-1"
        >
          {status === "AVAILABLE" ? "Đang hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => onViewDetail(record)}
        >
          Xem chi tiết
        </Button>
      ),
      align: "center",
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <Avatar
            src={group.vehicle[0]?.userProfilePicture}
            icon={<UserOutlined />}
            size={40}
          />
          <div>
            <div className="font-semibold text-lg">
              Danh sách xe: {group.thumb}
            </div>
            <div className="text-sm text-gray-500">
              {group.vehicleNumber} xe cùng loại
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" size="large" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={1000}
      className="top-8"
    >
      <div className="pt-4">
        {/* Group Summary */}
        <Card size="small" className="mb-4 bg-blue-50">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold text-gray-900">
                {group.vehicle[0].brandName} •{" "}
                {group.vehicle[0].yearManufacture}
              </div>
              <div className="text-sm text-gray-600">
                Chủ xe: {group.vehicle[0].userName} •{" "}
                {group.vehicle[0].userEmail}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                {group.vehicle[0].costPerDay.toLocaleString("vi-VN")} VNĐ/ngày
              </div>
              <div className="text-sm text-gray-500">
                {group.vehicleNumber} xe cùng loại
              </div>
            </div>
          </div>
        </Card>

        <Table
          columns={columns}
          dataSource={group.vehicle}
          rowKey="id"
          pagination={false}
          size="small"
          className="border-0"
        />
      </div>
    </Modal>
  );
};

VehicleManagementPage.Layout = AdminLayout;
