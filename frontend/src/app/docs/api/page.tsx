export default function ApiDocs() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          REST API Reference
        </h1>
        <p className="text-lg text-gray-600">
          The Probe REST API allows you to programmatically access your program's data and manage your resources.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Base URL</h2>
        <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-200">
          https://api.probe.sh/api/v1
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Authentication</h2>
        <p className="text-gray-600">
          All requests must include your API key in the <code className="rounded bg-gray-100 px-1 py-0.5 text-pink-600">X-API-Key</code> header.
        </p>
        <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-200">
          {`GET /programs HTTP/1.1
Host: api.probe.sh
X-API-Key: your_api_key_here`}
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Endpoints</h2>
        
        <div className="space-y-6 border-l-2 border-blue-100 pl-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 uppercase tracking-wide">GET</span>
              <code className="text-sm font-bold text-gray-900">/programs</code>
            </div>
            <p className="text-sm text-gray-600">List all programs registered in your organization.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 uppercase tracking-wide">POST</span>
              <code className="text-sm font-bold text-gray-900">/programs</code>
            </div>
            <p className="text-sm text-gray-600">Register a new program for monitoring.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 uppercase tracking-wide">GET</span>
              <code className="text-sm font-bold text-gray-900">/analytics/program/:id</code>
            </div>
            <p className="text-sm text-gray-600">Retrieve historical metrics for a specific program.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 uppercase tracking-wide">GET</span>
              <code className="text-sm font-bold text-gray-900">/transactions/program/:id</code>
            </div>
            <p className="text-sm text-gray-600">Fetch a list of recent transactions for a program.</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Error Handling</h2>
        <p className="text-gray-600">
          Probe uses standard HTTP response codes to indicate the success or failure of an API request.
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
          <li><strong>200 OK:</strong> Request succeeded.</li>
          <li><strong>400 Bad Request:</strong> Invalid parameters.</li>
          <li><strong>401 Unauthorized:</strong> Missing or invalid API key.</li>
          <li><strong>404 Not Found:</strong> Resource not found.</li>
          <li><strong>500 Internal Server Error:</strong> Something went wrong on our end.</li>
        </ul>
      </section>
    </div>
  );
}
