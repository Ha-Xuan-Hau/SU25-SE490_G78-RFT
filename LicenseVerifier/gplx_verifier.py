import easyocr
import re
import json
import os
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
    """Tìm hạng bằng lái"""
    # Xử lý ngoại lệ cho việc OCR nhận diện nhầm các ký tự
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
        
        # Kiểm tra xem text có chứa từ khóa chỉ báo không
        for indicator in LICENSE_CLASS_KEYWORDS['class_indicators']:
            if normalize_text(indicator) in normalized_text:
                # Trường hợp 1: Hạng và giá trị trong cùng một text
                
                # Tìm vị trí từ khóa trong text
                idx = normalized_text.find(normalize_text(indicator))
                # Lấy phần còn lại sau từ khóa
                remaining = normalized_text[idx + len(normalize_text(indicator)):].strip()
                # Nếu có các ký tự như ":", "/", " " ngay sau từ khóa, loại bỏ chúng
                remaining = re.sub(r'^[:/ ]+', '', remaining)
                
                # Áp dụng xử lý ngoại lệ OCR
                remaining = handle_ocr_exceptions(remaining)
                
                # Kiểm tra hạng từ dài đến ngắn
                sorted_class_keys = sorted(LICENSE_CLASS_KEYWORDS['class_values'].keys(), 
                                         key=lambda x: len(x), reverse=True)
                
                for class_key in sorted_class_keys:
                    class_variants = LICENSE_CLASS_KEYWORDS['class_values'][class_key]
                    for variant in class_variants:
                        norm_variant = normalize_text(variant)
                        if remaining == norm_variant or remaining.startswith(norm_variant):
                            return class_key
                
                # Trường hợp 2: Tìm bằng regex
                patterns = [
                    # Hạng kết hợp (BE, C1E, etc.)
                    r'([abcdef])[\s\-]*([0-9l\/i])?[\s\-]*(e)',
                    # Hạng có số (A1, B2, etc.)
                    r'([abcdef])[\s\-]*([0-9l\/i])',
                    # Hạng đơn (A, B, C, etc.)
                    r'([abcdef])'
                ]
                
                for pattern in patterns:
                    match = re.search(pattern, remaining, re.IGNORECASE)
                    if match:
                        if len(match.groups()) == 3:  # Hạng kết hợp
                            prefix = match.group(1).upper()
                            middle = match.group(2) if match.group(2) else ""
                            if middle and middle.lower() in ['l', 'i', '/']:
                                middle = '1'
                            suffix = match.group(3).upper()
                            match_text = prefix + middle + suffix
                        elif len(match.groups()) == 2:  # Hạng có số
                            prefix = match.group(1).upper()
                            digit = match.group(2)
                            if digit.lower() in ['l', 'i', '/']:
                                digit = '1'
                            match_text = prefix + digit
                        else:  # Hạng đơn
                            match_text = match.group(1).upper()
                        
                        # Tìm lớp phù hợp
                        for class_key in LICENSE_CLASS_KEYWORDS['class_values']:
                            if class_key.upper() == match_text:
                                return class_key
    
    # Kiểm tra đặc biệt cho các trường hợp không có từ khóa chỉ báo
    for text in texts:
        normalized_text = handle_ocr_exceptions(normalize_text(text))
        
        # Kiểm tra xem text có phải là hạng bằng độc lập không
        for class_key, class_variants in LICENSE_CLASS_KEYWORDS['class_values'].items():
            for variant in class_variants:
                if normalized_text == normalize_text(variant):
                    return class_key
        
        # Tìm mẫu hạng bằng trong text
        patterns = [
            r'\b([abcdef])[\s\-]*([0-9l\/i])?[\s\-]*(e)\b',
            r'\b([abcdef])[\s\-]*([0-9l\/i])\b',
            r'\b([abcdef])\b'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, normalized_text, re.IGNORECASE)
            if matches:
                for match in matches:
                    if isinstance(match, tuple):
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
                    else:  # Hạng đơn
                        candidate = match.upper()
                    
                    # Kiểm tra ứng viên có phải là hạng bằng hợp lệ không
                    for class_key in LICENSE_CLASS_KEYWORDS['class_values']:
                        if class_key.upper() == candidate:
                            return class_key
    
    return None

def verify_gplx(image_path):
    """Xác thực và trích xuất thông tin từ ảnh GPLX"""
    # Kiểm tra xem file tồn tại không
    if not os.path.isfile(image_path):
        return {"error": f"Không tìm thấy file: {image_path}"}
    
    try:
        # Khởi tạo EasyOCR
        reader = easyocr.Reader(['vi', 'en'], gpu=False)
        
        # Thực hiện OCR trên ảnh
        results = reader.readtext(image_path)
        
        # Trích xuất text từ kết quả OCR
        all_texts = [text for _, text, _ in results]
        
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
        
        return license_result
        
    except Exception as e:
        return {"error": str(e)}

def verify_gplx_to_json(image_path, output_path=None):
    """Xác thực GPLX và lưu kết quả vào file JSON nếu cần"""
    result = verify_gplx(image_path)
    
    # Chuyển kết quả thành JSON
    result_json = json.dumps(result, ensure_ascii=False, indent=2)
    
    # Nếu có đường dẫn output, lưu kết quả vào file
    if output_path:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(result_json)
    
    return result_json

# Sử dụng hàm này khi file được chạy trực tiếp
if __name__ == "__main__":
    import sys
    
    # Kiểm tra đối số dòng lệnh
    if len(sys.argv) < 2:
        print("Sử dụng: python gplx_verifier.py <đường_dẫn_ảnh> [đường_dẫn_output_json]")
        sys.exit(1)
    
    # Lấy đường dẫn ảnh từ đối số dòng lệnh
    image_path = sys.argv[1]
    
    # Lấy đường dẫn output nếu có
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Xác thực và in kết quả
    result_json = verify_gplx_to_json(image_path, output_path)
    print(result_json)
