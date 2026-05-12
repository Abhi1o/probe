export default function Changelog() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Changelog
        </h1>
        <p className="text-lg text-gray-600">
          Stay up to date with the latest features, improvements, and bug fixes.
        </p>
      </section>

      <section className="space-y-8">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">v1.2.0</span>
            <span className="text-sm text-gray-500">May 11, 2026</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Real-time Documentation & Monitoring</h2>
          <ul className="list-inside list-disc space-y-1 text-gray-600">
            <li>Introduced a comprehensive documentation portal within the dashboard.</li>
            <li>Added detailed guides for MEV Detection, Health Scoring, and CPI Analysis.</li>
            <li>Added self-hosted monitoring documentation for Prometheus and Grafana.</li>
            <li>Added <code className="text-blue-600">llms.txt</code> for improved AI discoverability.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">v1.1.0</span>
            <span className="text-sm text-gray-500">May 01, 2026</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">MEV Engine Alpha</h2>
          <ul className="list-inside list-disc space-y-1 text-gray-600">
            <li>Launched the first version of the MEV detection engine.</li>
            <li>Support for Sandwich Attack and Frontrunning detection.</li>
            <li>Improved indexing speed for high-volume programs.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">v1.0.0</span>
            <span className="text-sm text-gray-500">April 15, 2026</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Initial Launch</h2>
          <ul className="list-inside list-disc space-y-1 text-gray-600">
            <li>Core program monitoring and transaction indexing.</li>
            <li>Instruction decoding using Anchor IDLs.</li>
            <li>TypeScript SDK and CLI tool release.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
