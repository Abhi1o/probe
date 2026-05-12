export default function WalletDocs() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Wallet Intelligence
        </h1>
        <p className="text-lg text-gray-600">
          Identify and classify your users based on their on-chain behavior and historical activity.
        </p>
      </section>

      <section className="space-y-6 text-gray-600 leading-relaxed">
        <p>
          Probe automatically profiles every wallet that interacts with your program. 
          By analyzing transaction history, frequency, and financial volume, we categorize 
          wallets into distinct types to help you understand your audience.
        </p>

        <h2 className="text-2xl font-bold text-gray-900">Wallet Classifications</h2>
        
        <div className="space-y-4">
          <div className="rounded-lg border p-4 bg-gray-50">
            <h3 className="font-bold text-gray-900">Bots</h3>
            <p className="text-sm">High-frequency traders or automation scripts characterized by sub-second response times and repetitive patterns.</p>
          </div>

          <div className="rounded-lg border p-4 bg-gray-50">
            <h3 className="font-bold text-gray-900">Whales</h3>
            <p className="text-sm">Wallets holding significant amounts of SOL or specific project tokens, whose transactions have high financial impact.</p>
          </div>

          <div className="rounded-lg border p-4 bg-gray-50">
            <h3 className="font-bold text-gray-900">Smart Money</h3>
            <p className="text-sm">Addresses with high historical profitability or those that consistently move before large market shifts.</p>
          </div>

          <div className="rounded-lg border p-4 bg-gray-50">
            <h3 className="font-bold text-gray-900">Retail Users</h3>
            <p className="text-sm">Standard users with lower transaction volume and manual interaction patterns.</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Behavioral Stats</h2>
        <p>For every wallet profile, Probe maintains:</p>
        <ul className="list-inside list-disc space-y-2 mt-4">
          <li><strong>Total Transactions:</strong> Lifetime count across all monitored programs.</li>
          <li><strong>Success Rate:</strong> Historical reliability of the wallet's transactions.</li>
          <li><strong>Last Seen:</strong> The most recent activity detected on-chain.</li>
          <li><strong>Program Affinity:</strong> Which other programs this user frequently interacts with.</li>
        </ul>
      </section>
    </div>
  );
}
