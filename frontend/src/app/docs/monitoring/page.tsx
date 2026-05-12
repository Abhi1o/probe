export default function MonitoringDocs() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Monitoring & Infrastructure
        </h1>
        <p className="text-lg text-gray-600">
          Self-host your own monitoring stack or integrate Probe with Prometheus and Grafana.
        </p>
      </section>

      <section className="space-y-6 text-gray-600 leading-relaxed">
        <p>
          Probe provides built-in support for industry-standard monitoring tools. 
          If you prefer to maintain your own metrics infrastructure, you can use our 
          pre-configured Prometheus and Grafana setups.
        </p>

        <h2 className="text-2xl font-bold text-gray-900">Prometheus Integration</h2>
        <p>
          Probe exposes a <code className="rounded bg-gray-100 px-1 py-0.5 text-blue-600">/metrics</code> 
          endpoint that can be scraped by Prometheus. This includes system-level metrics 
          like database latency, indexer throughput, and API response times.
        </p>
        <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-200">
          {`# prometheus.yml snippet
scrape_configs:
  - job_name: 'probe-platform'
    static_configs:
      - targets: ['api.probe.sh:3000']`}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Grafana Dashboards</h2>
        <p>
          We provide a comprehensive Grafana dashboard template (`probe-overview.json`) 
          that visualizes the overall health of your Probe instance.
        </p>
        <ul className="list-inside list-disc space-y-2 mt-4">
          <li><strong>Indexer Health:</strong> Block processing speed and lag.</li>
          <li><strong>Resource Usage:</strong> CPU, Memory, and Disk I/O for the backend.</li>
          <li><strong>API Analytics:</strong> Request volume and error rates per endpoint.</li>
          <li><strong>Alerting Status:</strong> Active alerts and notification history.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Docker Compose</h2>
        <p>
          For local development or self-hosted production environments, use our 
          <code className="rounded bg-gray-100 px-1 py-0.5 text-blue-600">docker-compose.yml</code> 
          to spin up the entire stack including PostgreSQL, TimescaleDB, and the monitoring tools.
        </p>
      </section>
    </div>
  );
}
