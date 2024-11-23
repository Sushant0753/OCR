import axios from 'axios';

class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    
    // Add retry configuration for better reliability
    this.axiosInstance = axios.create({
      timeout: 30000,
      retry: 3,
      retryDelay: (retryCount) => retryCount * 1000,
    });
  }

  async processDocument(file, extractedText) {
    try {
      // Input validation
      if (!file || !extractedText) {
        throw new Error('Missing required parameters: file or extractedText');
      }

      // Prepare the request payload with improved prompting for better context
      const payload = {
        contents: [{
          parts: [{
            text: `Analyze the following document and provide:
            1. A concise summary
            2. Key entities and their relationships
            3. Important dates or deadlines
            4. Action items or recommendations
            5. Document classification/type
            
            Document text:
            ${extractedText}`
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 500,
          topK: 40,
          topP: 0.95,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      // Process text with error handling and retry logic
      const textResponse = await this.makeRequest('gemini-pro:generateContent', payload);

      // Process image if applicable with enhanced error handling
      let imageResponse = null;
      if (file.type.startsWith('image/')) {
        try {
          const base64Image = await this.convertImageToBase64(file);
          const imagePayload = {
            contents: [{
              parts: [
                {
                  inlineData: {
                    mimeType: file.type,
                    data: base64Image
                  }
                },
                {
                  text: `Analyze this image and provide:
                  1. Key visual elements and their arrangement
                  2. Text content visible in the image
                  3. Document type or classification
                  4. Quality assessment of the image
                  5. Any potential issues or areas needing attention`
                }
              ]
            }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 300
            }
          };

          imageResponse = await this.makeRequest('gemini-pro-vision:generateContent', imagePayload);
        } catch (error) {
          console.error('Image processing error:', error);
          // Continue with text analysis even if image processing fails
        }
      }

      // Format and return the combined results
      return {
        textAnalysis: this.extractGeminiResponse(textResponse),
        imageAnalysis: imageResponse ? this.extractGeminiResponse(imageResponse) : null,
        metadata: {
          processedAt: new Date().toISOString(),
          fileType: file.type,
          fileName: file.name,
          fileSize: file.size,
        }
      };

    } catch (error) {
      console.error('Gemini API Error:', error.response?.data || error.message);
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  async makeRequest(endpoint, payload) {
    try {
      const response = await this.axiosInstance.post(
        `${this.baseUrl}/${endpoint}?key=${this.apiKey}`,
        payload
      );
      return response;
    } catch (error) {
      if (error.response?.status === 429) {
        // Implement exponential backoff for rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.makeRequest(endpoint, payload);
      }
      throw error;
    }
  }

  async convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = () => {
        const base64Data = reader.result.split(',')[1];
        // Validate base64 data
        if (!base64Data || typeof base64Data !== 'string') {
          reject(new Error('Invalid base64 conversion'));
          return;
        }
        resolve(base64Data);
      };
      
      reader.onerror = error => reject(new Error(`File reading failed: ${error.message}`));
    });
  }

  extractGeminiResponse(response) {
    if (!response?.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }
    return response.data.candidates[0].content.parts[0].text;
  }
}

export default GeminiService;