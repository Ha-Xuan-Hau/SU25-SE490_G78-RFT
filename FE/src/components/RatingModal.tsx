import React, { useEffect, useState } from "react";
import { Modal, Button, Input, Rate, notification } from "antd";

// Define interfaces for props and data
interface Rating {
  id: string;
  star: number;
  comment: string;
  bookingId: string;
  carId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface RatingModalProps {
  open: boolean;
  handleCancel: () => void;
  bookingId: string | null;
  carId: string | null;
  accessToken?: string;
}

// Mock data for ratings
const mockRatings: Rating[] = [
  {
    id: "rating1",
    star: 4.5,
    comment: "Xe rất tốt, lái êm và tiết kiệm nhiên liệu",
    bookingId: "booking123",
    carId: "car123",
    userId: "user1",
    createdAt: "2023-06-21T09:00:00.000Z",
    updatedAt: "2023-06-21T09:00:00.000Z",
  },
  {
    id: "rating2",
    star: 5,
    comment: "Trải nghiệm thuê xe tuyệt vời, chắc chắn sẽ thuê lại",
    bookingId: "booking456",
    carId: "car456",
    userId: "user1",
    createdAt: "2023-05-16T10:30:00.000Z",
    updatedAt: "2023-05-16T10:30:00.000Z",
  },
];

const RatingModal: React.FC<RatingModalProps> = ({
  open,
  handleCancel,
  bookingId,
  carId,
}) => {
  const { TextArea } = Input;
  const [star, setStar] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check if the booking already has a rating
  const existingRatingIndex = bookingId
    ? mockRatings.findIndex((rating) => rating.bookingId === bookingId)
    : -1;

  const hasRatings = existingRatingIndex !== -1;

  useEffect(() => {
    if (open && bookingId) {
      // Simulate loading data
      setIsLoading(true);
      setTimeout(() => {
        if (hasRatings) {
          const existingRating = mockRatings[existingRatingIndex];
          setStar(existingRating.star);
          setComment(existingRating.comment);
        } else {
          // Reset to default values if no existing rating
          setStar(5);
          setComment("");
        }
        setIsLoading(false);
      }, 500);
    }
  }, [open, bookingId, hasRatings, existingRatingIndex]);

  const handleRatingChange = (value: number) => {
    setStar(value);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  const handleRatingSubmit = async () => {
    try {
      setIsLoading(true);

      if (!star) {
        notification.error({
          message: "Lỗi",
          description: "Vui lòng chọn số sao để đánh giá.",
        });
        setIsLoading(false);
        return;
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (hasRatings) {
        // Update existing rating in mock data
        if (bookingId) {
          mockRatings[existingRatingIndex] = {
            ...mockRatings[existingRatingIndex],
            star,
            comment,
            updatedAt: new Date().toISOString(),
          };
        }

        notification.success({
          message: "Cập nhật đánh giá thành công",
          description: "Cảm ơn bạn đã cập nhật đánh giá xe!",
        });
      } else {
        // Add new rating to mock data
        if (bookingId && carId) {
          const newRating: Rating = {
            id: `rating${mockRatings.length + 1}`,
            star,
            comment,
            bookingId,
            carId,
            userId: "user1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          mockRatings.push(newRating);
        }

        notification.success({
          message: "Đánh giá thành công",
          description: "Cảm ơn bạn đã đánh giá xe!",
        });
      }

      setIsLoading(false);
      handleCancel();
    } catch (error) {
      setIsLoading(false);
      notification.error({
        message: "Lỗi",
        description: "Có lỗi xảy ra khi đánh giá. Vui lòng thử lại sau.",
      });
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
          {hasRatings ? "Cập nhật đánh giá" : "Gửi đánh giá"}
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
              allowHalf
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
