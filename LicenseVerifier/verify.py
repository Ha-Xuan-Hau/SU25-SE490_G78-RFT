import easyocr
import cv2
import re
import json
from gplx_dictionary import GPLX_TYPE_KEYWORDS, LICENSE_CLASS_KEYWORDS, LICENSE_NUMBER_KEYWORDS, ID_PATTERNS

def normalize_text(text):
    """Chuẩn hóa văn bản để dễ so sánh"""
    if text is None:
        return ""
    # Chuyển thành chữ thường và loại bỏ khoảng trắng thừa
    return text.lower().strip()

def find_license_type(texts):
    """Kiểm tra xem đây có phải là GPLX hay không"""
    for text in texts:
        normalized_text = normalize_text(text)
        for keyword in GPLX_TYPE_KEYWORDS['driver_license']:
            if normalize_text(keyword) in normalized_text:
                return True
    return False

def find_license_number(texts):
    """Tìm số GPLX 12 số"""
    # Tìm trước theo từ khóa chỉ báo
    for i, text in enumerate(texts):
        normalized_text = normalize_text(text)
        
        # Kiểm tra xem text có chứa từ khóa chỉ báo không
        for indicator in LICENSE_NUMBER_KEYWORDS['number_indicators']:
            if normalize_text(indicator) in normalized_text:
                # Trường hợp số nằm trong cùng text với từ khóa
                for pattern in ID_PATTERNS:
                    matches = re.findall(pattern, text)
                    if matches:
                        return matches[0]
                
                # Trường hợp số nằm ở text tiếp theo
                if i + 1 < len(texts):
                    next_text = texts[i + 1]
                    for pattern in ID_PATTERNS:
                        matches = re.findall(pattern, next_text)
                        if matches:
                            return matches[0]
    
    # Nếu không tìm thấy bằng từ khóa, tìm bất kỳ chuỗi nào khớp với pattern
    for text in texts:
        for pattern in ID_PATTERNS:
            matches = re.findall(pattern, text)
            if matches:
                return matches[0]
    
    return None

def find_license_class(texts):
    """Tìm hạng bằng lái"""    # Xử lý ngoại lệ cho việc OCR nhận diện nhầm các ký tự
    def handle_ocr_exceptions(text):
        # Thay thế 'l' thành '1' sau chữ cái
        text = re.sub(r'([A-Za-z])l\b', r'\g<1>1', text)
        
        # Thay thế 'I' thành '1' sau chữ cái
        text = re.sub(r'([A-Za-z])I\b', r'\g<1>1', text)
        
        # Thay thế '/' thành '1' sau chữ cái
        text = re.sub(r'([A-Za-z])/\b', r'\g<1>1', text)
        
        # Xử lý các trường hợp đặc biệt
        text = re.sub(r'BI1', 'B1', text, flags=re.IGNORECASE)
        text = re.sub(r'AI1', 'A1', text, flags=re.IGNORECASE)
        text = re.sub(r'CI1', 'C1', text, flags=re.IGNORECASE)
        text = re.sub(r'DI1', 'D1', text, flags=re.IGNORECASE)
        
        # Loại bỏ khoảng trắng giữa các ký tự của hạng bằng
        text = re.sub(r'([A-Za-z])\s+([0-9])', r'\1\2', text)
        text = re.sub(r'([A-Za-z][0-9])\s+([A-Za-z])', r'\1\2', text)
        
        return text
    
    for i, text in enumerate(texts):
        normalized_text = normalize_text(text)
        print(f"Kiểm tra text: '{normalized_text}'")
        
        # Kiểm tra xem text có chứa từ khóa chỉ báo không
        for indicator in LICENSE_CLASS_KEYWORDS['class_indicators']:
            if normalize_text(indicator) in normalized_text:
                print(f"Tìm thấy chỉ báo: '{indicator}' trong '{normalized_text}'")
                # Trường hợp 1: Hạng và giá trị trong cùng một text
                # Tìm giá trị ngay sau từ khóa
                
                # Tìm vị trí từ khóa trong text
                idx = normalized_text.find(normalize_text(indicator))
                # Lấy phần còn lại sau từ khóa
                remaining = normalized_text[idx + len(normalize_text(indicator)):].strip()
                # Nếu có các ký tự như ":", "/", " " ngay sau từ khóa, loại bỏ chúng
                remaining = re.sub(r'^[:/ ]+', '', remaining)
                
                # Áp dụng xử lý ngoại lệ OCR
                remaining = handle_ocr_exceptions(remaining)
                
                print(f"Sau khi tách từ khóa: '{remaining}'")
                
                # Kiểm tra hạng từ 2 ký tự trước (A1, B1, v.v.) trước các hạng 1 ký tự (C, D, v.v.)
                # Sắp xếp theo độ dài giảm dần để ưu tiên các khớp dài hơn (A1 trước C)
                sorted_class_keys = sorted(LICENSE_CLASS_KEYWORDS['class_values'].keys(), 
                                         key=lambda x: len(x), reverse=True)
                
                for class_key in sorted_class_keys:
                    class_variants = LICENSE_CLASS_KEYWORDS['class_values'][class_key]
                    for variant in class_variants:
                        norm_variant = normalize_text(variant)
                        if remaining == norm_variant or remaining.startswith(norm_variant):
                            print(f"Tìm thấy hạng: {class_key} (từ '{norm_variant}' trong '{remaining}')")
                            return class_key
                              # Trường hợp 2: Nếu không tìm thấy khớp chính xác, tìm kiếm bằng biểu thức chính quy
                # Xử lý trường hợp phức tạp hơn với nhiều biến thể của hạng bằng
                
                # Mẫu regex cho các hạng bằng đơn (A, B, C, D, E)
                single_match = re.search(r'\b([abcdef])\b', remaining, re.IGNORECASE)
                
                # Mẫu regex cho các hạng bằng với số (A1, B1, C1, D1, D2)
                numbered_match = re.search(r'([abcdef])[\s\-]*([0-9l\/i])', remaining, re.IGNORECASE)
                
                # Mẫu regex cho các hạng bằng kết hợp (BE, CE, DE, C1E, v.v.)
                combined_match = re.search(r'([abcdef])[\s\-]*([0-9l\/i])?[\s\-]*(e)', remaining, re.IGNORECASE)
                
                if combined_match:  # Ưu tiên nhận dạng hạng bằng kết hợp trước
                    prefix = combined_match.group(1).upper()
                    middle = combined_match.group(2) if combined_match.group(2) else ""
                    suffix = combined_match.group(3).upper()
                    
                    # Chuẩn hóa middle part (1 hoặc 2)
                    if middle:
                        if middle.lower() in ['l', 'i', '/']:
                            middle = '1'
                    
                    match_text = prefix + middle + suffix
                    print(f"Tìm thấy hạng kết hợp bằng regex: '{match_text}'")
                    
                    # Tìm lớp phù hợp
                    for class_key in LICENSE_CLASS_KEYWORDS['class_values']:
                        if class_key.upper() == match_text:
                            return class_key
                
                elif numbered_match:  # Sau đó nhận dạng hạng bằng có số
                    prefix = numbered_match.group(1).upper()
                    digit = numbered_match.group(2)
                    
                    # Chuẩn hóa số
                    if digit.lower() in ['l', 'i', '/']:
                        digit = '1'
                    
                    match_text = prefix + digit
                    print(f"Tìm thấy hạng có số bằng regex: '{match_text}'")
                    
                    # Tìm lớp phù hợp
                    for class_key in LICENSE_CLASS_KEYWORDS['class_values']:
                        if class_key.upper() == match_text:
                            return class_key
                
                elif single_match:  # Cuối cùng nhận dạng hạng bằng đơn
                    match_text = single_match.group(1).upper()
                    print(f"Tìm thấy hạng đơn bằng regex: '{match_text}'")
                    
                    # Tìm lớp phù hợp
                    for class_key in LICENSE_CLASS_KEYWORDS['class_values']:
                        if class_key.upper() == match_text:
                            return class_key
      # Kiểm tra đặc biệt cho các trường hợp không có từ khóa chỉ báo
    for text in texts:
        normalized_text = handle_ocr_exceptions(normalize_text(text))
        
        # Kiểm tra xem text có phải là một hạng bằng độc lập không
        for class_key, class_variants in LICENSE_CLASS_KEYWORDS['class_values'].items():
            for variant in class_variants:
                norm_variant = normalize_text(variant)
                # So sánh toàn bộ text hoặc khi text kết thúc với dấu :
                if normalized_text == norm_variant or normalized_text.rstrip(':') == norm_variant:
                    print(f"Tìm thấy hạng độc lập: {class_key} từ '{normalized_text}'")
                    return class_key
        
        # Thử tìm kiếm mẫu hạng bằng trong text
        # Tìm mẫu như "B1", "A2", "C1E", etc.
        patterns = [
            # Hạng kết hợp (BE, C1E, etc.)
            r'\b([abcdef])[\s\-]*([0-9l\/i])?[\s\-]*(e)\b',
            # Hạng có số (A1, B2, etc.)
            r'\b([abcdef])[\s\-]*([0-9l\/i])\b',
            # Hạng đơn (A, B, C, etc.)
            r'\b([abcdef])\b'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, normalized_text, re.IGNORECASE)
            if matches:
                for match in matches:
                    if isinstance(match, tuple):  # Kết quả là tuple cho các capturing groups
                        if len(match) == 3:  # Hạng kết hợp
                            prefix = match[0].upper()
                            middle = match[1] if match[1] else ""
                            if middle and middle.lower() in ['l', 'i', '/']:
                                middle = '1'
                            suffix = match[2].upper()
                            candidate = prefix + middle + suffix
                        else:  # Hạng có số
                            prefix = match[0].upper()
                            digit = match[1]
                            if digit.lower() in ['l', 'i', '/']:
                                digit = '1'
                            candidate = prefix + digit
                    else:  # Kết quả là string cho hạng đơn
                        candidate = match.upper()
                    
                    print(f"Tìm thấy ứng viên: '{candidate}' trong '{normalized_text}'")
                    
                    # Kiểm tra ứng viên có phải là hạng bằng hợp lệ không
                    for class_key in LICENSE_CLASS_KEYWORDS['class_values']:
                        if class_key.upper() == candidate:
                            return class_key
    
    return None

# Initialize the EasyOCR reader
reader = easyocr.Reader(['vi', 'en'], gpu=False)

# Load the image
image_path = 'images/LONG_GPLX.JPG'
image = cv2.imread(image_path)

# Perform OCR on the image
results = reader.readtext(image)

# Danh sách chứa tất cả text được nhận dạng
all_texts = []

# Iterate over the results and draw bounding boxes
for i, (bbox, text, prob) in enumerate(results):
    all_texts.append(text)
    
    # Unpack the bounding box
    (top_left, top_right, bottom_right, bottom_left) = bbox

    # Convert coordinates to integers
    top_left = tuple(map(int, top_left))
    top_right = tuple(map(int, top_right))
    bottom_right = tuple(map(int, bottom_right))
    bottom_left = tuple(map(int, bottom_left))

    # Draw the bounding box
    cv2.line(image, top_left, top_right, (0, 0, 255), 2)
    cv2.line(image, top_right, bottom_right, (0, 0, 255), 2)
    cv2.line(image, bottom_right, bottom_left, (0, 0, 255), 2)
    cv2.line(image, bottom_left, top_left, (0, 0, 255), 2)

    box_number = f"{i + 1}"
    cv2.putText(image, box_number, (top_left[0] + 20, top_left[1] - 2),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

# Xác thực và trích xuất thông tin
is_legit = find_license_type(all_texts)
license_result = {
    "IsLegit": is_legit
}

if is_legit:
    license_number = find_license_number(all_texts)
    license_class = find_license_class(all_texts)
    
    license_result["LicenseNumber"] = license_number if license_number else ""
    license_result["LicenseClass"] = license_class if license_class else ""

# Chuyển kết quả thành JSON
result_json = json.dumps(license_result, ensure_ascii=False, indent=2)

# In kết quả JSON
print("\nKết quả xác thực GPLX:")
print(result_json)

# Lưu hình ảnh với các bounding box
cv2.imwrite('images/result.jpg', image)

# In thông tin gỡ lỗi
print("\nDebug - Tất cả text được nhận dạng:")
for i, text in enumerate(all_texts):
    print(f"Box {i+1}: {text}")