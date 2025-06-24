# API Xác thực Giấy phép lái xe Việt Nam

API này cung cấp khả năng xác thực và trích xuất thông tin từ ảnh Giấy phép lái xe Việt Nam, trả về kết quả dưới dạng JSON.

## Cài đặt

1. Đảm bảo đã cài đặt Python (phiên bản 3.x)
2. Cài đặt các thư viện cần thiết:

```
pip install -r requirements.txt
```

## Chạy API

```
python app.py
```

API sẽ chạy tại địa chỉ http://localhost:8080

## Sử dụng API

### Giao diện web

Truy cập http://localhost:8080 để sử dụng giao diện web đơn giản cho việc tải lên và xác thực ảnh GPLX.

### API Endpoints

#### 1. Xác thực GPLX

**URL:** `/api/verify`
**Phương thức:** `POST`
**Content-Type:** `multipart/form-data`
**Tham số:**

- `image`: File ảnh GPLX (định dạng jpg, jpeg, png)

**Phản hồi:**

```json
{
  "IsLegit": true,
  "LicenseNumber": "123456789012",
  "LicenseClass": "B1"
}
```

Trong đó:

- `IsLegit`: `true` nếu ảnh được xác nhận là GPLX hợp lệ, ngược lại là `false`
- `LicenseNumber`: Số GPLX (12 chữ số)
- `LicenseClass`: Hạng bằng lái (A1, A, B1, B, C1, C, D1, D2, D, BE, C1E, CE, D1E, D2E, DE)

#### 2. Kiểm tra trạng thái API

**URL:** `/api/health`
**Phương thức:** `GET`

**Phản hồi:**

```json
{
  "status": "ok",
  "message": "API đang hoạt động"
}
```

## Ví dụ sử dụng với cURL

```bash
curl -X POST -F "image=@/đường/dẫn/tới/ảnh/gplx.jpg" http://localhost:8080/api/verify
```

## Ví dụ sử dụng với JavaScript

```javascript
const formData = new FormData();
formData.append("image", fileInputElement.files[0]);

fetch("http://localhost:8080/api/verify", {
  method: "POST",
  body: formData,
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Error:", error));
```

## Lưu ý

- API giới hạn kích thước tệp tối đa là 16MB
- Chỉ chấp nhận các định dạng ảnh: PNG, JPG, JPEG
- Ảnh phải rõ ràng, không bị mờ, và chứa thông tin GPLX đầy đủ
- Tệp tải lên sẽ bị xóa sau khi xử lý để đảm bảo bảo mật
