from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
from werkzeug.utils import secure_filename
from gplx_verifier import verify_gplx

app = Flask(__name__, static_folder='static')
CORS(app)  # Cho phép Cross Origin Resource Sharing

# Thư mục lưu trữ tệp tạm thời
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'temp_uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Giới hạn kích thước tệp là 16MB

# Các phần mở rộng tệp được phép
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/verify', methods=['POST'])
def verify_license():
    # Kiểm tra xem request có chứa tệp không
    if 'image' not in request.files:
        return jsonify({'error': 'Không có tệp nào được tải lên'}), 400
    
    file = request.files['image']
    
    # Nếu người dùng không chọn tệp
    if file.filename == '':
        return jsonify({'error': 'Không có tệp nào được chọn'}), 400
    
    # Nếu tệp hợp lệ
    if file and allowed_file(file.filename):
        try:
            # Tạo tên tệp an toàn với uuid để tránh trùng lặp
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            
            # Lưu tệp
            file.save(filepath)
            
            # Xác thực GPLX
            result = verify_gplx(filepath)
            
            # Xóa tệp tạm sau khi xử lý
            os.remove(filepath)
            
            # Trả về kết quả
            return jsonify(result)
        
        except Exception as e:
            # Xử lý lỗi nếu có
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'Loại tệp không được phép. Chỉ chấp nhận các tệp PNG, JPG, JPEG'}), 400

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'API đang hoạt động'}), 200

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
