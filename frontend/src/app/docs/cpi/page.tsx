export default function CpiDocs() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          CPI Analysis
        </h1>
        <p className="text-lg text-gray-600">
          Visualize and monitor Cross-Program Invocations to understand your program's dependencies.
        </p>
      </section>

      <section className="space-y-6 text-gray-600 leading-relaxed">
        <p>
          On Solana, programs rarely live in isolation. <strong>Cross-Program Invocations (CPIs)</strong> allow 
          one program to call another. Probe tracks these interactions to provide a complete map of your 
          program's ecosystem.
        </p>

        <h2 className="text-2xl font-bold text-gray-900">Inbound vs Outbound CPIs</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="p-4 rounded-lg border">
            <h3 className="font-bold text-gray-900">Inbound</h3>
            <p className="text-sm">Identify which external programs are calling into your program. Great for identifying integrations and partners.</p>
          </div>
          <div className="p-4 rounded-lg border">
            <h3 className="font-bold text-gray-900">Outbound</h3>
            <p className="text-sm">Track which programs your program is calling (e.g., calling the Token Program for transfers or Orca for swaps).</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Mapping the Graph</h2>
        <p>
          Probe builds a <strong>dependency graph</strong> of all interactions. You can see:
        </p>
        <ul className="list-inside list-disc space-y-2 mt-4">
          <li><strong>Invocation Depth:</strong> How many levels deep a CPI call goes.</li>
          <li><strong>Success/Failure Propagation:</strong> See if a failure in a downstream program caused your transaction to revert.</li>
          <li><strong>Compute Unit Contribution:</strong> Understand which external program is consuming the most compute units in your transaction.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Use Cases</h2>
        <ul className="list-inside list-disc space-y-2">
          <li><strong>Integrator Monitoring:</strong> See who built on top of your protocol.</li>
          <li><strong>Security Auditing:</strong> Identify unexpected calls to malicious or unauthorized programs.</li>
          <li><strong>Optimization:</strong> Find bottlenecks in external calls that are costing your users extra fees.</li>
        </ul>
      </section>
    </div>
  );
}
