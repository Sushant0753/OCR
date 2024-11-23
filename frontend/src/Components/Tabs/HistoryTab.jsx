import React from 'react';
import Card from '../UI/Card';
import CardHeader from '../UI/CardHeader';
import CardContent from '../UI/CardContent';

const HistoryTab = () => (
  <Card className="mt-4">
    <CardHeader>
      <h2 className="text-xl font-semibold">Processing History</h2>
      <p className="text-sm text-gray-500 mt-1">
        View past document processing activities
      </p>
    </CardHeader>
    <CardContent>
      <div className="text-center py-12 text-gray-500">
        No processing history available
      </div>
    </CardContent>
  </Card>
);

export default HistoryTab;