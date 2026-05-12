export default function InstructionDocs() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Instruction Deep-Dive
        </h1>
        <p className="text-lg text-gray-600">
          Analyze individual program methods with decoded arguments, performance metrics, and error tracking.
        </p>
      </section>

      <section className="space-y-6 text-gray-600 leading-relaxed">
        <p>
          Generic block explorers show you raw transaction data. Probe goes deeper by 
          <strong>decoding every instruction</strong> within a transaction using your program's IDL. 
          This allows you to see exactly which methods are being called and with what parameters.
        </p>

        <h2 className="text-2xl font-bold text-gray-900">IDL Support</h2>
        <p>
          Probe natively supports <strong>Anchor IDLs</strong>. When you upload your IDL JSON file, 
          we automatically map the 8-byte discriminators to human-readable names like 
          <code className="rounded bg-gray-100 px-1 py-0.5 text-blue-600">initialize</code>, 
          <code className="rounded bg-gray-100 px-1 py-0.5 text-blue-600">swap</code>, or 
          <code className="rounded bg-gray-100 px-1 py-0.5 text-blue-600">mint</code>.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Per-Instruction Metrics</h2>
        <p>For every instruction type, Probe tracks:</p>
        <ul className="list-inside list-disc space-y-2 mt-4">
          <li><strong>Call Count:</strong> How many times this specific method was invoked.</li>
          <li><strong>Success Rate:</strong> The percentage of successful calls for this method.</li>
          <li><strong>Compute Units:</strong> Average, P50, and P95 compute consumption.</li>
          <li><strong>Unique Callers:</strong> The number of distinct wallets interacting with this method.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Error Analysis</h2>
        <p>
          When an instruction fails, Probe decodes the error code using the IDL. 
          Instead of seeing <code className="text-red-500">0x1770</code>, you'll see 
          <span className="font-bold text-red-600">InsufficentFunds</span>. 
          We also categorize errors into:
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">Business Logic</span>
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">Access Control</span>
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">Validation</span>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">Math/Overflow</span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">External CPI</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Historical Aggregation</h2>
        <p>
          Probe aggregates instruction data hourly, allowing you to see trends over time. 
          You can identify if a specific version of your program started causing more failures 
          or if certain methods are becoming more expensive to execute.
        </p>
      </section>
    </div>
  );
}
