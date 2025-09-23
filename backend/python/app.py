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
    app.run(host='0.0.0.0', port=port)
