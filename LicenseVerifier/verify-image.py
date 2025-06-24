import easyocr
import cv2

# Initialize the EasyOCR reader
reader = easyocr.Reader(['vi', 'en'], gpu=False)

# Load the image
image_path = 'images/LONG_GPLX.JPG'
image = cv2.imread(image_path)

# Perform OCR on the image
results = reader.readtext(image)

# Iterate over the results and draw bounding boxes
for i, (bbox, text, prob) in enumerate(results):
    print(f'Box: {bbox}, Text: {text}, Probability: {prob}')

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
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

# Save the image
cv2.imwrite('images/result.jpg', image)

# Không sử dụng hiển thị cửa sổ vì có thể không được hỗ trợ
# cv2.imshow('Image with OCR', image)
# cv2.waitKey(0)
# cv2.destroyAllWindows()

# coordinate 1. 2. 7. 8. 23. 24. 25