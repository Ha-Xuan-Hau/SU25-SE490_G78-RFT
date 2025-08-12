import { Image, Spin, Upload, message } from "antd";
import { CloseCircleFilled, CloudUploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { useEffect, useState, useRef } from "react";

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
  const googleVisionApiKey = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY!;

  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState<boolean>(false);
  const [images, setImages] = useState<string[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);

  // Ref để track việc đang xử lý batch upload
  const processingBatchRef = useRef<boolean>(false);

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
  // const isVehicleImage = async (file: File) => {
  //   const reader = new FileReader();
  //   const base64String = await new Promise<string>((resolve, reject) => {
  //     reader.onloadend = () => resolve(reader.result as string);
  //     reader.onerror = reject;
  //     reader.readAsDataURL(file);
  //   });

  //   const requestBody = {
  //     requests: [
  //       {
  //         image: {
  //           content: base64String.split(",")[1],
  //         },
  //         features: [
  //           {
  //             type: "LABEL_DETECTION",
  //             maxResults: 10,
  //           },
  //         ],
  //       },
  //     ],
  //   };

  //   try {
  //     const response = await axios.post(
  //       `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`,
  //       requestBody
  //     );

  //     const labels: { description: string }[] =
  //       response.data.responses[0].labelAnnotations;

  //     return labels.some(
  //       (label) =>
  //         label.description.toLowerCase().includes("car") ||
  //         label.description.toLowerCase().includes("motorbike") ||
  //         label.description.toLowerCase().includes("bicycle") ||
  //         label.description.toLowerCase().includes("vehicle")
  //     );
  //   } catch (error) {
  //     console.error("Google Vision API error:", error);
  //     messageApi.error("Error calling Google Vision API");
  //     return false;
  //   }
  // };

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
            content: base64String.split(",")[1],
          },
          features: [
            {
              type: "LABEL_DETECTION",
              maxResults: 20, // Tăng số lượng nhãn để có nhiều kết quả hơn
            },
            {
              type: "OBJECT_LOCALIZATION", // Thêm tính năng nhận diện đối tượng
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

      const responseData = response.data.responses[0];
      const labels: { description: string; score: number }[] =
        responseData.labelAnnotations || [];
      const objects: { name: string }[] =
        responseData.localizedObjectAnnotations || [];

      // Danh sách các từ khóa liên quan đến phương tiện (tiếng Anh)
      const vehicleKeywords = [
        // Xe ô tô
        "car",
        "automobile",
        "vehicle",
        "sedan",
        "suv",
        "truck",
        "pickup",
        "van",
        "minivan",
        "hatchback",
        "coupe",
        "convertible",
        "limousine",
        "taxi",
        "cab",
        "bus",
        "coach",
        "minibus",
        "jeep",
        "crossover",
        "wagon",
        "estate",

        // Xe máy
        "motorcycle",
        "motorbike",
        "bike",
        "scooter",
        "moped",
        "chopper",
        "cruiser",
        "sportbike",
        "dirt bike",
        "touring motorcycle",
        "naked bike",
        "vespa",

        // Xe đạp
        "bicycle",
        "bike",
        "cycling",
        "mountain bike",
        "road bike",
        "bmx",
        "electric bike",
        "e-bike",
        "tandem",
        "tricycle",

        // Các loại xe khác
        // "ambulance",
        // "fire truck",
        // "police car",
        // "tow truck",
        // "garbage truck",
        // "delivery truck",
        // "cargo truck",
        // "trailer",
        // "semi-truck",
        // "lorry",

        // Các bộ phận xe
        "wheel",
        "tire",
        "headlight",
        "bumper",
        "windshield",
        "mirror",
        "hood",
        "door",
        "license plate",
        "steering wheel",
        "dashboard",
        "engine",

        // Từ khóa chung
        "transport",
        "transportation",
        "automotive",
        "motor vehicle",
        "land vehicle",
        "personal vehicle",
        "public transport",
        "commercial vehicle",

        // Xe điện
        "electric vehicle",
        "hybrid",
        "tesla",
        "electric car",
        "ev",

        // Xe thể thao
        "sports car",
        "racing car",
        "formula",
        "rally car",
        "drift car",
      ];

      // Kiểm tra nhãn từ Label Detection
      const hasVehicleLabel = labels.some((label) => {
        const description = label.description.toLowerCase();
        return (
          vehicleKeywords.some((keyword) =>
            description.includes(keyword.toLowerCase())
          ) && label.score > 0.5
        ); // Chỉ chấp nhận nhãn có độ tin cậy > 50%
      });

      // Kiểm tra đối tượng từ Object Localization
      const hasVehicleObject = objects.some((obj) => {
        const name = obj.name.toLowerCase();
        return vehicleKeywords.some((keyword) =>
          name.includes(keyword.toLowerCase())
        );
      });

      // Log để debug (có thể xóa trong production)
      console.log(
        "Detected labels:",
        labels.map((l) => `${l.description} (${l.score})`)
      );
      console.log(
        "Detected objects:",
        objects.map((o) => o.name)
      );
      console.log("Is vehicle:", hasVehicleLabel || hasVehicleObject);

      return hasVehicleLabel || hasVehicleObject;
    } catch (error) {
      console.error("Google Vision API error:", error);
      messageApi.error("Lỗi khi gọi Google Vision API");
      return false;
    }
  };

  // Xử lý batch upload
  const handleBatchUpload = async (fileList: File[]) => {
    if (processingBatchRef.current) {
      return Upload.LIST_IGNORE;
    }

    processingBatchRef.current = true;
    setLoading(true);

    try {
      // Kiểm tra số lượng
      if (images.length + fileList.length > 4) {
        messageApi.warning("Chỉ được phép tải lên tối đa 4 ảnh!");
        return Upload.LIST_IGNORE;
      }

      // Kiểm tra tên file trùng lặp
      const batchNames = fileList.map((f) => f.name);
      const duplicateNames = batchNames.filter((name) =>
        fileNames.includes(name)
      );
      if (duplicateNames.length > 0) {
        messageApi.error(
          `Không được upload các ảnh cùng tên: ${duplicateNames.join(", ")}`
        );
        return Upload.LIST_IGNORE;
      }

      // Kiểm tra tên file trùng lặp trong chính batch
      const uniqueNames = new Set(batchNames);
      if (uniqueNames.size !== batchNames.length) {
        messageApi.error("Không được chọn nhiều ảnh cùng tên trong một lần!");
        return Upload.LIST_IGNORE;
      }

      const uploadedImages: string[] = [];
      const uploadedNames: string[] = [];
      const errors: string[] = [];

      // Xử lý từng file
      for (const file of fileList) {
        if (images.length + uploadedImages.length >= 4) break;

        try {
          // Kiểm tra xem có phải ảnh xe không
          const isVehicle = await isVehicleImage(file);
          if (!isVehicle) {
            errors.push(`"${file.name}" không phải là ảnh xe!`);
            continue;
          }

          // Upload lên Cloudinary
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", uploadPreset);

          const { data } = await axios.post(endpoint, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          uploadedImages.push(data.url);
          uploadedNames.push(file.name);
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
          } else if (error instanceof Error) {
            msg = error.message;
          }
          errors.push(`Lỗi upload "${file.name}": ${msg}`);
        }
      }

      // Hiển thị kết quả
      if (errors.length > 0) {
        // Hiển thị tất cả lỗi trong một thông báo
        messageApi.error({
          content: (
            <div>
              <div>Có {errors.length} lỗi xảy ra:</div>
              {errors.map((error, index) => (
                <div key={index} style={{ marginTop: 4, fontSize: "12px" }}>
                  • {error}
                </div>
              ))}
            </div>
          ),
          duration: 6,
        });
      }

      if (uploadedImages.length > 0) {
        const newImages = [...images, ...uploadedImages];
        const newFileNames = [...fileNames, ...uploadedNames];
        setImages(newImages);
        setFileNames(newFileNames);
        onChange?.(newImages);

        messageApi.success(
          `Đã tải lên thành công ${uploadedImages.length} ảnh!`
        );
      }
    } finally {
      setLoading(false);
      processingBatchRef.current = false;
    }

    return Upload.LIST_IGNORE;
  };

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
            beforeUpload={(file, fileList) => {
              // Chỉ xử lý khi là file đầu tiên trong batch
              if (fileList[0] === file) {
                return handleBatchUpload(fileList);
              }
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
