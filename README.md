# **Enhanced Document Processing System**  

![Project Demo](https://ocr-iota-one.vercel.app/)  

## **Table of Contents**  
- [Overview](#overview)  
- [Features](#features)  
- [Technologies Used](#technologies-used)  
- [System Architecture](#system-architecture)  
- [Installation](#installation)  
- [Usage](#usage)  
- [Contributing](#contributing)  
- [License](#license)  

---

## **Overview**  
This project integrates Optical Character Recognition (OCR) with advanced text summarization to provide a seamless document processing solution. With features like image quality feedback, standard output formatting, and an interactive chatbot, the system simplifies text extraction and summarization from diverse document formats.

---

## **Features**  
- **Accurate OCR with EasyOCR:** Extracts text from images and scanned documents in multiple languages.  
- **Advanced Summarization with Gemini API:** Converts extracted text into concise, meaningful summaries.  
- **Image Quality Feedback:** Notifies users of blurry or low-quality images for re-upload.  
- **Standardized Output Formatting:** Provides consistent, user-friendly document outputs.  
- **Interactive Chatbot:** Assists users in navigating the system and resolving common issues.  
- **Data Privacy and Security:** Ensures secure handling of sensitive documents.  

---

## **Technologies Used**  
- **Back-End:**  
  - Python
  - NodeJS
  - ExpressJS
  - EasyOCR  
  - Gemini API  
  - OpenCV  

- **Front-End:**  
  - HTML/CSS/JavaScript
  - ReactJS+Vite 

- **Frameworks and Tools:**  
  - Tailwind CSS    

---

## **System Architecture**  
1. **Input:** Users upload images or scanned documents.  
2. **Preprocessing:** Images are analyzed and enhanced for quality.  
3. **OCR Module:** Text is extracted using EasyOCR.  
4. **Summarization Module:** Extracted text is summarized using the Gemini API.  
5. **Output:** Results are delivered in standardized formats.  
6. **Chatbot Integration:** Provides user guidance and support.  

---

## **Installation**  
### **Prerequisites**  
- Python 3.8 or higher  
- Flask  
- EasyOCR (`pip install easyocr`)  
- OpenCV (`pip install opencv-python`)  
- Botpress (optional for chatbot)  

### **Steps**  
1. Clone the repository:  
   ```bash  
   git clone https://github.com/your-username/document-processing-system.git  
   cd document-processing-system  
   ```  
2. Install dependencies:  
   ```bash  
   pip install -r requirements.txt  
   ```  
3. Set up the Gemini API:  
   - Obtain an API key from [Gemini API](https://gemini.api.com).  
   - Add the key to your environment variables or configuration file.  

4. Run the application:  
   ```bash  
   python app.py  
   ```  

5. Access the application at `http://localhost:5000`.  

---

## **Usage**  
1. Launch the application and upload your document.  
2. View extracted text and summaries on the results page.  
3. Use the chatbot for assistance with any issues or questions.  
4. Download processed results in standardized formats.  

---

## **Contributing**  
Contributions are welcome! To contribute:  
1. Fork the repository.  
2. Create a feature branch:  
   ```bash  
   git checkout -b feature-name  
   ```  
3. Commit your changes:  
   ```bash  
   git commit -m "Add new feature"  
   ```  
4. Push to the branch:  
   ```bash  
   git push origin feature-name  
   ```  
5. Submit a pull request.  

---

## **License**  
This project is licensed under the [MIT License](LICENSE).  

---

Feel free to enhance or customize this README further for your GitHub repository!
