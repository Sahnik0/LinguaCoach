import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';

const TestCorsProxy = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testDirectApi = async () => {
    setLoading(true);
    setError(null);
    try {
      // This will likely fail with CORS error
      const response = await fetch('https://backend.omnidim.io/api/v1/agents', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testProxyApi = async () => {
    setLoading(true);
    setError(null);
    try {
      // This should work as it uses our proxy
      const response = await fetch('/api/proxy/omnidimension?endpoint=agents', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>CORS Proxy Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Button onClick={testDirectApi} disabled={loading}>Test Direct API (Expect CORS Error)</Button>
            <Button onClick={testProxyApi} disabled={loading} variant="outline">Test Proxy API</Button>
          </div>
          
          {loading && <div className="text-sm">Loading...</div>}
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
              <p className="font-semibold">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {result && (
            <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
              <p className="font-semibold mb-2">Result:</p>
              <pre className="text-xs overflow-auto max-h-80">{result}</pre>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-sm text-gray-600">
        The proxy should work without CORS errors
      </CardFooter>
    </Card>
  );
};

export default TestCorsProxy;
