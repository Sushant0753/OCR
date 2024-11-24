import sys
import json
import cv2
import numpy as np
import easyocr
import base64
import os
import logging
from PIL import Image
import io

# Configure logging with more detail
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self):
        try:
            # Suppress stdout during model download
            old_stdout = sys.stdout
            sys.stdout = open(os.devnull, 'w')
            
            # Initialize EasyOCR with English language
            self.reader = easyocr.Reader(
                ['en'],
                gpu=False,
                download_enabled=True,
                verbose=False
            )
            
            # Restore stdout
            sys.stdout = old_stdout
            logger.info("EasyOCR initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing EasyOCR: {str(e)}")
            raise

    def check_image_quality(self, image):
        """
        Check if the image is too blurry using the Laplacian variance method.
        Returns a tuple of (is_acceptable, message)
        """
        try:
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image
                
            blur_metric = cv2.Laplacian(gray, cv2.CV_64F).var()
            logger.info(f"Blur metric: {blur_metric}")
            
            if blur_metric < 100:
                message = "Image is blurry; consider re-uploading."
                is_acceptable = False
            else:
                message = "Image quality is acceptable."
                is_acceptable = True
                
            return is_acceptable, message
            
        except Exception as e:
            logger.error(f"Error checking image quality: {str(e)}")
            return False, f"Error checking image quality: {str(e)}"

    def preprocess_image(self, image):
        try:
            logger.info(f"Preprocessing image with shape: {image.shape}")
            
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image

            denoised = cv2.bilateralFilter(gray, 9, 75, 75)

            # Use Otsu's thresholding instead of adaptive threshold
            #_, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))  # 5x5 rectangular kernel
            dilated_image = cv2.dilate(denoised, kernel,iterations=1)
            eroded_image = cv2.erode(dilated_image, kernel,iterations=1)


            thresh=cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,cv2.THRESH_BINARY,199,5)

            logger.info("Image preprocessing completed successfully")
            return thresh
        except Exception as e:
            logger.error(f"Error in image preprocessing: {str(e)}")
            raise

    def draw_boxes(self, image, detections):
        try:
            output = image.copy()
            for detection in detections:
                points = detection[0]
                text = detection[1]
                confidence = detection[2] if len(detection) > 2 else 0.0
                
                points = np.array(points).astype(np.int32)
                
                # Color based on confidence: green for high confidence, red for low
                color = (0, int(255 * confidence), 0)  # RGB color based on confidence
                
                cv2.polylines(
                    output,
                    [points],
                    isClosed=True,
                    color=color,
                    thickness=2
                )
            logger.info(f"Drew {len(detections)} bounding boxes")
            return output
        except Exception as e:
            logger.error(f"Error drawing boxes: {str(e)}")
            raise

    def calculate_confidence(self, results):
        """
        Calculate overall confidence score from OCR results with improved handling
        """
        if not results:
            logger.warning("No results to calculate confidence from")
            return 0.0
        
        try:
            logger.info(f"Processing {len(results)} results for confidence calculation")
            

            confidence_scores = []
            for idx, detection in enumerate(results):
                try:
                    if len(detection) >= 3:
                        confidence = float(detection[2])
                        # Normalizing confidence to 0-1 range if needed
                        confidence = max(0.0, min(1.0, confidence))
                        confidence_scores.append(confidence)
                        logger.debug(f"Detection {idx}: Confidence = {confidence}")
                    else:
                        logger.warning(f"Detection {idx} missing confidence score")
                except (IndexError, ValueError, TypeError) as e:
                    logger.warning(f"Error processing confidence for detection {idx}: {str(e)}")
                    continue
            
            if not confidence_scores:
                logger.warning("No valid confidence scores found")
                return 0.0
            
            # Calculate weighted average confidence
            # Give more weight to longer text detections
            total_weight = 0
            weighted_sum = 0
            
            for detection, confidence in zip(results, confidence_scores):
                text = detection[1]
                weight = len(text.strip())  # Weight by text length
                weighted_sum += confidence * weight
                total_weight += weight
            
            if total_weight == 0:
                logger.warning("No valid text found for confidence calculation")
                return 0.0
                
            final_confidence = weighted_sum / total_weight
            logger.info(f"Final calculated confidence: {final_confidence:.4f}")
            
            return final_confidence
            
        except Exception as e:
            logger.error(f"Error calculating confidence: {str(e)}")
            return 0.0

    def process_document(self, file_path):
        try:
            logger.info(f"Processing document: {file_path}")
            
            # Read image
            image = cv2.imread(file_path)
            if image is None:
                raise ValueError(f"Unable to read image file: {file_path}")

            # Check image quality first
            is_acceptable, quality_message = self.check_image_quality(image)
            logger.info(f"Image quality check: {quality_message}")

            # Get image dimensions
            height, width = image.shape[:2]
            logger.info(f"Original image dimensions: {width}x{height}")
            
            # Check if image is too large and resize if necessary
            max_dimension = 2000
            if height > max_dimension or width > max_dimension:
                scale = max_dimension / max(height, width)
                image = cv2.resize(image, None, fx=scale, fy=scale)
                logger.info(f"Resized image to scale: {scale}")

            # Preprocess image
            processed_image = self.preprocess_image(image)
            
            # Perform OCR with confidence logging
            logger.info("Starting OCR processing")
            results = self.reader.readtext(processed_image)
            logger.info(f"OCR completed. Found {len(results)} text regions")
            
            # Log detected text regions
            for idx, detection in enumerate(results):
                text = detection[1]
                conf = detection[2] if len(detection) > 2 else 'N/A'
                logger.info(f"Region {idx}: Text='{text}', Confidence={conf}")
            
            # Calculate confidence score
            confidence = self.calculate_confidence(results)
            
            if not results:
                logger.warning("No text detected in the image")
                return {
                    'status': 'success',
                    'extracted_text': '',
                    'extracted_image': '',
                    'confidence': 0.0,
                    'word_count': 0,
                    'character_count': 0,
                    'quality_check': quality_message
                }

            # Extract text
            extracted_text = ' '.join(detection[1] for detection in results)
            
            # Draw bounding boxes
            annotated_image = self.draw_boxes(image, results)
            
            # Convert annotated image to base64
            success, buffer = cv2.imencode('.png', annotated_image)
            if not success:
                raise ValueError("Failed to encode image")
            
            image_base64 = base64.b64encode(buffer).decode('utf-8')
            
            response = {
                'status': 'success',
                'extracted_text': extracted_text,
                'extracted_image': image_base64,
                'confidence': confidence,
                'word_count': len(extracted_text.split()),
                'character_count': len(extracted_text),
                'num_detections': len(results),
                'quality_check': quality_message
            }
            
            logger.info(f"Processing completed successfully. Confidence: {confidence:.4f}")
            return response
            
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            return {
                'status': 'error',
                'error': str(e),
                'confidence': 0.0,
                'quality_check': 'Error during quality check'
            }

def main():
    try:
        if len(sys.argv) != 2:
            raise ValueError("Please provide a file path")

        file_path = sys.argv[1]
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        processor = DocumentProcessor()
        result = processor.process_document(file_path)
        
        # Ensure encoding is handled properly
        print(json.dumps(result, ensure_ascii=False).encode('utf-8').decode())
        
    except Exception as e:
        error_result = {
            'status': 'error',
            'error': str(e),
            'confidence': 0.0,
            'quality_check': 'Error during quality check'
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()