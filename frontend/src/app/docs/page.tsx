import { BookOpen, Zap, Code2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
          Probe Documentation
        </h1>
        <p className="text-xl text-gray-600">
          The ultimate observability and analytics platform for Solana programs.
        </p>
      </section>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Link
          href="/docs/getting-started"
          className="group relative rounded-xl border p-6 transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="mb-2 font-bold text-gray-900">Quickstart</h3>
          <p className="text-sm text-gray-600">
            Get up and running with Probe in less than 5 minutes.
          </p>
        </Link>

        <Link
          href="/docs/sdk"
          className="group relative rounded-xl border p-6 transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <Code2 className="h-6 w-6" />
          </div>
          <h3 className="mb-2 font-bold text-gray-900">SDK Reference</h3>
          <p className="text-sm text-gray-600">
            Integrate Probe directly into your dApp using our TypeScript SDK.
          </p>
        </Link>

        <Link
          href="/docs/instructions"
          className="group relative rounded-xl border p-6 transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="mb-2 font-bold text-gray-900">Instruction Analytics</h3>
          <p className="text-sm text-gray-600">
            Learn how to decode instructions and track custom program metrics.
          </p>
        </Link>

        <Link
          href="/docs/mev"
          className="group relative rounded-xl border p-6 transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h3 className="mb-2 font-bold text-gray-900">MEV Protection</h3>
          <p className="text-sm text-gray-600">
            Detect and analyze MEV activities affecting your Solana programs.
          </p>
        </Link>
      </div>

      {/* Introduction Content */}
      <section className="prose prose-blue max-w-none">
        <h2 className="text-2xl font-bold text-gray-900">What is Probe?</h2>
        <p className="text-gray-600 leading-relaxed">
          Probe is a comprehensive observability platform designed specifically for the Solana ecosystem. 
          It provides developers with deep insights into their on-chain programs, enabling real-time monitoring, 
          detailed instruction analytics, health scoring, and threat detection.
        </p>
        <p className="text-gray-600 leading-relaxed mt-4">
          Whether you're building a DeFi protocol, an NFT marketplace, or a custom smart contract, 
          Probe helps you understand how your program is being used, identify performance bottlenecks, 
          and protect your users from malicious activities like MEV.
        </p>

        <h3 className="text-xl font-bold text-gray-900 mt-8">Core Capabilities</h3>
        <ul className="list-inside list-disc space-y-2 text-gray-600 mt-4">
          <li><strong>Program Monitoring:</strong> Real-time tracking of transaction volume, success rates, and fees.</li>
          <li><strong>Instruction Analytics:</strong> Deep-dive into specific program methods with IDL-based decoding.</li>
          <li><strong>Health Scoring:</strong> Automated grading of your program's performance and reliability.</li>
          <li><strong>CPI Mapping:</strong> Visualize cross-program invocations to see who is calling your program.</li>
          <li><strong>Wallet Intelligence:</strong> Classify and track users based on their on-chain behavior.</li>
          <li><strong>MEV Detection:</strong> Identify sandwich attacks, arbitrage, and other MEV events.</li>
        </ul>
      </section>
    </div>
  );
}
