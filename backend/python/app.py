from flask import Flask, request, jsonify
import cv2
import pytesseract
import numpy as np
import base64

app = Flask(__name__)

# Path to tesseract binary
pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"

def preprocess_image(image):
    """Preprocess image for OCR"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 9, 75, 75)
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        199, 5
    )
    return thresh

def ocr_image(image):
    """Perform OCR with bounding boxes + confidence"""
    config = "--oem 3 --psm 6"
    data = pytesseract.image_to_data(
        image,
        output_type=pytesseract.Output.DICT,
        config=config
    )
    results = []
    for i in range(len(data["text"])):
        text = str(data["text"][i]).strip()
        if text:
            try:
                conf = float(data["conf"][i]) / 100  # confidence scaled 0-1
            except (ValueError, TypeError):
                conf = 0.0
            x, y, w, h = data["left"][i], data["top"][i], data["width"][i], data["height"][i]
            box = [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]
            results.append((box, text, conf))
    return results

def draw_boxes(image, results):
    """Draw bounding boxes on image"""
    output = image.copy()
    for box, text, conf in results:
        pts = np.array(box, np.int32).reshape((-1, 1, 2))
        color = (0, int(255 * conf), 0)  # green intensity proportional to confidence
        cv2.polylines(output, [pts], True, color, 2)
    return output

@app.route("/ocr", methods=["POST"])
def ocr_endpoint():
    try:
        # Read raw bytes
        file_bytes = request.get_data()
        if not file_bytes:
            return jsonify({"status": "error", "error": "No file received"}), 400

        # Decode image
        np_arr = np.frombuffer(file_bytes, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if image is None:
            return jsonify({"status": "error", "error": "Invalid image format"}), 400

        # Preprocess
        processed = preprocess_image(image)

        # OCR
        results = ocr_image(processed)

        # If no text detected
        if not results:
            return jsonify({
                "status": "success",
                "extracted_text": "",
                "extracted_image": "",
                "confidence": 0.0,
                "word_count": 0,
                "character_count": 0,
                "num_detections": 0
            })

        # Extract text & confidence
        extracted_text = " ".join(r[1] for r in results)
        word_count = len(extracted_text.split())
        char_count = len(extracted_text)

        # Weighted confidence
        total_weight, weighted_sum = 0, 0
        for (box, text, conf) in results:
            weight = len(text.strip())
            weighted_sum += conf * weight
            total_weight += weight
        avg_conf = weighted_sum / total_weight if total_weight > 0 else 0.0

        # Annotated image
        annotated = draw_boxes(image, results)
        _, buffer = cv2.imencode(".png", annotated)
        img_base64 = base64.b64encode(buffer).decode("utf-8")

        return jsonify({
            "status": "success",
            "extracted_text": extracted_text,
            "extracted_image": img_base64,
            "confidence": avg_conf,
            "word_count": word_count,
            "character_count": char_count,
            "num_detections": len(results)
        })

    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
