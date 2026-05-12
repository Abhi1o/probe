export default function SdkDocs() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          TypeScript SDK
        </h1>
        <p className="text-lg text-gray-600">
          Interact with the Probe Platform programmatically using our official TypeScript SDK.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Installation</h2>
        <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-200">
          npm install @probe-sh/sdk
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Initialization</h2>
        <p className="text-gray-600">
          To get started, initialize the <code className="rounded bg-gray-100 px-1 py-0.5 text-pink-600">ProbeClient</code> with your API key.
        </p>
        <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-200">
          {`import { ProbeClient } from '@probe-sh/sdk';

const probe = new ProbeClient({
  apiKey: 'your_api_key_here',
  apiUrl: 'https://api.probe.sh' // Optional
});`}
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Common Tasks</h2>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Fetch Program Analytics</h3>
          <p className="text-gray-600">Retrieve aggregated metrics for a specific program.</p>
          <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-200">
            {`const metrics = await probe.getAnalytics('PROGRAM_ID', {
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  interval: '1d'
});

console.log('Daily Transaction Count:', metrics[0].txCount);`}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">List Recent Transactions</h3>
          <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-200">
            {`const transactions = await probe.getTransactions('PROGRAM_ID', {
  limit: 10,
  status: 'SUCCESS'
});

transactions.forEach(tx => {
  console.log(\`Signature: \${tx.signature} | Fee: \${tx.fee}\`);
});`}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Manage Alerts</h3>
          <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-200">
            {`const alert = await probe.createAlert({
  programId: 'PROGRAM_ID',
  name: 'High Failure Rate',
  condition: 'TRANSACTION_FAILURE_RATE',
  threshold: 0.05, // 5%
  comparison: 'GREATER_THAN',
  channels: ['EMAIL', 'WEBHOOK']
});`}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Real-time Subscriptions</h2>
        <p className="text-gray-600">
          Use the <code className="rounded bg-gray-100 px-1 py-0.5 text-pink-600">ProbeMonitor</code> to subscribe to real-time events via WebSockets.
        </p>
        <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-200">
          {`import { ProbeMonitor } from '@probe-sh/sdk';

const monitor = new ProbeMonitor({
  apiKey: 'your_api_key_here'
});

monitor.onTransaction('PROGRAM_ID', (tx) => {
  console.log('New Transaction Detected:', tx.signature);
});

monitor.onAlert((alert) => {
  console.warn('Alert Triggered!', alert.message);
});`}
        </div>
      </section>
    </div>
  );
}
