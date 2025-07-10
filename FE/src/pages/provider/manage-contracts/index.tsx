"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import {
  useProviderState,
  getProviderIdFromState,
} from "@/recoils/provider.state";
import { getContractsByProviderAndStatus } from "@/apis/contract.api";
import { showApiError } from "@/utils/toast.utils";
import {
  SearchOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  Image,
  Input,
  Modal,
  Table,
  Tooltip,
  Card,
  Tag,
  Spin,
  Tabs,
} from "antd";
import type { ColumnType } from "antd/es/table";

// Define TypeScript interfaces
interface ContractData {
  id: string;
  bookingId: string;
  userId: string;
  providerId: string;
  userName: string;
  providerName: string;
  userPhone: string;
  userEmail: string;
  userAddress: string;
  image: string;
  status: string;
  costSettlement: number;
  createdAt: string;
  updatedAt: string;
  // Vehicle information
  vehicleId: string;
  vehicleLicensePlate: string;
  vehicleType: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleNumberSeat: number;
  vehicleYearManufacture: number;
  vehicleTransmission: string;
  vehicleFuelType: string;
  vehicleCostPerDay: number;
  vehicleThumb: string;
  vehicleDescription: string;
  // Booking information
  bookingStartTime: string | number[];
  bookingEndTime: string | number[];
  bookingAddress: string;
  bookingTotalCost: number;
  bookingStatus: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  message?: string;
}

export default function ManageContracts() {
  // States
  const [form] = Form.useForm();
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [providerLoading, setProviderLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchText, setSearchText] = useState<string>("");

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

  // API calls - Fetch contracts with PROCESSING and RENTING status
  const fetchContracts = useCallback(
    async (forceRefresh = false) => {
      try {
        const providerId = getProviderIdFromState(provider);
        console.log("Provider ID from state:", providerId);

        if (!providerId) {
          // Don't show error if provider is still loading
          if (!providerLoading) {
            showApiError("Vui lòng đăng nhập để xem danh sách hợp đồng");
          }
          return;
        }

        // Check if we've already fetched for this provider (unless forced refresh)
        if (!forceRefresh && hasFetchedRef.current === providerId) {
          console.log("Already fetched contracts for provider:", providerId);
          return;
        }

        setLoading(true);
        console.log("Fetching contracts for provider:", providerId);

        // Fetch PROCESSING, RENTING, and FINISHED contracts
        //       const [processingResult, rentingResult, finishedResult] =
        //         await Promise.all([
        //           getContractsByProviderAndStatus(
        //             providerId,
        //             "PROCESSING"
        //           ) as Promise<ApiResponse<ContractData[]>>,
        //           getContractsByProviderAndStatus(providerId, "RENTING") as Promise<
        //             ApiResponse<ContractData[]>
        //           >,
        //           getContractsByProviderAndStatus(providerId, "FINISHED") as Promise<
        //             ApiResponse<ContractData[]>
        //           >,
        //         ]);

        //       const allContracts: ContractData[] = [];

        //       if (processingResult.success) {
        //         allContracts.push(...(processingResult.data || []));
        //       }

        //       if (rentingResult.success) {
        //         allContracts.push(...(rentingResult.data || []));
        //       }

        //       if (finishedResult.success) {
        //         allContracts.push(...(finishedResult.data || []));
        //       }

        //       setContracts(allContracts);
        //       hasFetchedRef.current = providerId; // Mark as fetched for this provider

        //       if (
        //         !processingResult.success &&
        //         !rentingResult.success &&
        //         !finishedResult.success
        //       ) {
        //         showApiError("Không thể tải dữ liệu hợp đồng");
        //       }
        //     } catch (error) {
        //       console.error("Error fetching contracts:", error);
        //       showApiError(error, "Có lỗi xảy ra khi tải dữ liệu");
        //     } finally {
        //       setLoading(false);
        //     }
        //   },
        //   [provider, providerLoading]
        // );
        const [
          processingResult,
          rentingResult,
          finishedResult,
          cancelledResult,
        ] = await Promise.all([
          getContractsByProviderAndStatus(providerId, "PROCESSING") as Promise<
            ApiResponse<ContractData[]>
          >,
          getContractsByProviderAndStatus(providerId, "RENTING") as Promise<
            ApiResponse<ContractData[]>
          >,
          getContractsByProviderAndStatus(providerId, "FINISHED") as Promise<
            ApiResponse<ContractData[]>
          >,
          getContractsByProviderAndStatus(providerId, "CANCELLED") as Promise<
            ApiResponse<ContractData[]>
          >,
        ]);

        const allContracts: ContractData[] = [];
        if (processingResult.success)
          allContracts.push(...(processingResult.data || []));
        if (rentingResult.success)
          allContracts.push(...(rentingResult.data || []));
        if (finishedResult.success)
          allContracts.push(...(finishedResult.data || []));
        if (cancelledResult.success)
          allContracts.push(...(cancelledResult.data || []));

        setContracts(allContracts);
        hasFetchedRef.current = providerId;

        if (
          !processingResult.success &&
          !rentingResult.success &&
          !finishedResult.success &&
          !cancelledResult.success
        ) {
          showApiError("Không thể tải dữ liệu hợp đồng");
        }
      } catch (error) {
        console.error("Error fetching contracts:", error);
        showApiError(error, "Có lỗi xảy ra khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    },
    [provider, providerLoading]
  );

  // Fetch contracts when provider is ready
  useEffect(() => {
    if (!providerLoading) {
      fetchContracts();
    }
  }, [fetchContracts, providerLoading]);

  // Filter contracts based on active tab and search text
  // const getFilteredContracts = () => {
  //   let filtered = contracts;

  //   // Filter by tab
  //   if (activeTab === "processing") {
  //     filtered = contracts.filter(
  //       (contract) => contract.status === "PROCESSING"
  //     );
  //   } else if (activeTab === "renting") {
  //     filtered = contracts.filter((contract) => contract.status === "RENTING");
  //   }
  //   // "all" tab shows all contracts

  //   // Filter by search text
  //   if (searchText.trim()) {
  //     const searchLower = searchText.toLowerCase().trim();
  //     filtered = filtered.filter(
  //       (contract) =>
  //         contract.userName.toLowerCase().includes(searchLower) ||
  //         contract.vehicleLicensePlate.toLowerCase().includes(searchLower)
  //     );
  //   }

  //   return filtered;
  // };
  const getFilteredContracts = () => {
    let filtered = contracts;
    if (activeTab === "processing") {
      filtered = contracts.filter(
        (contract) => contract.status === "PROCESSING"
      );
    } else if (activeTab === "renting") {
      filtered = contracts.filter((contract) => contract.status === "RENTING");
    } else if (activeTab === "finished") {
      filtered = contracts.filter((contract) => contract.status === "FINISHED");
    } else if (activeTab === "cancelled") {
      filtered = contracts.filter(
        (contract) => contract.status === "CANCELLED"
      );
    }
    // "all" tab shows all contracts

    // Filter by search text
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(
        (contract) =>
          contract.userName.toLowerCase().includes(searchLower) ||
          contract.vehicleLicensePlate.toLowerCase().includes(searchLower)
      );
    }
    return filtered;
  };

  // Handle tab change
  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // Get contracts to display
  const displayContracts = getFilteredContracts();

  // Fetch contracts when provider is ready

  const showModal = (contract: ContractData) => {
    setOpen(true);
    form.setFieldsValue({
      id: contract.id,
      userName: contract.userName,
      userPhone: contract.userPhone,
      userAddress: contract.userAddress,
      vehicleThumb: contract.vehicleThumb,
      vehicleLicensePlate: contract.vehicleLicensePlate,
      bookingStartTime: formatDateTime(contract.bookingStartTime),
      bookingEndTime: formatDateTime(contract.bookingEndTime),
      bookingTotalCost:
        contract.bookingTotalCost.toLocaleString("vi-VN") + " VNĐ",
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
      case "PROCESSING":
        return (
          <Tag color="orange" icon={<MinusCircleOutlined />}>
            Chờ xác nhận
          </Tag>
        );
      case "RENTING":
        return (
          <Tag color="blue" icon={<CheckCircleOutlined />}>
            Đang thuê
          </Tag>
        );
      case "FINISHED":
        return (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Hoàn thành
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

  const columns: ColumnType<ContractData>[] = [
    {
      title: "Thông tin xe",
      key: "vehicle",
      width: 250,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {/* <Image
            width={80}
            height={60}
            src={record.vehicleThumb || "/placeholder.svg"}
            alt={record.vehicleModel}
            className="rounded-md object-cover"
            fallback="/placeholder.svg?height=60&width=80"
          /> */}
          <div>
            <div className="font-semibold">
              {" "}
              {record.vehicleThumb} - {record.vehicleLicensePlate}
            </div>
            <div className="text-sm text-gray-500">
              {record.vehicleBrand} {record.vehicleModel}
            </div>
            <div className="text-xs text-gray-400">
              {record.vehicleNumberSeat} chỗ • {record.vehicleYearManufacture}
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
          <div className="font-semibold">{record.userName}</div>
          <div className="text-sm text-gray-500">{record.userPhone}</div>
          <div
            className="text-xs text-gray-400 truncate"
            title={record.userAddress}
          >
            {record.userAddress}
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
            <strong>Bắt đầu:</strong> {formatDateTime(record.bookingStartTime)}
          </div>
          <div className="text-sm">
            <strong>Kết thúc:</strong> {formatDateTime(record.bookingEndTime)}
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
          {formatCurrency(record.bookingTotalCost)}
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
      render: (_, contract) => (
        <Tooltip title="Xem chi tiết">
          <Button
            size="small"
            onClick={() => showModal(contract)}
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
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Quản lý hợp đồng thuê xe
          </h2>
          <p className="text-gray-600">
            Quản lý tất cả hợp đồng thuê xe với khả năng lọc theo trạng thái và
            tìm kiếm
          </p>
        </div>

        {/* Search Input and Tabs */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Input.Search
            placeholder="Tìm kiếm theo tên khách hàng hoặc biển số xe..."
            allowClear
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ maxWidth: 400 }}
          />

          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            size="large"
            items={[
              {
                key: "all",
                label: loading ? "Tất cả" : `Tất cả (${contracts.length})`,
              },
              {
                key: "processing",
                label: loading
                  ? "Đang xử lý"
                  : `Đang xử lý (${
                      contracts.filter((c) => c.status === "PROCESSING").length
                    })`,
              },
              {
                key: "renting",
                label: loading
                  ? "Đang thực hiện"
                  : `Đang thực hiện (${
                      contracts.filter((c) => c.status === "RENTING").length
                    })`,
              },
              {
                key: "finished",
                label: loading
                  ? "Đã hoàn thành"
                  : `Đã hoàn thành (${
                      contracts.filter((c) => c.status === "FINISHED").length
                    })`,
              },
              {
                key: "cancelled",
                label: loading
                  ? "Đã hủy"
                  : `Đã hủy (${
                      contracts.filter((c) => c.status === "CANCELLED").length
                    })`,
              },
            ]}
          />
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
        ) : isMobile ? (
          <>
            {loading ? (
              <div className="text-center py-8">
                <Spin size="large" />
              </div>
            ) : displayContracts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {displayContracts.map((contract) => (
                  <Card key={contract.id} className="shadow-md">
                    <div className="flex items-center gap-4 mb-2">
                      {/* <Image
                        width={80}
                        height={60}
                        src={contract.vehicleThumb || "/placeholder.svg"}
                        alt={contract.vehicleModel}
                        className="rounded-md object-cover"
                        fallback="/placeholder.svg?height=60&width=80"
                      /> */}
                      <div className="flex-1">
                        <div className="font-semibold text-lg">
                          {contract.vehicleThumb} -
                          {contract.vehicleLicensePlate}
                        </div>
                        <div className="text-sm text-gray-500">
                          {contract.vehicleBrand} {contract.vehicleModel}
                        </div>
                        <div className="text-xs text-gray-400">
                          {contract.vehicleNumberSeat} chỗ •{" "}
                          {contract.vehicleYearManufacture}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">{getStatusTag(contract.status)}</div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Khách hàng:
                        </span>
                        <span className="text-sm font-medium">
                          {contract.userName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Điện thoại:
                        </span>
                        <span className="text-sm">{contract.userPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Thời gian thuê:
                        </span>
                        <span className="text-sm">
                          {formatDateTime(contract.bookingStartTime)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Kết thúc:</span>
                        <span className="text-sm">
                          {formatDateTime(contract.bookingEndTime)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Tổng tiền:
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(contract.bookingTotalCost)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="small"
                        onClick={() => showModal(contract)}
                        className="flex-1"
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {searchText
                  ? `Không tìm thấy hợp đồng nào với từ khóa "${searchText}"`
                  : "Không có hợp đồng đang thực hiện"}
              </div>
            )}
          </>
        ) : (
          <Table
            columns={columns}
            dataSource={displayContracts}
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

      {/* Modal for contract details */}
      <Modal
        title="Chi tiết đơn đặt xe"
        open={open}
        footer={null}
        width={800}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Form.Item label="Tên xe" name="vehicleThumb">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Tên khách hàng" name="userName">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Số điện thoại" name="userPhone">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Địa chỉ nhận xe" name="userAddress">
                <Input.TextArea readOnly rows={2} />
              </Form.Item>
            </div>

            <div>
              <Form.Item label="Biển số xe" name="vehicleLicensePlate">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Thời gian bắt đầu thuê" name="bookingStartTime">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Thời gian kết thúc thuê" name="bookingEndTime">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Tổng giá tiền thuê" name="bookingTotalCost">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Contract ID" hidden name="id">
                <Input readOnly />
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleCancel}>Đóng</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

// Set layout for the component
ManageContracts.Layout = ProviderLayout;
