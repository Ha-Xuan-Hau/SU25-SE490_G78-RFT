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
} from "@ant-design/icons";
import {
  Button,
  Input,
  Table,
  Tooltip,
  Card,
  Tag,
  Spin,
  Tabs,
  Modal,
} from "antd";
import type { ColumnType } from "antd/es/table";
import ReportButton from "@/components/ReportComponent";

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
  timeFinish: string | number[];
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
  // const [form] = Form.useForm();
  // const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [providerLoading, setProviderLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchText, setSearchText] = useState<string>("");
  //Thêm state để lưu thông tin contract hiện tại
  // const [currentContract, setCurrentContract] = useState<ContractData | null>(
  //   null
  // );
  //state report
  const [reportGuideVisible, setReportGuideVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedContractForReport, setSelectedContractForReport] =
    useState<ContractData | null>(null);

  // Ref to track if we've already fetched data for current provider
  const hasFetchedRef = useRef<string | null>(null);

  // Provider state
  const [provider] = useProviderState();

  // Debug provider state and handle loading timeout
  useEffect(() => {
    console.log("Provider state:", provider);
    if (provider !== null) {
      setProviderLoading(false);
    } else {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setProviderLoading(false);
      } else {
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

  // API calls - Fetch contracts
  const fetchContracts = useCallback(
    async (forceRefresh = false) => {
      try {
        const providerId = getProviderIdFromState(provider);
        console.log("Provider ID from state:", providerId);

        if (!providerId) {
          if (!providerLoading) {
            showApiError("Vui lòng đăng nhập để xem danh sách hợp đồng");
          }
          return;
        }

        if (!forceRefresh && hasFetchedRef.current === providerId) {
          console.log("Already fetched contracts for provider:", providerId);
          return;
        }

        setLoading(true);
        console.log("Fetching contracts for provider:", providerId);

        const [
          // processingResult,
          // rentingResult,
          finishedResult,
          cancelledResult,
        ] = await Promise.all([
          // getContractsByProviderAndStatus(providerId, "PROCESSING") as Promise<
          //   ApiResponse<ContractData[]>
          // >,
          // getContractsByProviderAndStatus(providerId, "RENTING") as Promise<
          //   ApiResponse<ContractData[]>
          // >,
          getContractsByProviderAndStatus(providerId, "FINISHED") as Promise<
            ApiResponse<ContractData[]>
          >,
          getContractsByProviderAndStatus(providerId, "CANCELLED") as Promise<
            ApiResponse<ContractData[]>
          >,
        ]);

        const allContracts: ContractData[] = [];
        // if (processingResult.success)
        //   allContracts.push(...(processingResult.data || []));
        // if (rentingResult.success)
        //   allContracts.push(...(rentingResult.data || []));
        if (finishedResult.success)
          allContracts.push(...(finishedResult.data || []));
        if (cancelledResult.success)
          allContracts.push(...(cancelledResult.data || []));

        setContracts(allContracts);
        hasFetchedRef.current = providerId;

        if (
          // !processingResult.success &&
          // !rentingResult.success &&
          !finishedResult.success &&
          !cancelledResult.success
        ) {
          showApiError("Không thể tải dữ liệu hợp đồng");
        }
      } catch (error) {
        //console.error("Error fetching contracts:", error);
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
  const getFilteredContracts = () => {
    let filtered = contracts;
    // if (activeTab === "processing") {
    //   filtered = contracts.filter(
    //     (contract) => contract.status === "PROCESSING"
    //   );
    // } else if (activeTab === "renting") {
    //   filtered = contracts.filter((contract) => contract.status === "RENTING");
    // } else
    if (activeTab === "finished") {
      filtered = contracts.filter((contract) => contract.status === "FINISHED");
    } else if (activeTab === "cancelled") {
      filtered = contracts.filter(
        (contract) => contract.status === "CANCELLED"
      );
    } else if (activeTab === "all") {
      // ✅ Sắp xếp theo createdAt cho tab "all"
      filtered = [...contracts].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Mới nhất trước (DESC)
      });
    }

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

  // const showModal = (contract: ContractData) => {
  //   setCurrentContract(contract); // Lưu thông tin contract hiện tại
  //   setOpen(true);
  //   form.setFieldsValue({
  //     id: contract.id,
  //     userName: contract.userName,
  //     userPhone: contract.userPhone,
  //     userAddress: contract.userAddress,
  //     vehicleThumb: contract.vehicleThumb,
  //     vehicleLicensePlate: contract.vehicleLicensePlate,
  //     bookingStartTime: formatDateTime(contract.bookingStartTime),
  //     bookingEndTime: formatDateTime(contract.bookingEndTime),
  //     bookingTotalCost:
  //       contract.bookingTotalCost.toLocaleString("vi-VN") + " VNĐ",
  //     timeFinish: contract.timeFinish
  //       ? formatDateTime(contract.timeFinish)
  //       : "N/A",
  //   });
  // };

  // const handleCancel = () => {
  //   setOpen(false);
  //   setCurrentContract(null); // ✅ Reset current contract
  // };

  // // ✅ Thêm function để mở booking detail trong tab mới
  // const handleViewBookingDetail = () => {
  //   if (currentContract?.bookingId) {
  //     const url = `/booking-detail/${currentContract.bookingId}`;
  //     window.open(url, "_blank");
  //   }
  // };

  const handleViewDetail = (contract: ContractData) => {
    if (contract.bookingId) {
      const url = `/booking-detail/${contract.bookingId}`;
      window.open(url, "_blank"); // Mở tab mới
      // Hoặc dùng router.push(url) nếu muốn chuyển trang hiện tại
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDateTime = (dateValue: string | number[]) => {
    try {
      if (Array.isArray(dateValue)) {
        const [year, month, day, hour, minute] = dateValue;
        const date = new Date(year, month - 1, day, hour, minute || 0);
        return date.toLocaleString("vi-VN");
      }
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
      // case "PROCESSING":
      //   return (
      //     <Tag color="orange" icon={<MinusCircleOutlined />}>
      //       Đang xử lý
      //     </Tag>
      //   );
      // case "RENTING":
      //   return (
      //     <Tag color="blue" icon={<CheckCircleOutlined />}>
      //       Đang thuê
      //     </Tag>
      //   );
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

  // Kiểm tra có thể báo cáo không
  const canReport = (contract: ContractData) => {
    return contract.status === "CANCELLED";
  };

  // Handler cho nút báo cáo
  const handleReportClick = (contract: ContractData) => {
    setSelectedContractForReport(contract);
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
    setSelectedContractForReport(null);
  };

  const columns: ColumnType<ContractData>[] = [
    {
      title: "Thông tin xe",
      key: "vehicle",
      width: 250,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div>
            <div className="font-semibold">Mã đơn: {record.bookingId}</div>
            <div className="text-sm text-gray-400">{record.vehicleThumb}</div>
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
            title={record.bookingAddress}
          >
            {record.bookingAddress}
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
      width: 180, // Đặt width cố định vì có thể có nút báo cáo
      render: (_, contract) => (
        <div className="flex gap-2">
          <Tooltip title="Xem chi tiết đơn hàng">
            <Button
              size="small"
              onClick={() => handleViewDetail(contract)}
              icon={<SearchOutlined />}
            >
              Chi tiết
            </Button>
          </Tooltip>

          {/* Nút báo cáo cho đơn bị hủy */}
          {canReport(contract) && (
            <Tooltip title="Báo cáo khách hàng">
              <Button
                size="small"
                onClick={() => handleReportClick(contract)}
                className="border-red-400 text-red-600 hover:bg-red-50"
                icon={<ExclamationCircleOutlined />}
              >
                Báo cáo
              </Button>
            </Tooltip>
          )}
        </div>
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
              // {
              //   key: "processing",
              //   label: loading
              //     ? "Đang xử lý"
              //     : `Đang xử lý (${
              //         contracts.filter((c) => c.status === "PROCESSING").length
              //       })`,
              // },
              // {
              //   key: "renting",
              //   label: loading
              //     ? "Đang thực hiện"
              //     : `Đang thực hiện (${
              //         contracts.filter((c) => c.status === "RENTING").length
              //       })`,
              // },
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
                      <div className="flex-1">
                        <div className="font-semibold text-lg">
                          {contract.bookingId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {contract.vehicleBrand} {contract.vehicleLicensePlate}
                        </div>
                        <div className="text-xs text-gray-400">
                          {contract.vehicleThumb}
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
                        onClick={() => handleViewDetail(contract)}
                        className="flex-1"
                      >
                        Xem chi tiết
                      </Button>

                      {/* Nút báo cáo cho mobile */}
                      {canReport(contract) && (
                        <Button
                          size="small"
                          onClick={() => handleReportClick(contract)}
                          className="border-red-400 text-red-600 hover:bg-red-50"
                          icon={<ExclamationCircleOutlined />}
                        >
                          Báo cáo
                        </Button>
                      )}
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

      {/* Modal hướng dẫn báo cáo */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <ExclamationCircleOutlined className="text-red-500" />
            <span>Hướng dẫn báo cáo đơn bị hủy</span>
          </div>
        }
        open={reportGuideVisible}
        onCancel={() => setReportGuideVisible(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setReportGuideVisible(false)}>
            Hủy
          </Button>,
          <Button key="agree" type="primary" danger onClick={handleAgreeReport}>
            Đồng ý báo cáo
          </Button>,
        ]}
      >
        {selectedContractForReport && (
          <div className="py-4">
            {/* Thông báo cảnh báo */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <ExclamationCircleOutlined className="text-yellow-600 mt-1" />
                <div className="text-sm text-yellow-800">
                  <div className="font-medium mb-1">Lưu ý quan trọng:</div>
                  <p>
                    Vui lòng chỉ báo cáo khi thực sự gặp vấn đề với khách hàng.
                    Báo cáo sai sự thật có thể dẫn đến việc tài khoản bị hạn
                    chế.
                  </p>
                </div>
              </div>
            </div>

            {/* Nội dung hướng dẫn */}
            <div className="mb-6">
              <h4 className="font-semibold text-lg mb-3">
                Hướng dẫn báo cáo đơn đặt xe bị hủy
              </h4>
              <p className="text-gray-600 mb-4">
                Đơn đặt xe đã bị hủy. Các vấn đề có thể báo cáo:
              </p>

              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">
                    📱 Khách cố tình hủy liên tục để phá hoại hệ thống
                  </span>
                </div>
              </div>
            </div>

            {/* Thông tin đơn hàng */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <SearchOutlined className="text-blue-600" />
                <span className="font-medium">Thông tin đơn báo cáo:</span>
              </div>
              <div className="text-sm text-gray-700">
                <div>
                  <strong>Mã đặt xe:</strong>{" "}
                  {selectedContractForReport.bookingId}
                </div>
                <div>
                  <strong>Khách hàng:</strong>{" "}
                  {selectedContractForReport.userName}
                </div>
                <div>
                  <strong>Điện thoại:</strong>{" "}
                  {selectedContractForReport.userPhone}
                </div>
                <div>
                  <strong>Xe:</strong> {selectedContractForReport.vehicleThumb}
                </div>
                <div>
                  <strong>Trạng thái:</strong>{" "}
                  {getStatusTag(selectedContractForReport.status)}
                </div>
              </div>
            </div>

            {/* Quy trình xử lý */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700">
                <div className="font-medium mb-2">Quy trình xử lý báo cáo:</div>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Báo cáo sẽ được gửi đến bộ phận hỗ trợ khách hàng</li>
                  <li>
                    Chúng tôi sẽ liên hệ xác minh thông tin trong thời gian sớm
                    nhất
                  </li>
                  <li>
                    Khách hàng có hành vi gian lận có thể bị hạn chế tài khoản
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ReportButton Modal - Chỉ render khi cần */}
      {reportModalVisible && selectedContractForReport && (
        <ReportButton
          targetId={selectedContractForReport.userId} // Báo cáo user
          reportType="FAKE_ORDER" // Chỉ có 1 loại báo cáo cho đơn bị hủy
          buttonText=""
          size="small"
          type="text"
          icon={false}
          autoOpen={true}
          onModalClose={handleReportModalClose}
        />
      )}

      {/* ✅ Modal đã được cập nhật */}
      {/* <Modal
        title="Chi tiết đơn đặt xe"
        open={open}
        footer={null}
        width={800}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Form.Item label="Mã đặt xe" name="id">
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
              <Form.Item label="Thời gian bắt đầu thuê" name="bookingStartTime">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Thời gian kết thúc thuê" name="bookingEndTime">
                <Input readOnly />
              </Form.Item>
              <Form.Item label="Thời gian khách trả xe" name="timeFinish">
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

          {currentContract?.bookingId && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">
                    Xem chi tiết đơn hàng
                  </h4>
                  <p className="text-sm text-blue-600">
                    Mã đơn hàng: {currentContract.bookingId}
                  </p>
                </div>
                <Button
                  type="primary"
                  onClick={handleViewBookingDetail}
                  className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
                >
                  Xem chi tiết
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleCancel}>Đóng</Button>
          </div>
        </Form>
      </Modal>  */}
    </div>
  );
}

// Set layout for the component
ManageContracts.Layout = ProviderLayout;
