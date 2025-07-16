import React, { useEffect, useState } from "react";
import { Modal, Button, Input, Rate } from "antd";

interface RatingModalProps {
  open: boolean;
  handleCancel: () => void;
  bookingId: string;
  vehicleId: string;
  initialStar?: number;
  initialComment?: string;
  onSubmit: (star: number, comment: string) => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
  open,
  handleCancel,
  bookingId,
  vehicleId,
  initialStar = 5,
  initialComment = "",
  onSubmit,
}) => {
  const { TextArea } = Input;
  const [star, setStar] = useState<number>(initialStar);
  const [comment, setComment] = useState<string>(initialComment);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setStar(initialStar || 5);
      setComment(initialComment || "");
    }
  }, [open, initialStar, initialComment]);

  const handleRatingChange = (value: number) => {
    setStar(value);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  const handleRatingSubmit = async () => {
    if (!star) {
      // Có thể dùng notification hoặc showError ở parent
      return;
    }
    setIsLoading(true);
    try {
      await onSubmit(star, comment);
      handleCancel();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="Đánh giá chuyến đi"
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button key="back" onClick={handleCancel} disabled={isLoading}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleRatingSubmit}
          loading={isLoading}
        >
          {initialStar && initialComment ? "Cập nhật đánh giá" : "Gửi đánh giá"}
        </Button>,
      ]}
    >
      <div className="py-2">
        <h4 className="mb-3 font-semibold">
          Bạn đánh giá chuyến đi này thế nào?
        </h4>
        <div className="flex flex-col gap-4">
          <div className="flex items-center">
            <span className="mr-3">Số sao:</span>
            <Rate
              className="text-yellow-500"
              value={star}
              onChange={handleRatingChange}
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col">
            <span className="mb-2">Nhận xét về chuyến đi:</span>
            <TextArea
              value={comment}
              allowClear
              className="bg-white"
              onChange={handleCommentChange}
              placeholder="Nhận xét của bạn về trải nghiệm thuê xe này..."
              autoSize={{ minRows: 4, maxRows: 8 }}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RatingModal;
