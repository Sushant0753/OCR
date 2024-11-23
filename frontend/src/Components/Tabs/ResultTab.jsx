import React from 'react';
import Card from '../UI/Card';
import CardHeader from '../UI/CardHeader';
import CardContent from '../UI/CardContent';
import ResultCard from '../ResultCard';
import FileIcon from '../Icons/FileIcon';

const ResultTab = ({ results }) => (
  <Card className="mt-4">
    <CardHeader>
      <h2 className="text-xl font-semibold">Processing Results</h2>
      <p className="text-sm text-gray-500 mt-1">
        View and analyze processed documents
      </p>
    </CardHeader>
    <CardContent>
      {results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result, index) => (
            <ResultCard key={index} result={result} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileIcon className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Results Yet
          </h3>
          <p className="text-sm text-gray-500">
            Process some documents to see the results here
          </p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default ResultTab;
