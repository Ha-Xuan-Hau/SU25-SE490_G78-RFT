import { Image, Spin, Upload, message } from "antd";
import { CloseCircleFilled, CloudUploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { useEffect, useState } from "react";

interface UploadMultipleImageProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
}

export const UploadMultipleImage = ({
  value,
  onChange,
}: UploadMultipleImageProps) => {
  const endpoint = process.env.NEXT_PUBLIC_CLOUDINARY_API!;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
  const googleVisionApiKey = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY!; // Your Google Vision API key

  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState<boolean>(false);
  const [images, setImages] = useState<string[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);

  useEffect(() => {
    if (value && Array.isArray(value)) {
      setImages(value);
      setFileNames(
        value.map((url) => {
          try {
            return decodeURIComponent(
              url.split("/").pop()?.split("?")[0] || ""
            );
          } catch {
            return "";
          }
        })
      );
    }
  }, [value]);

  // Function to call Google Vision API
  const isVehicleImage = async (file: File) => {
    const reader = new FileReader();
    const base64String = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const requestBody = {
      requests: [
        {
          image: {
            content: base64String.split(",")[1], // Get base64 part of the string
          },
          features: [
            {
              type: "LABEL_DETECTION",
              maxResults: 10,
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

      const labels: { description: string }[] =
        response.data.responses[0].labelAnnotations;

      return labels.some(
        (label) =>
          label.description.toLowerCase().includes("car") ||
          label.description.toLowerCase().includes("motorbike") ||
          label.description.toLowerCase().includes("bicycle") ||
          label.description.toLowerCase().includes("vehicle")
      );
    } catch (error) {
      console.error("Google Vision API error:", error);
      messageApi.error("Error calling Google Vision API");
      return false; // Default to false on error
    }
  };

  // Always use local images state for display, but keep parent in sync
  const computedValue = images;

  return (
    <>
      {contextHolder}
      <div className="grid gap-2 grid-cols-3">
        {images.map((image: string, idx: number) => (
          <div
            key={image}
            className="rounded overflow-hidden aspect-square relative"
          >
            <CloseCircleFilled
              className="absolute z-50 cursor-pointer right-0 top-0 text-red-500"
              onClick={() => {
                const newImages = images.filter((e: string) => e !== image);
                const newFileNames = fileNames.filter((_, i) => i !== idx);
                setImages(newImages);
                setFileNames(newFileNames);
                onChange?.(newImages);
              }}
            />
            <Image
              src={image}
              className="w-full h-full object-contain aspect-square"
            />
          </div>
        ))}

        {images.length < 4 && (
          <Upload.Dragger
            listType="picture-card"
            showUploadList={false}
            className="aspect-square p-0"
            multiple
            beforeUpload={async (file, fileList) => {
              if (images.length + fileList.length > 4) {
                messageApi.warning("Chỉ được phép tải lên tối đa 4 ảnh!");
                return Upload.LIST_IGNORE;
              }
              const batchNames = fileList.map((f) => f.name);
              if (batchNames.some((name) => fileNames.includes(name))) {
                messageApi.error("Không được upload hai ảnh cùng tên!");
                return Upload.LIST_IGNORE;
              }

              setLoading(true);
              const uploadedImages: string[] = [];
              const uploadedNames: string[] = [];

              for (const f of fileList) {
                if (images.length + uploadedImages.length >= 4) break;

                // Check if the image is a vehicle using Google Vision API
                const isVehicle = await isVehicleImage(f);
                if (!isVehicle) {
                  messageApi.error(`"${f.name}" không phải là ảnh xe!`);
                  continue; // Skip this file if it's not a vehicle
                }

                const name = (f as File).name;
                if (fileNames.includes(name) || uploadedNames.includes(name)) {
                  messageApi.error("Không được upload hai ảnh cùng tên!");
                  continue;
                }
                const formData = new FormData();
                formData.append("file", f);
                formData.append("upload_preset", uploadPreset);
                try {
                  const { data } = await axios.post(endpoint, formData, {
                    headers: {
                      "Content-Type": "multipart/form-data",
                    },
                  });
                  uploadedImages.push(data.url);
                  uploadedNames.push(name);
                } catch (error) {
                  let msg = "Lỗi không xác định";
                  if (error && typeof error === "object") {
                    const axiosError = error as {
                      response?: {
                        data?: {
                          error?: { message?: string };
                          message?: string;
                        };
                      };
                      message?: string;
                    };
                    msg =
                      axiosError.response?.data?.error?.message ||
                      axiosError.response?.data?.message ||
                      axiosError.message ||
                      msg;
                    console.error(
                      "Cloudinary upload error:",
                      axiosError.response?.data || axiosError
                    );
                  } else if (error instanceof Error) {
                    msg = error.message;
                    console.error("Cloudinary upload error:", error);
                  }
                  messageApi.error(msg);
                }
              }
              const newImages = [...images, ...uploadedImages];
              const newFileNames = [...fileNames, ...uploadedNames];
              setImages(newImages);
              setFileNames(newFileNames);
              onChange?.(newImages);
              setLoading(false);
              return Upload.LIST_IGNORE;
            }}
          >
            <Spin spinning={loading}>
              <CloudUploadOutlined />
            </Spin>
          </Upload.Dragger>
        )}
      </div>
    </>
  );
};
