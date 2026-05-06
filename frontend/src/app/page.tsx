import Link from 'next/link';
import { ArrowRight, Activity, BarChart3, Bell, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">Probe</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Solana Program Observability
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Monitor, analyze, and optimize your Solana programs with real-time
          insights and powerful analytics
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Link
            href="/register"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
          >
            <span>Start Monitoring</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="border border-gray-300 px-8 py-3 rounded-lg hover:border-gray-400 transition"
          >
            View Demo
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need to monitor Solana programs
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Activity className="h-8 w-8 text-blue-600" />}
            title="Real-time Monitoring"
            description="Track transactions and program activity as they happen with sub-second latency"
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8 text-purple-600" />}
            title="Advanced Analytics"
            description="Gain insights with powerful metrics, trends, and performance analysis"
          />
          <FeatureCard
            icon={<Bell className="h-8 w-8 text-orange-600" />}
            title="Smart Alerts"
            description="Get notified instantly when critical events occur via email, Slack, or Discord"
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8 text-green-600" />}
            title="Production Ready"
            description="Built for scale with 99.9% uptime and enterprise-grade security"
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-blue-600 rounded-2xl p-12 text-white">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">&lt;1s</div>
              <div className="text-blue-100">Real-time Latency</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime SLA</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-blue-100">Transactions/Day</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Ready to monitor your Solana programs?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Get started in minutes with our easy setup
        </p>
        <Link
          href="/register"
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition inline-flex items-center space-x-2"
        >
          <span>Start Free Trial</span>
          <ArrowRight className="h-5 w-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2026 Probe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
