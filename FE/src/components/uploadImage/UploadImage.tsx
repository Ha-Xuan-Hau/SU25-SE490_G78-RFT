import { Image, Spin, Upload, message } from "antd";
import { CloudUploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { useState } from "react";
import type { CSSProperties } from "react";
import { showApiError } from "@/utils/toast.utils";

interface UploadImageProps {
  onChange?: (
    licenseNumber: string,
    licenseClass: string,
    imageUrl?: string
  ) => void;
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

    try {
      // Bước 1: Đọc base64 từ file TRƯỚC
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Bước 2: Phân tích với Google Vision
      const analysisResult = await analyzeImageFromBase64(base64String);

      // Bước 3: Nếu hợp lệ, mới upload lên Cloudinary
      if (analysisResult.licenseNumber && analysisResult.licenseClass) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const { data } = await axios.post(endpoint, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // Sử dụng secure_url
        const imageUrl = data?.secure_url || data?.url;
        setImage(imageUrl);

        if (onChange) {
          onChange(
            analysisResult.licenseNumber,
            analysisResult.licenseClass,
            imageUrl
          );
        }
      } else {
        messageApi.error(
          "Hình ảnh không hợp lệ hoặc không chứa thông tin bằng lái."
        );
        if (onChange) {
          onChange("", "", "");
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      showApiError("Lỗi khi tải ảnh lên");
    } finally {
      setLoading(false);
    }
  };

  const analyzeImageFromBase64 = async (base64String: string) => {
    const requestBody = {
      requests: [
        {
          image: {
            content: base64String.split(",")[1],
          },
          features: [
            {
              type: "TEXT_DETECTION",
              maxResults: 1,
            },
          ],
        },
      ],
    };

    try {
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`,
        requestBody
      );

      const textAnnotations = response.data.responses[0].textAnnotations;

      if (textAnnotations && textAnnotations.length > 0) {
        const detectedText = textAnnotations[0].description;

        if (
          detectedText.includes("GIẤY PHÉP LÁI XE") ||
          detectedText.includes("DRIVER'S LICENSE")
        ) {
          const licenseNumberMatch = detectedText.match(/(\d{12})/);
          const classFieldMatch = detectedText.match(/CLASS:\s*(\w+)/i);

          return {
            licenseNumber: licenseNumberMatch ? licenseNumberMatch[0] : null,
            licenseClass: classFieldMatch ? classFieldMatch[1] : null,
          };
        }
      }

      return { licenseNumber: null, licenseClass: null };
    } catch (error) {
      console.error("Google Vision API error:", error);
      messageApi.error("Lỗi khi phân tích hình ảnh");
      return { licenseNumber: null, licenseClass: null };
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
