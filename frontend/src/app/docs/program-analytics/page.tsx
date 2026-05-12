export default function ProgramAnalyticsDocs() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Program Analytics
        </h1>
        <p className="text-lg text-gray-600">
          Real-time monitoring of transaction volume, success rates, fees, and compute units for your Solana programs.
        </p>
      </section>

      <section className="space-y-6 text-gray-600 leading-relaxed">
        <p>
          Probe's core analytics engine provides high-level observability into your program's performance. 
          By indexing every transaction, we aggregate key metrics that help you monitor growth and detect issues early.
        </p>

        <h2 className="text-2xl font-bold text-gray-900">Key Metrics</h2>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-xl border p-5">
            <h3 className="font-bold text-gray-900">Transaction Volume</h3>
            <p className="text-sm mt-1">Track the number of transactions over time, categorized by Success, Failed, and Pending status.</p>
          </div>

          <div className="rounded-xl border p-5">
            <h3 className="font-bold text-gray-900">Success Rate</h3>
            <p className="text-sm mt-1">Monitor the percentage of successful transactions to identify regressions or network congestion issues.</p>
          </div>

          <div className="rounded-xl border p-5">
            <h3 className="font-bold text-gray-900">Compute Efficiency</h3>
            <p className="text-sm mt-1">Analyze average and peak Compute Unit (CU) consumption to optimize your program's performance.</p>
          </div>

          <div className="rounded-xl border p-5">
            <h3 className="font-bold text-gray-900">Economic Impact</h3>
            <p className="text-sm mt-1">Track total fees paid by users and average transaction costs (including priority fees).</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Time-Series Aggregates</h2>
        <p>
          Data is stored in <strong>TimescaleDB hypertables</strong>, allowing for efficient querying 
          at various resolutions:
        </p>
        <ul className="list-inside list-disc space-y-2 mt-4">
          <li><strong>Minute-level:</strong> For real-time monitoring and alerting.</li>
          <li><strong>Hourly:</strong> For dashboard visualizations and day-over-day comparisons.</li>
          <li><strong>Daily:</strong> For long-term trend analysis and growth reporting.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Network Support</h2>
        <p>
          Probe supports analytics on <strong>Mainnet-beta</strong>, <strong>Devnet</strong>, and <strong>Testnet</strong>. 
          You can easily switch between environments in your dashboard to compare performance across different networks.
        </p>
      </section>
    </div>
  );
}
