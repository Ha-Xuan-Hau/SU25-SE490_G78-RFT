// UploadImage.tsx
import { Image, Spin, Upload, message } from "antd";
import { CloudUploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { useState } from "react";
import type { CSSProperties } from "react";

interface UploadImageProps {
  onChange?: (licenseNumber: string, licenseClass: string) => void; // Cập nhật kiểu dữ liệu
}

// Sửa lại định nghĩa style
const uploadStyle: CSSProperties = {
  padding: 0,
};

export const UploadImage = ({ onChange }: UploadImageProps) => {
  const endpoint = process.env.NEXT_PUBLIC_CLOUDINARY_API!;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
  const googleVisionApiKey = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY!;
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | undefined>();

  const handleUpload = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      // Upload image to Cloudinary
      const { data } = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setImage(data?.url); // Set the image URL after upload

      // Gọi API Google Vision để phân tích hình ảnh
      const analysisResult = await analyzeImage(data?.url);

      // Chỉ trả về JSON chuẩn theo yêu cầu
      const { licenseNumber, licenseClass } = analysisResult;

      // Kiểm tra kết quả phân tích
      if (licenseNumber && licenseClass) {
        if (onChange) {
          onChange(licenseNumber, licenseClass); // Gửi số GPLX và hạng bằng
        }
      } else {
        messageApi.error(
          "Hình ảnh không hợp lệ hoặc không chứa thông tin bằng lái."
        );
      }
    } catch (error) {
      messageApi.error(String(error));
    } finally {
      setLoading(false);
    }
  };

  const analyzeImage = async (imageUrl: string) => {
    // Chuyển đổi ảnh thành base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const requestBody = {
      requests: [
        {
          image: {
            content: base64.split(",")[1], // Phần base64 của chuỗi
          },
          features: [
            {
              type: "TEXT_DETECTION", // Sử dụng TEXT_DETECTION để trích xuất văn bản
              maxResults: 1,
            },
          ],
        },
      ],
    };

    try {
      const analysisResponse = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`,
        requestBody
      );

      const textAnnotations =
        analysisResponse.data.responses[0].textAnnotations;
      if (textAnnotations && textAnnotations.length > 0) {
        // Kiểm tra nội dung văn bản
        const detectedText = textAnnotations[0].description;

        // Kiểm tra xem văn bản có chứa "GIẤY PHÉP LÁI XE" hoặc "DRIVER'S LICENSE" hay không
        if (
          detectedText.includes("GIẤY PHÉP LÁI XE") ||
          detectedText.includes("DRIVER'S LICENSE")
        ) {
          // Sử dụng biểu thức chính quy để tìm số GPLX 12 chữ số
          const licenseNumberMatch = detectedText.match(/(\d{12})/);
          // Tìm kiếm hạng bằng từ chuỗi "CLASS: A1" hoặc tương tự
          const classFieldMatch = detectedText.match(/CLASS:\s*(\w+)/i);

          const licenseNumber = licenseNumberMatch
            ? licenseNumberMatch[0]
            : null;
          const licenseClass = classFieldMatch ? classFieldMatch[1] : null;

          return { licenseNumber, licenseClass };
        }
      }
      return { licenseNumber: null, licenseClass: null }; // Nếu không tìm thấy
    } catch (error) {
      messageApi.error("Đã xảy ra lỗi khi gọi Google Vision API");
      return { licenseNumber: null, licenseClass: null }; // Trả về null nếu có lỗi
    }
  };

  return (
    <>
      {contextHolder}
      <Upload.Dragger
        listType="picture-card"
        showUploadList={false}
        className="aspect-square p-0 upload-image-dragger ant-upload-btn-no-padding"
        style={uploadStyle}
        customRequest={async ({ file }) => {
          // Ép kiểu về File nếu đúng, nếu không thì bỏ qua
          if (file instanceof File) {
            await handleUpload(file);
          } else {
            messageApi.error("File upload không hợp lệ!");
          }
        }}
      >
        <Spin spinning={loading}>
          <div className="p-2 relative group">
            {image ? (
              <Image
                className="w-full h-full object-cover aspect-square rounded overflow-hidden"
                preview={false}
                src={image}
              />
            ) : (
              <CloudUploadOutlined />
            )}

            <div className="absolute w-full h-full top-0 left-0 bg-white/80 opacity-0 hover:opacity-100 flex justify-center items-center transition-all">
              <CloudUploadOutlined />
            </div>
          </div>
        </Spin>
      </Upload.Dragger>
    </>
  );
};
