export default function MevDocs() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          MEV Detection
        </h1>
        <p className="text-lg text-gray-600">
          Protect your program and its users from malicious Maximal Extractable Value (MEV) activities.
        </p>
      </section>

      <section className="space-y-6 text-gray-600 leading-relaxed">
        <p>
          On Solana, MEV can take many forms, from simple arbitrage to complex sandwich attacks. 
          Probe's MEV detection engine monitors your program's transactions in real-time to identify 
          and alert you to these events.
        </p>

        <h2 className="text-2xl font-bold text-gray-900">Supported MEV Types</h2>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-xl border p-5 space-y-2">
            <h3 className="font-bold text-gray-900 flex items-center">
              <span className="mr-2 h-2 w-2 rounded-full bg-red-500"></span>
              Sandwich Attacks
            </h3>
            <p className="text-sm">
              Detected when a victim transaction is "sandwiched" between an attacker's buy and sell orders 
              to exploit slippage.
            </p>
          </div>

          <div className="rounded-xl border p-5 space-y-2">
            <h3 className="font-bold text-gray-900 flex items-center">
              <span className="mr-2 h-2 w-2 rounded-full bg-yellow-500"></span>
              Arbitrage
            </h3>
            <p className="text-sm">
              Monitoring for atomic trades across multiple DEXs involving your program's liquidity pools.
            </p>
          </div>

          <div className="rounded-xl border p-5 space-y-2">
            <h3 className="font-bold text-gray-900 flex items-center">
              <span className="mr-2 h-2 w-2 rounded-full bg-blue-500"></span>
              JIT Liquidity
            </h3>
            <p className="text-sm">
              Detection of "Just-In-Time" liquidity provision and removal to capture fees from specific trades.
            </p>
          </div>

          <div className="rounded-xl border p-5 space-y-2">
            <h3 className="font-bold text-gray-900 flex items-center">
              <span className="mr-2 h-2 w-2 rounded-full bg-purple-500"></span>
              Frontrunning
            </h3>
            <p className="text-sm">
              Identifying transactions that intentionally pre-empt others by paying higher priority fees.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">How It Works</h2>
        <p>
          Probe analyzes the <strong>transaction flow</strong> and <strong>log sequences</strong> within blocks. 
          By looking at the relationship between multiple signatures, we can reconstruct the intent behind 
          the transactions and identify the attacker and the victim.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Integration</h2>
        <p>
          You don't need to change your program's code to enable MEV detection. 
          Once your program is registered in Probe, our engine automatically begins monitoring 
          for these patterns. You can view detected events in the <strong>MEV</strong> tab 
          or receive real-time alerts via Webhooks.
        </p>
      </section>
    </div>
  );
}
