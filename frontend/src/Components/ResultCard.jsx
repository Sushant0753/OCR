import React from 'react';
import Card from './UI/Card';
import CardContent from './UI/CardContent';
import CardHeader from './UI/CardHeader';
import FormattedSummary from './FormattedSummary';

const ResultCard = ({ result }) => {
  console.log('Result data:', {
    fileName: result.fileName,
    hasProcessedImage: !!result.processedImage,
    imageLength: result.processedImage ? result.processedImage.length : 0
  });
  const imageSource = result.processedImage ? `data:image/png;base64,${result.processedImage}` : null;

  console.log('Image source:', imageSource ? 'Created successfully' : 'Not created');
  
  return (
    <Card className="border border-gray-200">
      <CardContent>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{result.fileName}</h3>
            <p className="text-sm text-gray-500">{result.documentType}</p>
          </div>
        </div>

        


        {result.summary && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Summary</h4>
            <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded border border-blue-100">
              <FormattedSummary 
                text={typeof result.summary === 'string' 
                  ? result.summary 
                  : result.summary.text || 'No summary available'} 
              />
            </div>
          </div>
        )}

        {result.extractedText && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Extracted Text by OCR</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {result.extractedText}
            </p>
          </div>
        )}


        {imageSource ? (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">OCR Boundary Boxes</h3>
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <img 
                src={imageSource} 
                alt="OCR Boundary Boxes"
                className="w-full h-auto max-h-full object-contain"
                onError={(e) => {
                  console.error('Image failed to load:', e);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-red-50 rounded">
            <p className="text-red-600">No processed image available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultCard;