"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Spin,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined, EyeOutlined, UserOutlined } from "@ant-design/icons";
import {
  getPendingVehicles,
  getPendingStats,
  getVehicleDetail,
  updateVehicleStatus,
  updateMultipleVehicleStatuses,
} from "@/apis/admin.api"; // Ensure this path is correct
import AdminLayout from "@/layouts/AdminLayout";
import { showApiError, showApiSuccess } from "@/utils/toast.utils";
import { translateENtoVI } from "@/lib/viDictionary";

const { Title } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;

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
  openTime: string;
  closeTime: string;
  penalty: Penalty;
  extraFeeRule?: ExtraFeeRule;
}

type VehicleType = "CAR" | "MOTORBIKE" | "BICYCLE";

export default function VehiclePendingPage() {
  const [activeTab, setActiveTab] = useState<VehicleType>("CAR");
  const [searchText, setSearchText] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false); // Loading state riêng cho batch actions
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);
  const [currentPage, setCurrentPage] = useState(1); // State để control pagination

  const [vehicleDetailModal, setVehicleDetailModal] = useState<{
    open: boolean;
    vehicle: Vehicle | null;
  }>({
    open: false,
    vehicle: null,
  });

  const [pendingStats, setPendingStats] = useState({
    car: 0,
    motorbike: 0,
    bicycle: 0,
  });

  const [confirmAction, setConfirmAction] = useState<
    "APPROVE_ONE" | "APPROVE_BATCH" | "REJECT_ONE" | "REJECT_BATCH" | null
  >(null);

  const [rejectReason, setRejectReason] = useState("");

  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Fetch Pending Vehicles với search
  const loadPendingVehicles = async (
    page = 1,
    pageSize = 10,
    search = searchText,
    tab = activeTab
  ) => {
    setLoading(true);
    try {
      const params: any = {
        type: tab,
        page: page - 1, // 0-indexed
        size: pageSize,
      };

      // Thêm search params nếu có
      if (search && search.trim()) {
        params.search = search.trim();
      }

      const response = await getPendingVehicles(params);

      setVehicles(response.content || []);
      setPagination({
        current: (response.currentPage || 0) + 1,
        pageSize: pageSize,
        total: response.totalItems || 0,
      });
      setCurrentPage((response.currentPage || 0) + 1);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      showApiError("Có lỗi xảy ra khi lấy danh sách xe chờ duyệt.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Pending Stats
  const loadPendingStats = async () => {
    try {
      const response = await getPendingStats();
      setPendingStats(response);
    } catch (error) {
      console.error("Error fetching pending stats:", error);
    }
  };

  // Initial load
  useEffect(() => {
    loadPendingStats();
    loadPendingVehicles(1, pagination.pageSize, "", activeTab);
  }, []);

  // Handle tab change - Reset pagination khi chuyển tab
  const handleTabChange = (key: string) => {
    if (key === "CAR" || key === "MOTORBIKE" || key === "BICYCLE") {
      setActiveTab(key);
      setSearchText(""); // Clear search
      setSelectedVehicles([]); // Clear selections
      setCurrentPage(1); // Reset page
      loadPendingVehicles(1, pagination.pageSize, "", key);
    }
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1); // Reset to page 1
    loadPendingVehicles(1, pagination.pageSize, value, activeTab);
  };

  // Handle table change (pagination, filters, sorter)
  const handleTableChange = (newPagination: any) => {
    setCurrentPage(newPagination.current);
    loadPendingVehicles(
      newPagination.current,
      newPagination.pageSize,
      searchText,
      activeTab
    );
  };

  // Fetch Vehicle Details
  const fetchVehicleDetails = async (vehicleId: string) => {
    try {
      const response = await getVehicleDetail(vehicleId);
      return response;
    } catch (error) {
      console.error("Error fetching vehicle details:", error);
      showApiError("Có lỗi xảy ra khi lấy thông tin xe.");
    }
  };

  const handleViewDetails = async (vehicle: Vehicle) => {
    const vehicleDetails = await fetchVehicleDetails(vehicle.id);
    setVehicleDetailModal({ open: true, vehicle: vehicleDetails });
  };

  // Approve single vehicle
  const handleApprove = async (vehicleId: string) => {
    setLoading(true);
    try {
      await updateVehicleStatus(vehicleId, "AVAILABLE");
      showApiSuccess("Duyệt xe thành công.");

      // Reload data
      await Promise.all([
        loadPendingStats(),
        loadPendingVehicles(
          currentPage,
          pagination.pageSize,
          searchText,
          activeTab
        ),
      ]);

      // Close modal
      setVehicleDetailModal({ open: false, vehicle: null });
    } catch (error) {
      console.error("Error approving vehicle:", error);
      showApiError("Có lỗi xảy ra khi duyệt xe.");
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  // Reject single vehicle
  const handleReject = async (vehicleId: string) => {
    if (!rejectReason.trim()) {
      showApiError("Vui lòng nhập lý do từ chối.");
      return;
    }

    setLoading(true);
    try {
      await updateVehicleStatus(vehicleId, "UNAVAILABLE", rejectReason);
      showApiSuccess("Từ chối xe thành công.");
      setRejectReason("");

      // Reload data
      await Promise.all([
        loadPendingStats(),
        loadPendingVehicles(
          currentPage,
          pagination.pageSize,
          searchText,
          activeTab
        ),
      ]);

      // Close modal
      setVehicleDetailModal({ open: false, vehicle: null });
    } catch (error) {
      console.error("Error rejecting vehicle:", error);
      showApiError("Có lỗi xảy ra khi từ chối xe.");
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  // Batch approve
  const handleBatchApprove = async () => {
    setBatchLoading(true);
    try {
      await updateMultipleVehicleStatuses(
        selectedVehicles.map((vehicle) => ({
          vehicleId: vehicle.id,
          status: "AVAILABLE",
        }))
      );

      showApiSuccess(`Đã duyệt thành công ${selectedVehicles.length} xe.`);
      setSelectedVehicles([]); // Clear selections

      // Reload data
      await Promise.all([
        loadPendingStats(),
        loadPendingVehicles(
          currentPage,
          pagination.pageSize,
          searchText,
          activeTab
        ),
      ]);
    } catch (error) {
      console.error("Error batch approving:", error);
      showApiError("Có lỗi xảy ra khi duyệt xe.");
    } finally {
      setBatchLoading(false);
      setConfirmAction(null);
    }
  };

  // Batch reject
  const handleBatchReject = async () => {
    if (!rejectReason.trim()) {
      showApiError("Vui lòng nhập lý do từ chối.");
      return;
    }

    setBatchLoading(true);
    try {
      await updateMultipleVehicleStatuses(
        selectedVehicles.map((vehicle) => ({
          vehicleId: vehicle.id,
          status: "UNAVAILABLE",
          rejectReason,
        }))
      );

      showApiSuccess(`Đã từ chối ${selectedVehicles.length} xe.`);
      setRejectReason("");
      setSelectedVehicles([]); // Clear selections

      // Reload data
      await Promise.all([
        loadPendingStats(),
        loadPendingVehicles(
          currentPage,
          pagination.pageSize,
          searchText,
          activeTab
        ),
      ]);
    } catch (error) {
      console.error("Error batch rejecting:", error);
      showApiError("Có lỗi xảy ra khi từ chối xe.");
    } finally {
      setBatchLoading(false);
      setConfirmAction(null);
    }
  };

  // Filter data cho search local (không cần nếu search từ API)
  const filteredData = vehicles; // Không filter local nữa vì đã search từ API

  // Handle Checkbox Change
  const handleCheckboxChange = (vehicle: Vehicle) => {
    if (selectedVehicles.find((v) => v.id === vehicle.id)) {
      setSelectedVehicles(selectedVehicles.filter((v) => v.id !== vehicle.id));
    } else {
      setSelectedVehicles([...selectedVehicles, vehicle]);
    }
  };

  // Update checkbox indeterminate state
  useEffect(() => {
    const isIndeterminate =
      selectedVehicles.length > 0 && selectedVehicles.length < vehicles.length;

    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedVehicles, vehicles]);

  // Columns definition
  const carColumns: ColumnsType<Vehicle> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      align: "center",
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <input
            ref={selectAllCheckboxRef}
            type="checkbox"
            checked={
              vehicles.length > 0 && selectedVehicles.length === vehicles.length
            }
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedVehicles(vehicles);
              } else {
                setSelectedVehicles([]);
              }
            }}
            disabled={batchLoading}
          />
          <span className="text-xs">Chọn</span>
        </div>
      ),
      key: "select",
      width: 80,
      render: (_, record) => (
        <input
          type="checkbox"
          checked={selectedVehicles.some((v) => v.id === record.id)}
          onChange={() => handleCheckboxChange(record)}
          disabled={batchLoading}
        />
      ),
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
    ...(activeTab !== "BICYCLE"
      ? [
          {
            title: "Biển số",
            dataIndex: "licensePlate",
            key: "licensePlate",
            render: (licensePlate: string) => (
              <Tag color="blue" className="font-mono">
                {licensePlate}
              </Tag>
            ),
          },
        ]
      : []),
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
        <Tag color="orange" className="rounded-full px-3 py-1">
          Chờ duyệt
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
          onClick={() => handleViewDetails(record)}
          disabled={batchLoading}
        >
          Xem chi tiết
        </Button>
      ),
      align: "center",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Loading overlay khi batch processing */}
      <Spin
        spinning={batchLoading}
        size="large"
        tip="Đang xử lý..."
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(255, 255, 255, 0.8)",
          zIndex: 9999,
          display: batchLoading ? "flex" : "none",
          justifyContent: "center",
          alignItems: "center",
        }}
      />

      <div>
        <Title level={2} className="!mb-2">
          Duyệt phương tiện
        </Title>
        <p className="text-gray-600">
          Xem và duyệt các phương tiện đang chờ xử lý
        </p>
      </div>

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
              onSearch={handleSearch}
              disabled={loading || batchLoading}
            />
          </div>
          <div className="flex gap-4">
            <Button
              type="primary"
              onClick={() => setConfirmAction("APPROVE_BATCH")}
              disabled={selectedVehicles.length === 0 || batchLoading}
              loading={batchLoading && confirmAction === "APPROVE_BATCH"}
            >
              Duyệt hàng loạt ({selectedVehicles.length})
            </Button>
            <Button
              danger
              onClick={() => setConfirmAction("REJECT_BATCH")}
              disabled={selectedVehicles.length === 0 || batchLoading}
              loading={batchLoading && confirmAction === "REJECT_BATCH"}
            >
              Từ chối hàng loạt ({selectedVehicles.length})
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={[
            {
              key: "CAR",
              label: `Xe ô tô (${pendingStats.car})`,
              disabled: loading || batchLoading,
            },
            {
              key: "MOTORBIKE",
              label: `Xe máy (${pendingStats.motorbike})`,
              disabled: loading || batchLoading,
            },
            {
              key: "BICYCLE",
              label: `Xe đạp (${pendingStats.bicycle})`,
              disabled: loading || batchLoading,
            },
          ]}
          className="px-6 pt-4"
        />

        <div className="px-6 pb-6">
          <Table
            columns={carColumns}
            dataSource={filteredData}
            loading={loading}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: false, // ✅ Tắt option chọn số lượng/trang
              showQuickJumper: false, // ✅ Tắt ô nhập số trang (optional)
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} xe`,
              pageSizeOptions: ["10", "20", "50", "100"],
              disabled: batchLoading,
            }}
            onChange={handleTableChange}
            scroll={{ x: 800 }}
            className="border-0"
          />
        </div>
      </div>

      {/* Vehicle Detail Modal - giữ nguyên */}
      <VehicleDetailModal
        open={vehicleDetailModal.open}
        vehicle={vehicleDetailModal.vehicle}
        onClose={() => setVehicleDetailModal({ open: false, vehicle: null })}
        onApprove={() => setConfirmAction("APPROVE_ONE")}
        onReject={() => setConfirmAction("REJECT_ONE")}
      />

      {/* Confirmation Modals */}
      <Modal
        title="Xác nhận duyệt xe"
        open={
          confirmAction === "APPROVE_ONE" || confirmAction === "APPROVE_BATCH"
        }
        onCancel={() => !loading && !batchLoading && setConfirmAction(null)}
        zIndex={2000}
        closable={!loading && !batchLoading}
        maskClosable={false}
        footer={[
          <Button
            key="cancel"
            onClick={() => setConfirmAction(null)}
            disabled={loading || batchLoading}
          >
            Hủy
          </Button>,
          <Button
            key="approve"
            type="primary"
            loading={confirmAction === "APPROVE_ONE" ? loading : batchLoading}
            onClick={async () => {
              if (
                confirmAction === "APPROVE_ONE" &&
                vehicleDetailModal.vehicle
              ) {
                await handleApprove(vehicleDetailModal.vehicle.id);
              } else {
                await handleBatchApprove();
              }
            }}
          >
            Xác nhận duyệt
          </Button>,
        ]}
      >
        <p>
          Bạn có chắc chắn muốn duyệt{" "}
          {confirmAction === "APPROVE_ONE"
            ? "xe này"
            : `${selectedVehicles.length} xe đã chọn`}{" "}
          không?
        </p>
      </Modal>

      <Modal
        title="Từ chối xe"
        open={
          confirmAction === "REJECT_ONE" || confirmAction === "REJECT_BATCH"
        }
        onCancel={() => !loading && !batchLoading && setConfirmAction(null)}
        zIndex={2000}
        closable={!loading && !batchLoading}
        maskClosable={false}
        footer={[
          <Button
            key="cancel"
            onClick={() => setConfirmAction(null)}
            disabled={loading || batchLoading}
          >
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            loading={confirmAction === "REJECT_ONE" ? loading : batchLoading}
            onClick={async () => {
              if (
                confirmAction === "REJECT_ONE" &&
                vehicleDetailModal.vehicle
              ) {
                await handleReject(vehicleDetailModal.vehicle.id);
              } else {
                await handleBatchReject();
              }
            }}
            disabled={!rejectReason.trim()}
          >
            Xác nhận từ chối
          </Button>,
        ]}
      >
        <p className="mb-3">
          {confirmAction === "REJECT_ONE"
            ? "Nhập lý do từ chối xe này:"
            : `Nhập lý do từ chối ${selectedVehicles.length} xe đã chọn:`}
        </p>
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Nhập lý do từ chối..."
          disabled={loading || batchLoading}
        />
      </Modal>
    </div>
  );
}

// VehicleDetailModal Component - giữ nguyên
const VehicleDetailModal: React.FC<{
  open: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}> = ({ open, vehicle, onClose, onApprove, onReject }) => {
  if (!vehicle) return null;

  let features: VehicleFeature[] = [];
  if (
    typeof vehicle.vehicleFeatures === "string" &&
    vehicle.vehicleFeatures !== undefined &&
    vehicle.vehicleFeatures !== null
  ) {
    features = (vehicle.vehicleFeatures as string)
      .split(",")
      .map((name) => ({ name: name.trim() }))
      .filter((f) => f.name);
  } else if (Array.isArray(vehicle.vehicleFeatures)) {
    features = vehicle.vehicleFeatures;
  }

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
        <Button key="approve" type="primary" onClick={onApprove}>
          Duyệt
        </Button>,
        <Button key="reject" danger onClick={onReject}>
          Từ chối
        </Button>,
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width="95vw"
      destroyOnClose
      // ✅ CÁCH 2: Sửa style và bodyStyle để loại bỏ scroll riêng
      style={{
        maxWidth: "1200px",
        top: 20,
        maxHeight: "calc(100vh - 40px)",
        overflow: "visible",
      }}
      modalRender={(modal) => (
        <div style={{ overflow: "visible" }}>{modal}</div>
      )}
      className="top-4 sm:top-8"
    >
      {/* ✅ LOẠI BỎ div wrapper có scroll, chỉ giữ nội dung */}
      <div className="space-y-4 sm:space-y-6">
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
                  {translateENtoVI(vehicle.transmission)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhiên liệu
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {translateENtoVI(vehicle.fuelType)}
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
                  {features.map((feature, index) => (
                    <Tag key={index} color="blue" className="text-xs mb-1">
                      {translateENtoVI(feature.name)}
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

              {/* Thêm phí sạc pin cho xe điện */}
              {vehicle.fuelType === "ELECTRIC" &&
                vehicle.extraFeeRule.apply_batteryChargeFee && (
                  <div className="space-y-3 sm:col-span-2 lg:col-span-3">
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="text-yellow-700">
                          ⚡ Phí sạc pin (Xe điện)
                        </span>
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <span className="text-sm text-gray-600">
                            Phí sạc:
                          </span>
                          <span className="ml-2 font-semibold text-yellow-700">
                            {vehicle.extraFeeRule.batteryChargeFeePerPercent?.toLocaleString(
                              "vi-VN"
                            ) || 0}{" "}
                            VNĐ/% pin
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Khách thuê thanh toán phí sạc pin theo % pin đã sử
                          dụng trong quá trình thuê xe
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
          <div
            className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm leading-relaxed break-words"
            style={{ whiteSpace: "pre-line" }}
          >
            {vehicle.description}
          </div>
        </Card>
      </div>
    </Modal>
  );
};

VehiclePendingPage.Layout = AdminLayout;
