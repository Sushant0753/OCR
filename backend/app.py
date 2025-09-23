from flask import Flask, request, jsonify
import cv2
import numpy as np
import easyocr
import base64
import logging
from PIL import Image
import io
import os

app = Flask(__name__)

reader = easyocr.Reader(['en'], gpu=False)

def process_document(file_bytes):
    try:
        # Read image from bytes
        img_np = np.frombuffer(file_bytes, np.uint8)
        image = cv2.imdecode(img_np, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Unable to decode image file")
        results = reader.readtext(image)
        extracted_text = ' '.join(detection[1] for detection in results)
        # Draw bounding boxes (optional)
        for detection in results:
            points = np.array(detection[0]).astype(np.int32)
            cv2.polylines(image, [points], isClosed=True, color=(0,255,0), thickness=2)
        _, buffer = cv2.imencode('.png', image)
        image_base64 = base64.b64encode(buffer).decode('utf-8')
        response = {
            'status': 'success',
            'extracted_text': extracted_text,
            'extracted_image': image_base64,
            'word_count': len(extracted_text.split()),
            'character_count': len(extracted_text),
            'num_detections': len(results)
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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)