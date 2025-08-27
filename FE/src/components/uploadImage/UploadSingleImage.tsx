import { Image, Spin, Upload, message } from "antd";
import { CloseCircleFilled, CloudUploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { useState, useEffect } from "react";
import type { CSSProperties } from "react";

interface UploadSingleImageProps {
  onChange?: (imageUrl: string) => void;
  value?: string;
}

const uploadStyle: CSSProperties = {
  padding: 0,
};

export const UploadSingleImage = ({
  onChange,
  value,
}: UploadSingleImageProps) => {
  const endpoint = process.env.NEXT_PUBLIC_CLOUDINARY_API!;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
  const googleVisionApiKey = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY!;
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | undefined>(value);

  useEffect(() => {
    setImage(value);
  }, [value]);

  const handleUpload = async (file: File) => {
    setLoading(true);

    try {
      messageApi.loading({
        content: "Đang kiểm tra nội dung ảnh...",
        key: "upload",
      });

      const isValidImage = await validateImageContent(file);

      if (!isValidImage) {
        messageApi.error({
          content:
            "Ảnh không hợp lệ: Phát hiện nội dung không phù hợp (bạo lực, NSFW, vũ khí, v.v.)",
          key: "upload",
          duration: 5,
        });
        return;
      }

      messageApi.loading({ content: "Đang tải ảnh lên...", key: "upload" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const { data } = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl = data?.url;
      setImage(imageUrl);

      if (onChange && imageUrl) {
        onChange(imageUrl);
      }

      messageApi.success({
        content: "Tải ảnh lên thành công!",
        key: "upload",
        duration: 3,
      });
    } catch (error) {
      console.error("Upload error:", error);
      messageApi.error({
        content: "Có lỗi xảy ra khi tải ảnh lên",
        key: "upload",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateImageContent = async (file: File): Promise<boolean> => {
    try {
      const base64 = await fileToBase64(file);

      const requestBody = {
        requests: [
          {
            image: {
              content: base64.split(",")[1],
            },
            features: [
              {
                type: "SAFE_SEARCH_DETECTION",
                maxResults: 1,
              },
              {
                type: "LABEL_DETECTION",
                maxResults: 20, // Tăng lên để có nhiều label hơn
              },
              {
                type: "OBJECT_LOCALIZATION", // Thêm để phát hiện object
                maxResults: 10,
              },
              {
                type: "TEXT_DETECTION", // Phát hiện text trong ảnh
                maxResults: 10,
              },
            ],
          },
        ],
      };

      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`,
        requestBody
      );

      const result = response.data.responses[0];

      // 1. Check Safe Search
      if (result.safeSearchAnnotation) {
        const safeSearch = result.safeSearchAnnotation;
        const checks = {
          adult: safeSearch.adult,
          violence: safeSearch.violence,
          racy: safeSearch.racy,
        };

        for (const [type, level] of Object.entries(checks)) {
          if (
            level === "LIKELY" ||
            level === "VERY_LIKELY" ||
            level === "POSSIBLE"
          ) {
            console.log(`Rejected due to ${type}: ${level}`);
            return false;
          }
        }
      }

      // 2. Check Labels
      if (result.labelAnnotations) {
        // Chỉ check label có confidence > 60%
        const highConfidenceLabels = result.labelAnnotations
          .filter((label: any) => label.score > 0.6)
          .map((label: any) => label.description.toLowerCase());

        console.log("Detected labels:", highConfidenceLabels);

        const hasDangerousContent = dangerousLabels.some((dangerous) =>
          highConfidenceLabels.some((detected: string) => {
            // Check exact word match
            const words = detected.split(/[\s,.-]+/);
            if (words.includes(dangerous)) return true;

            // Check với word boundary
            const regex = new RegExp(`\\b${dangerous}\\b`, "i");
            return regex.test(detected);
          })
        );

        if (hasDangerousContent) {
          console.log("Rejected due to dangerous labels");
          return false;
        }
      }

      // 3. Check Objects
      if (result.localizedObjectAnnotations) {
        const objects = result.localizedObjectAnnotations.map((obj: any) =>
          obj.name.toLowerCase()
        );

        console.log("Detected objects:", objects);

        const dangerousObjects = ["gun", "weapon", "knife", "rifle", "pistol"];
        const hasDangerousObject = objects.some((obj: string) =>
          dangerousObjects.some((dangerous) => obj.includes(dangerous))
        );

        if (hasDangerousObject) {
          console.log("Rejected due to dangerous objects");
          return false;
        }
      }

      // 4. Check Text (nếu có text về vũ khí)
      if (result.textAnnotations && result.textAnnotations.length > 0) {
        const detectedText =
          result.textAnnotations[0].description.toLowerCase();
        const dangerousWords = ["gun", "weapon", "kill", "death", "drug"];

        const hasDangerousText = dangerousWords.some((word) =>
          detectedText.includes(word)
        );

        if (hasDangerousText) {
          console.log("Rejected due to dangerous text");
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error validating image:", error);
      return false; // Return false để an toàn hơn
    }
  };

  const dangerousLabels = [
    // Vũ khí súng
    "weapon",
    "gun",
    "rifle",
    "pistol",
    "firearm",
    "revolver",
    "shotgun",
    "machine gun",
    "assault rifle",
    "sniper",
    "ammunition",
    "bullet",
    "trigger",
    "barrel",
    "magazine",
    "holster",
    "shooting",
    "gunshot",
    "armed",
    "military",
    "combat",
    "warfare",
    "artillery",
    "explosive",
    "grenade",
    "bomb",

    // Vũ khí lạnh
    "knife",
    "sword",
    "blade",
    "dagger",
    "machete",
    "axe",
    "spear",
    "arrow",
    "bow",

    // Bạo lực
    "violence",
    "blood",
    "gore",
    "death",
    "killing",
    "murder",
    "assault",
    "fight",
    "injury",
    "wound",
    "torture",

    // Ma túy
    "drug",
    "narcotic",
    "cocaine",
    "heroin",
    "marijuana",
    "cannabis",
    "meth",
    "pill",
    "syringe",
    "injection",

    // NSFW
    "nude",
    "nudity",
    "naked",
    "sexual",
    "porn",
    "pornography",
    "erotic",
    "adult",
    "xxx",
    "sex",
    "breast",
    "genital",

    // Khác
    "tobacco",
    "cigarette",
    "smoking",
    "alcohol",
    "beer",
    "wine",
    "liquor",
    "gambling",
    "casino",
  ];

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = () => {
    setImage(undefined);
    if (onChange) {
      onChange("");
    }
  };

  return (
    <>
      {contextHolder}
      {/* ✅ Chỉ hiển thị Upload.Dragger khi chưa có ảnh */}
      {!image ? (
        <Upload.Dragger
          listType="picture-card"
          showUploadList={false}
          className="aspect-square p-0 upload-image-dragger ant-upload-btn-no-padding"
          style={uploadStyle}
          accept="image/*"
          customRequest={async ({ file }) => {
            if (file instanceof File) {
              const validTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/gif",
                "image/webp",
              ];
              if (!validTypes.includes(file.type)) {
                messageApi.error(
                  "Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)!"
                );
                return;
              }

              if (file.size > 10 * 1024 * 1024) {
                messageApi.error("Kích thước file không được vượt quá 10MB!");
                return;
              }

              await handleUpload(file);
            } else {
              messageApi.error("File upload không hợp lệ!");
            }
          }}
        >
          <Spin spinning={loading}>
            <div className="flex flex-col items-center justify-center h-32">
              <CloudUploadOutlined className="text-3xl text-gray-400 mb-2" />
              <p className="text-gray-500 text-sm text-center">
                Nhấn hoặc kéo ảnh vào đây
              </p>
              <p className="text-gray-400 text-xs text-center mt-1">
                Hỗ trợ: JPG, PNG, GIF, WebP (tối đa 10MB)
              </p>
            </div>
          </Spin>
        </Upload.Dragger>
      ) : (
        // ✅ Khi có ảnh, chỉ hiển thị ảnh với nút xóa, không có Upload
        <div className="rounded overflow-hidden aspect-square relative">
          {/* ✅ Nút X giống UploadMultipleImage */}
          <CloseCircleFilled
            className="absolute z-50 cursor-pointer right-0 top-0 text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
          />

          {/* ✅ Ảnh chỉ để preview, không trigger upload */}
          <Image
            src={image}
            className="w-full h-full object-contain aspect-square"
            preview={true}
          />
        </div>
      )}
    </>
  );
};
