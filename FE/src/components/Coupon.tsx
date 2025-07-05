import React, { useState, useEffect } from "react";
import { Modal, Button, List, Tag, message } from "antd";
import { coupon as CouponType } from "@/types/coupon";
import { getCoupons } from "@/apis/coupon.api";

interface CouponProps {
  applyCoupon: (coupon: CouponType | null) => void;
}

const Coupon: React.FC<CouponProps> = ({ applyCoupon }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [coupons, setCoupons] = useState<CouponType[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchCoupons = async () => {
      setLoading(true);
      try {
        const couponsData = await getCoupons();
        setCoupons(couponsData);
      } catch (error) {
        console.error("Failed to fetch coupons:", error);
        message.error("Không thể tải mã giảm giá");
        setCoupons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
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
          loading={loading}
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
