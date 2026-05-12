export default function HealthDocs() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Program Health Scores
        </h1>
        <p className="text-lg text-gray-600">
          Understand your program's performance and reliability at a glance with automated grading.
        </p>
      </section>

      <section className="space-y-6 text-gray-600 leading-relaxed">
        <p>
          Probe assigns a dynamic <strong>Health Score</strong> (from 0 to 100) and a letter grade (A+ to F) 
          to every monitored program. These scores are updated every 5 minutes based on live on-chain metrics.
        </p>

        <h2 className="text-2xl font-bold text-gray-900">Scoring Components</h2>
        <p>Your overall health score is composed of five key metrics, each weighted to provide a balanced view:</p>

        <div className="space-y-4 mt-4">
          <div className="flex items-start space-x-4 border-l-4 border-green-500 pl-4">
            <div>
              <h3 className="font-bold text-gray-900">Reliability (30%)</h3>
              <p className="text-sm">Based on the 24-hour transaction success rate. High failure rates significantly impact this score.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4 border-l-4 border-blue-500 pl-4">
            <div>
              <h3 className="font-bold text-gray-900">Performance (25%)</h3>
              <p className="text-sm">Analyzes compute unit usage versus the requested budget. Efficient programs score higher.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4 border-l-4 border-purple-500 pl-4">
            <div>
              <h3 className="font-bold text-gray-900">Activity (20%)</h3>
              <p className="text-sm">Measures transaction volume trends and consistency. Sudden drops in activity may trigger warnings.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4 border-l-4 border-yellow-500 pl-4">
            <div>
              <h3 className="font-bold text-gray-900">Error Diversity (15%)</h3>
              <p className="text-sm">Evaluates the types of errors occurring. A wide variety of new errors often indicates a bug or state issue.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4 border-l-4 border-pink-500 pl-4">
            <div>
              <h3 className="font-bold text-gray-900">User Retention (10%)</h3>
              <p className="text-sm">Tracks unique users and their return frequency, indicating the actual utility of the program.</p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">AI-Generated Insights</h2>
        <p>
          Probe doesn't just give you a number. Our AI analysis engine generates human-readable 
          strengths, warnings, and recommendations based on your score. 
          For example: 
          <em className="block bg-gray-50 p-3 rounded mt-2 border-l-2 border-blue-400">
            "Warning: Error rate increased by 15% today. Most failures are related to 'SlippageExceeded' instructions. 
            Consider optimizing your front-end slippage calculations."
          </em>
        </p>
      </section>
    </div>
  );
}
