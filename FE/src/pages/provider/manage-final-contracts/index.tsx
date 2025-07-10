import { useState, useRef, useEffect } from "react";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import { SearchOutlined, EyeOutlined } from "@ant-design/icons";
import {
  message,
  Button,
  Image,
  Input,
  Modal,
  Table,
  Space,
  Card,
  Tag,
  Tooltip,
  Descriptions,
} from "antd";
import type { InputRef } from "antd";
import type { ColumnType } from "antd/es/table";
import Highlighter from "react-highlight-words";
import { getFinalContractsByProvider } from "@/apis/contract.api";
import {
  useProviderState,
  getProviderIdFromState,
} from "@/recoils/provider.state";

interface FinalContractData {
  _id: string;
  bookingId: string;
  createBy: string;
  bookBy: string;
  email: string;
  phone: string;
  address: string;
  numberCar: string;
  model: string;
  numberSeat: number;
  yearManufacture: number;
  timeBookingStart: string;
  timeBookingEnd: string;
  totalCost: number | string;
  status: string; // Đã có status từ DTO
  contractId?: string;
  image?: string[]; // Có thể có hoặc không
  vehicleImages?: { imageUrl: string }[]; // Có thể có hoặc không
}

export default function ProviderManageFinalContracts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] =
    useState<FinalContractData | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);
  const [loading, setLoading] = useState(true);
  const [finalContracts, setFinalContracts] = useState<FinalContractData[]>([]);

  const [provider] = useProviderState();
  const providerId = getProviderIdFromState(provider);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!providerId) {
          setFinalContracts([]);
          setLoading(false);
          return;
        }
        // API trả về object { success, data }
        const res: any = await getFinalContractsByProvider(providerId);
        const data = Array.isArray(res.data) ? res.data : [];

        // Đảm bảo có trường image cho hiển thị
        for (const fc of data) {
          if (
            !fc.image &&
            fc.vehicleImages &&
            Array.isArray(fc.vehicleImages) &&
            fc.vehicleImages.length > 0
          ) {
            fc.image = [fc.vehicleImages[0].imageUrl];
          }
        }

        setFinalContracts(data);
      } catch (e) {
        message.error("Không thể tải danh sách hợp đồng tất toán");
      }
      setLoading(false);
    };
    if (providerId) fetchData();
  }, [providerId]);

  const getColumnSearchProps = (
    dataIndex: keyof FinalContractData
  ): ColumnType<FinalContractData> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Tìm kiếm ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() =>
            handleSearch(selectedKeys as string[], confirm, dataIndex)
          }
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() =>
              handleSearch(selectedKeys as string[], confirm, dataIndex)
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
            Xóa
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value: any, record: FinalContractData) => {
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
      searchedColumn === dataIndex ? (
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

  const handleSearch = (
    selectedKeys: string[],
    confirm: () => void,
    dataIndex: string
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText("");
  };

  const showModalView = (contract: FinalContractData) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  const handleCancelView = () => {
    setIsModalOpen(false);
    setSelectedContract(null);
  };

  const columns: ColumnType<FinalContractData>[] = [
    {
      title: "Hợp đồng tất toán",
      key: "contract",
      width: 280,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Image
            width={80}
            height={60}
            src={record.image?.[0] || "/placeholder.svg"}
            alt="Final Contract"
            className="rounded-md object-cover"
            fallback="/placeholder.svg?height=60&width=80"
          />
          <div>
            <div className="font-semibold">{record.numberCar}</div>
            <div className="text-sm text-gray-500">{record.model}</div>
            <div className="text-xs text-gray-400">
              {record.numberSeat} chỗ • {record.yearManufacture}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Khách hàng",
      key: "customer",
      width: 220,
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.bookBy}</div>
          <div className="text-sm text-gray-500">{record.phone}</div>
          <div className="text-xs text-gray-400">{record.email}</div>
          <div
            className="text-xs text-gray-400 truncate"
            title={record.address}
          >
            {record.address}
          </div>
        </div>
      ),
      ...getColumnSearchProps("bookBy"),
    },
    {
      title: "Thời gian thuê",
      key: "time",
      width: 180,
      render: (_, record) => (
        <div>
          <div className="text-sm">
            <strong>Bắt đầu:</strong> {record.timeBookingStart}
          </div>
          <div className="text-sm">
            <strong>Kết thúc:</strong> {record.timeBookingEnd}
          </div>
        </div>
      ),
    },
    {
      title: "Số tiền kết toán",
      dataIndex: "totalCost",
      key: "totalCost",
      width: 140,
      render: (cost) => (
        <div className="font-semibold text-green-600">{cost}</div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag
          color={
            status === "Đã tất toán"
              ? "green"
              : status === "Đã hủy"
              ? "red"
              : "default"
          }
          className="px-2 py-1"
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right",
      width: 100,
      render: (_, contract) => (
        <Tooltip title="Xem chi tiết">
          <Button
            size="small"
            onClick={() => showModalView(contract)}
            icon={<EyeOutlined />}
          >
            Xem
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Tất toán hợp đồng</h1>
          <p className="text-gray-600">
            Quản lý các hợp đồng đã tất toán và xem chi tiết thông tin
          </p>
        </div>

        <Table
          columns={columns}
          dataSource={finalContracts}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} mục`,
          }}
          locale={{
            emptyText: loading ? "Đang tải dữ liệu..." : "Không có dữ liệu",
          }}
          size="middle"
        />
      </Card>

      {/* Modal for viewing contract info */}
      <Modal
        title="Chi tiết hợp đồng tất toán"
        open={isModalOpen}
        onCancel={handleCancelView}
        footer={null}
        width={600}
      >
        {selectedContract ? (
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="Biển số">
              {selectedContract.numberCar}
            </Descriptions.Item>
            <Descriptions.Item label="Mẫu xe">
              {selectedContract.model}
            </Descriptions.Item>
            <Descriptions.Item label="Số chỗ">
              {selectedContract.numberSeat}
            </Descriptions.Item>
            <Descriptions.Item label="Năm sản xuất">
              {selectedContract.yearManufacture}
            </Descriptions.Item>
            <Descriptions.Item label="Khách hàng">
              {selectedContract.bookBy}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {selectedContract.phone}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedContract.email}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">
              {selectedContract.address}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian bắt đầu">
              {selectedContract.timeBookingStart}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian kết thúc">
              {selectedContract.timeBookingEnd}
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền kết toán">
              {selectedContract.totalCost}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {selectedContract.status}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </div>
  );
}

ProviderManageFinalContracts.Layout = ProviderLayout;
