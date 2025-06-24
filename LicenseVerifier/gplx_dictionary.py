# -*- coding: utf-8 -*-
"""
Từ điển nhận diện thông tin Giấy phép lái xe (GPLX)
15 hạng bằng lái xe A1, A, B1, B, C1, C, D1, D2, D, BE, C1E, CE, D1E, D2E, DE.
"""

# Từ điển nhận diện tiêu đề giấy phép
GPLX_TYPE_KEYWORDS = {
    'driver_license': [
        'GIẤY PHÉP LÁI XE',
        'GIAY PHEP LAI XE', 
        "DRIVER'S LICENSE",
        'DRIVERS LICENSE'
    ]
}

# Từ điển hạng bằng lái
LICENSE_CLASS_KEYWORDS = {
    'class_indicators': [
        'Hạng Class',
        'Hang Class',
        'Hạng/Class',
        'HangCless',
        'Hạng:',
        'Hang:',
        'Hạng',
        'Hang',
        'CLASS',
        'Class:'
    ],
    'class_values': {
        'A1': ['A1', 'A 1', 'Al', 'A l', 'AI', 'A I', 'A/'],
        'A': ['A'],
        'B1': ['B1', 'B 1', 'Bl', 'B l', 'BI', 'B I', 'B/'],
        'B': ['B'],
        'C1': ['C1', 'C 1', 'Cl', 'C l', 'CI', 'C I', 'C/'],
        'C': ['C'],
        'D1': ['D1', 'D 1', 'Dl', 'D l', 'DI', 'D I', 'D/'],
        'D2': ['D2', 'D 2'],
        'D': ['D'],
        'BE': ['BE', 'B E', 'B-E'],
        'C1E': ['C1E', 'C 1E', 'C1 E', 'C 1 E', 'ClE', 'C lE', 'CIE', 'C IE', 'C/E'],
        'CE': ['CE', 'C E', 'C-E'],
        'D1E': ['D1E', 'D 1E', 'D1 E', 'D 1 E', 'DlE', 'D lE', 'DIE', 'D IE', 'D/E'],
        'D2E': ['D2E', 'D 2E', 'D2 E', 'D 2 E'],
        'DE': ['DE', 'D E', 'D-E']
    }
}

# Từ điển thông tin số GPLX
LICENSE_NUMBER_KEYWORDS = {
    'number_indicators': [
        'Số:',
        'So:',
        'Số',
        'So',
        'No.',
        'No:'
    ]
}

# Mẫu regex cho số ID/GPLX - chỉ dùng 12 số hiện hành
ID_PATTERNS = [
    r'\d{12}'  # 12 số
]
