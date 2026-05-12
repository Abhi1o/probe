export default function CliDocs() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Probe CLI
        </h1>
        <p className="text-lg text-gray-600">
          The command-line interface for Probe. Manage programs, view analytics, and deploy with instrumentation.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Installation</h2>
        <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-200">
          npm install -g @probe-sh/cli
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Authentication</h2>
        <p className="text-gray-600">
          Log in to your Probe account to authenticate the CLI.
        </p>
        <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-200">
          probe auth login
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Program Management</h2>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">List Registered Programs</h3>
          <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-200">
            probe programs list
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Register a New Program</h3>
          <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-200">
            probe programs add [PROGRAM_ID] --name "My Program" --network mainnet
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Analytics & Transactions</h2>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">View Program Stats</h3>
          <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-200">
            probe analytics stats [PROGRAM_ID] --duration 24h
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Tail Transactions</h3>
          <p className="text-gray-600">Stream transactions for a program in real-time.</p>
          <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-200">
            probe transactions watch [PROGRAM_ID]
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Instrumentation & Deployment</h2>
        <p className="text-gray-600">
          Deploy your program with Probe's instrumentation automatically enabled.
        </p>
        <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-200">
          probe deploy --program-path ./target/deploy/my_program.so
        </div>
      </section>
    </div>
  );
}
