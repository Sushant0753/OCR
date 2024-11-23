import React from 'react';
import Card from './UI/Card';
import CardContent from './UI/CardContent';
import FormattedSummary from './FormattedSummary';

const ResultCard = ({ result }) => (
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
          <h4 className="font-medium mb-2">Extracted Text</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            {result.extractedText}
          </p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default ResultCard;
