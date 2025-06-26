import React, { useState, useEffect } from "react";
import { Modal, Button, List, Tag, Tooltip, message } from "antd";
import { coupon as CouponType } from "@/types/coupon";

// Sample data
const sampleCoupons: CouponType[] = [
  {
    id: "coupon-001",
    name: "NEWUSER10",
    discount: 10.0,
    description: "Giảm 10% cho khách hàng mới",
  },
  {
    id: "coupon-002",
    name: "SUMMER20",
    discount: 20.0,
    description: "Giảm 20% cho mùa hè",
  },
  {
    id: "coupon-003",
    name: "WEEKEND15",
    discount: 15.0,
    description: "Giảm 15% cho thuê xe cuối tuần",
  },
  {
    id: "coupon-004",
    name: "LONGTERM25",
    discount: 25.0,
    description: "Giảm 25% cho thuê dài hạn (từ 7 ngày)",
  },
  {
    id: "coupon-005",
    name: "VIP30",
    discount: 30.0,
    description: "Giảm 30% cho khách hàng VIP",
  },
];

interface CouponProps {
  applyCoupon: (coupon: CouponType | null) => void;
}

const Coupon: React.FC<CouponProps> = ({ applyCoupon }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [coupons, setCoupons] = useState<CouponType[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponType | null>(null);

  useEffect(() => {
    // Trong thực tế, bạn sẽ fetch dữ liệu từ API
    setCoupons(sampleCoupons);
  }, []);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleSelectCoupon = (coupon: CouponType) => {
    setSelectedCoupon(coupon);
    applyCoupon(coupon);
    setIsModalOpen(false);
  };

  const handleRemoveCoupon = () => {
    setSelectedCoupon(null);
    applyCoupon(null);
    message.success("Đã xóa mã giảm giá");
  };

  return (
    <div className="py-2">
      {!selectedCoupon ? (
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Chọn mã giảm giá</span>
          <Button type="primary" onClick={showModal}>
            Chọn mã
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-blue-50 p-2 rounded-md">
          <div>
            <Tag color="blue" className="text-md mb-1">
              {selectedCoupon.name}
            </Tag>
            <div>
              <span className="text-green-600 font-medium">
                Giảm {selectedCoupon.discount}%
              </span>
              <p className="text-xs text-gray-500 mt-1">
                {selectedCoupon.description}
              </p>
            </div>
          </div>
          <Button danger onClick={handleRemoveCoupon}>
            Xóa
          </Button>
        </div>
      )}

      <Modal
        title="Chọn mã giảm giá"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <List
          itemLayout="horizontal"
          dataSource={coupons}
          renderItem={(coupon) => (
            <List.Item
              key={coupon.id}
              actions={[
                <Button
                  key="apply"
                  type="primary"
                  onClick={() => handleSelectCoupon(coupon)}
                >
                  Áp dụng
                </Button>,
              ]}
              className="hover:bg-gray-50 p-2 rounded-md cursor-pointer"
            >
              <List.Item.Meta
                title={
                  <div className="flex items-center gap-2">
                    <Tag color="blue">{coupon.name}</Tag>
                    <span className="text-green-600 font-medium">
                      Giảm {coupon.discount}%
                    </span>
                  </div>
                }
                description={coupon.description}
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default Coupon;
