from flask import Flask, request, jsonify
import cv2
import numpy as np
import pytesseract
import base64
import logging
from PIL import Image
import io
import os

app = Flask(_name_)

def process_document(file_bytes):
    try:
        # Read image from bytes
        img_np = np.frombuffer(file_bytes, np.uint8)
        image = cv2.imdecode(img_np, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Unable to decode image file")
        
        # Convert to PIL for tesseract
        pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        
        # Get text and bounding boxes
        data = pytesseract.image_to_data(pil_image, output_type=pytesseract.Output.DICT)
        
        # Extract text
        extracted_text = ' '.join([word for word in data['text'] if word.strip()])
        
        # Draw bounding boxes
        n_boxes = len(data['text'])
        detection_count = 0
        for i in range(n_boxes):
            if int(data['conf'][i]) > 30:  # confidence threshold
                (x, y, w, h) = (data['left'][i], data['top'][i], data['width'][i], data['height'][i])
                cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
                detection_count += 1
        
        _, buffer = cv2.imencode('.png', image)
        image_base64 = base64.b64encode(buffer).decode('utf-8')
        
        response = {
            'status': 'success',
            'extracted_text': extracted_text,
            'extracted_image': image_base64,
            'word_count': len(extracted_text.split()),
            'character_count': len(extracted_text),
            'num_detections': detection_count
        }
        return response
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }

@app.route('/ocr', methods=['POST'])
def ocr():
    if not request.data:
        return jsonify({'status': 'error', 'error': 'No data provided'}), 400
    result = process_document(request.data)
    return jsonify(result)

if _name_ == '_main_':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
