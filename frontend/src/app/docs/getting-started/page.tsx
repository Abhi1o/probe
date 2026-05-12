export default function GettingStarted() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Getting Started with Probe
        </h1>
        <p className="text-lg text-gray-600">
          Set up your account and start monitoring your Solana programs in minutes.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">1. Create an Account</h2>
        <p className="text-gray-600">
          Sign up at <code className="rounded bg-gray-100 px-1.5 py-0.5 text-blue-600">app.probe.sh</code> to get access to your dashboard. 
          Once logged in, you'll be able to create your first organization and project.
        </p>

        <h2 className="text-2xl font-bold text-gray-900">2. Generate an API Key</h2>
        <p className="text-gray-600">
          Navigate to <strong>Settings &gt; API Keys</strong> to generate your unique access key. 
          This key is required to authenticate requests to the Probe API and to initialize the SDK.
        </p>
        <div className="rounded-lg border bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-900">Pro Tip:</p>
          <p className="text-sm text-gray-600">
            Keep your API key secure. Never expose it in client-side code or commit it to public repositories.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-gray-900">3. Register Your Program</h2>
        <p className="text-gray-600">
          Go to the <strong>Programs</strong> tab and click <strong>Add Program</strong>. 
          Enter your Solana program's public key (Address) and select the network (Mainnet or Devnet).
        </p>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload IDL (Optional but Recommended)</h3>
          <p className="text-gray-600">
            To enable deep instruction analytics, upload your program's IDL (JSON format). 
            Probe supports Anchor IDLs natively, allowing us to decode instruction names, arguments, and events.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-gray-900">4. Start Monitoring</h2>
        <p className="text-gray-600">
          Once registered, Probe will immediately start indexing transactions for your program. 
          You can view real-time activity in the <strong>Dashboard</strong> or set up custom alerts 
          in the <strong>Alerts</strong> section.
        </p>

        <h2 className="text-2xl font-bold text-gray-900">Next Steps</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4 hover:border-blue-500 transition-colors cursor-pointer">
            <h4 className="font-bold text-gray-900">Install the SDK</h4>
            <p className="text-sm text-gray-600 mt-1">Add Probe to your TypeScript project.</p>
          </div>
          <div className="rounded-lg border p-4 hover:border-blue-500 transition-colors cursor-pointer">
            <h4 className="font-bold text-gray-900">Explore the API</h4>
            <p className="text-sm text-gray-600 mt-1">Learn how to query data programmatically.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
