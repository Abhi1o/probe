import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BellRing,
  Blocks,
  Cable,
  Cpu,
  ChevronRight,
  Eye,
  Gauge,
  HeartPulse,
  LineChart,
  PieChart,
  Radar,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Zap,
  Terminal,
  Code2,
  Lock,
  Globe,
  ArrowUpRight,
} from 'lucide-react';

const statChips = [
  { label: 'Latency', value: 'Sub-second indexing' },
  { label: 'Coverage', value: 'Any Anchor program' },
  { label: 'Intelligence', value: 'AI-powered anomaly' },
];

const featureBento = [
  {
    icon: Radar,
    title: 'Visual CPI Maps',
    body: 'Decode the complex interactions between programs with real-time dependency graphs.',
    style: 'lg:col-span-2',
  },
  {
    icon: Zap,
    title: 'Live Streaming',
    body: 'Socket.io powered transaction feeds with zero-latency delivery.',
    style: '',
  },
  {
    icon: ShieldCheck,
    title: 'Security First',
    body: 'Built-in signer bypass detection and flash loan pattern recognition.',
    style: '',
  },
  {
    icon: BarChart3,
    title: 'Economic Analytics',
    body: 'Track Real Economic Value (REV), user churn, and compute efficiency at scale.',
    style: 'lg:col-span-2',
  },
];

const highImpactFeatures = [
  {
    icon: Activity,
    title: 'Transaction Stream',
    cadence: 'Real-time',
    text: 'A high-fidelity feed of every instruction landing on-chain, decoded instantly.',
    tags: ['Live Feed', 'Decoded'],
    accent: 'from-[#14f195]/20 to-transparent',
  },
  {
    icon: Cable,
    title: 'CPI Analysis',
    cadence: 'Interactive',
    text: 'Visualize how your program interacts with the broader Solana ecosystem.',
    tags: ['Graph', 'Risk'],
    accent: 'from-[#00c2ff]/20 to-transparent',
  },
  {
    icon: ShieldCheck,
    title: 'Security Shield',
    cadence: 'Active',
    text: 'Detect signer bypass attempts and malicious patterns in the same block.',
    tags: ['Anomaly', 'Audit'],
    accent: 'from-[#9945ff]/20 to-transparent',
  },
  {
    icon: Wallet,
    title: 'Wallet Intel',
    cadence: 'Behavioral',
    text: 'Classify users into Whales, Smart Money, and Bots with AI labeling.',
    tags: ['Labels', 'PnL'],
    accent: 'from-[#14f195]/20 to-transparent',
  },
  {
    icon: Cpu,
    title: 'Compute Metrics',
    cadence: 'Aggregated',
    text: 'Monitor CU usage and priority fees to optimize user experience.',
    tags: ['Fees', 'Efficiency'],
    accent: 'from-[#00c2ff]/20 to-transparent',
  },
  {
    icon: HeartPulse,
    title: 'Health Scoring',
    cadence: 'Continuous',
    text: 'A proprietary health score based on success rates, latency, and security flags.',
    tags: ['Live Score', 'Alerts'],
    accent: 'from-[#9945ff]/20 to-transparent',
  },
];

const gallery = [
  {
    title: 'Real-time Pipeline',
    label: 'Architecture',
    image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: 'Network Intelligence',
    label: 'Security',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: 'Insight Dashboard',
    label: 'Analytics',
    image: 'https://images.unsplash.com/photo-1551288049-bbbda536339a?auto=format&fit=crop&w=1400&q=80',
  },
];

const securityCards = [
  {
    icon: ShieldCheck,
    title: 'Auth resilience',
    text: 'Token refresh, guarded access, and protected client flows.',
  },
  {
    icon: Lock,
    title: 'Threat detection',
    text: 'Signer bypass and flash-loan-style anomaly surfaces.',
  },
  {
    icon: Cable,
    title: 'Scoped streams',
    text: 'Program-level subscriptions instead of noisy global firehoses.',
  },
];

const pricingCards = [
  {
    tier: 'Starter',
    price: '$0',
    text: 'Solo builders',
    bullets: ['1 workspace', 'Core monitoring', 'Basic alerts'],
    featured: false,
  },
  {
    tier: 'Pro',
    price: '$49',
    text: 'Shipping teams',
    bullets: ['Unlimited programs', 'Instruction analytics', 'Wallet intelligence'],
    featured: true,
  },
  {
    tier: 'Scale',
    price: 'Custom',
    text: 'High-volume ops',
    bullets: ['Fleet health', 'Priority support', 'Advanced security'],
    featured: false,
  },
];

const docsLinks = [
  { icon: Code2, title: 'Quickstart', text: 'Spin up frontend, backend, and monitoring fast.' },
  { icon: Terminal, title: 'API Reference', text: 'Understand endpoints, polling, and socket events.' },
  { icon: Globe, title: 'Architecture', text: 'See how the app, indexer, analytics, and alerts connect.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#03050c] text-white">
      <div className="relative">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,241,149,0.12),transparent_25%),radial-gradient(circle_at_80%_18%,rgba(153,69,255,0.15),transparent_30%),linear-gradient(180deg,#03050c_0%,#080a1a_40%,#03050c_100%)]" />
        <div className="landing-grid absolute inset-0 opacity-20" />
        <div className="solana-orb solana-orb-left absolute left-[-100px] top-[100px] h-[400px] w-[400px] rounded-full" />
        <div className="solana-orb solana-orb-right absolute right-[-100px] top-[50px] h-[450px] w-[450px] rounded-full" />

        {/* Navigation */}
        <header className="relative z-50 mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_30px_rgba(20,241,149,0.15)] backdrop-blur-xl">
              <Activity className="h-6 w-6 text-[#14f195]" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">Probe</div>
              <div className="font-[family:var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.4em] text-white/40">
                Observability layer
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            {[
              ['Features', '#features'],
              ['Security', '#security'],
              ['Pricing', '#pricing'],
              ['Docs', '#docs'],
            ].map(([item, href]) => (
              <Link key={item} href={href} className="text-sm font-medium text-white/60 transition hover:text-[#14f195]">
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-white/80 transition hover:text-white">
              Sign In
            </Link>
            <Link href="/register" className="solana-button rounded-full px-6 py-2.5 text-sm font-bold text-[#03050c]">
              Get Started
            </Link>
          </div>
        </header>

        <main className="relative z-10">
          {/* Hero Section */}
          <section className="mx-auto max-w-7xl px-6 pb-24 pt-16 lg:pt-32">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <div className="relative z-20">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#14f195]/30 bg-[#14f195]/10 px-4 py-2 font-[family:var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.2em] text-[#14f195]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14f195] opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#14f195]"></span>
                  </span>
                  Hackathon MVP Live on Devnet
                </div>

                <h1 className="mt-8 font-[family:var(--font-space-grotesk)] text-6xl font-extrabold leading-[1] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
                  The <span className="solana-gradient-text">APM Layer</span> for Solana.
                </h1>

                <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/60 sm:text-xl">
                  Stop flying blind. Monitor, debug, and secure your Solana programs with real-time decoded analytics and automated security guards.
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-5">
                  <Link href="/register" className="solana-button group inline-flex items-center gap-3 rounded-full px-8 py-4 text-base font-bold text-[#03050c]">
                    Launch Dashboard
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link href="#" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-medium text-white/90 backdrop-blur-lg transition hover:bg-white/10">
                    <Code2 className="h-5 w-5 text-[#00c2ff]" />
                    Read the Docs
                  </Link>
                </div>

                <div className="mt-16 flex flex-wrap gap-4">
                  {statChips.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-md">
                      <div className="font-[family:var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.2em] text-white/40">
                        {item.label}
                      </div>
                      <div className="mt-1.5 text-base font-semibold text-white/90">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="solana-panel relative overflow-hidden rounded-[2.5rem] p-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#14f195]/10 via-transparent to-[#9945ff]/10" />
                  <div className="relative rounded-[2.2rem] bg-[#050714]/90 p-6 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-red-500/50" />
                        <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                        <div className="h-3 w-3 rounded-full bg-green-500/50" />
                        <div className="ml-4 font-[family:var(--font-ibm-plex-mono)] text-xs text-white/30">probe_v1_mainnet.sh</div>
                      </div>
                      <RefreshCw className="h-4 w-4 animate-spin-slow text-white/20" />
                    </div>

                    <div className="mt-6 space-y-4">
                      <TerminalRow icon={Terminal} label="Indexer" value="Streaming block 241,092,103..." color="text-[#14f195]" />
                      <TerminalRow icon={Activity} label="Events" value="Decoded: RaydiumSwap (Success)" color="text-[#00c2ff]" />
                      <TerminalRow icon={ShieldCheck} label="Security" value="No anomalies detected" color="text-green-400" />
                      <TerminalRow icon={Gauge} label="Compute" value="Avg: 142,000 CU" color="text-yellow-400" />
                    </div>

                    <div className="mt-8 rounded-2xl border border-white/5 bg-black/40 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-white/40">Program Health</span>
                        <span className="text-xs font-bold text-[#14f195]">98.2%</span>
                      </div>
                      <div className="mt-3 h-1.5 w-full rounded-full bg-white/5">
                        <div className="h-full w-[98.2%] rounded-full bg-gradient-to-r from-[#14f195] to-[#00c2ff]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -right-8 -top-8 h-24 w-24 animate-bounce-slow rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-2xl">
                  <PieChart className="h-full w-full text-[#9945ff]" />
                </div>
                <div className="absolute -bottom-10 -left-10 h-32 w-32 animate-pulse-slow rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
                  <Zap className="h-full w-full text-[#14f195]" />
                </div>
              </div>
            </div>
          </section>

          {/* Trusted By Section (Simplified) */}
          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="flex flex-col items-center gap-8">
              <p className="font-[family:var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.5em] text-white/30">
                Ecosystem Partners
              </p>
              <div className="flex flex-wrap items-center justify-center gap-12 opacity-40 grayscale transition hover:grayscale-0">
                <Globe className="h-8 w-8" />
                <Lock className="h-8 w-8" />
                <Cpu className="h-8 w-8" />
                <Blocks className="h-8 w-8" />
                <Activity className="h-8 w-8" />
              </div>
            </div>
          </section>

          {/* Bento Grid Features */}
          <section id="features" className="mx-auto max-w-7xl px-6 py-24">
            <div className="mb-16 text-center">
              <h2 className="font-[family:var(--font-space-grotesk)] text-4xl font-bold tracking-tight sm:text-5xl">
                Built for the speed of Solana.
              </h2>
              <p className="mt-4 text-white/50">Everything you need to run high-performance programs.</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {featureBento.map((item) => (
                <div key={item.title} className={`solana-bento group relative overflow-hidden rounded-[2.5rem] p-8 transition-all hover:border-white/20 ${item.style}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative z-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] transition-transform group-hover:scale-110">
                      <item.icon className="h-6 w-6 text-[#14f195]" />
                    </div>
                    <h3 className="mt-6 text-2xl font-bold tracking-tight text-white">{item.title}</h3>
                    <p className="mt-4 text-base leading-relaxed text-white/50">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Integration Section (NEW) */}
          <section id="security" className="mx-auto max-w-7xl px-6 py-24">
            <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <div className="font-[family:var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.4em] text-[#14f195]">Security</div>
                <h2 className="mt-4 font-[family:var(--font-space-grotesk)] text-4xl font-bold tracking-tight sm:text-5xl">
                  Security built into the observability layer.
                </h2>
              </div>
              <p className="max-w-sm text-white/50">Protection, anomaly signals, and guarded streams built into the product surface.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {securityCards.map((card) => (
                <div key={card.title} className="solana-bento rounded-[2rem] p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <card.icon className="h-5 w-5 text-[#14f195]" />
                  </div>
                  <h3 className="mt-6 text-2xl font-bold">{card.title}</h3>
                  <p className="mt-4 text-white/50">{card.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-24">
            <div className="solana-panel rounded-[3rem] p-12">
              <div className="grid items-center gap-16 lg:grid-cols-2">
                <div>
                  <h2 className="font-[family:var(--font-space-grotesk)] text-4xl font-bold tracking-tight sm:text-5xl">
                    Integrates in seconds.
                  </h2>
                  <p className="mt-6 text-lg text-white/60">
                    Our TypeScript SDK allows you to start monitoring your program interactions with minimal overhead. Just wrap your client and go.
                  </p>
                  <ul className="mt-8 space-y-4">
                    <li className="flex items-center gap-3 text-white/80">
                      <ShieldCheck className="h-5 w-5 text-[#14f195]" />
                      No performance impact on-chain
                    </li>
                    <li className="flex items-center gap-3 text-white/80">
                      <Zap className="h-5 w-5 text-[#00c2ff]" />
                      Real-time event propagation
                    </li>
                    <li className="flex items-center gap-3 text-white/80">
                      <Lock className="h-5 w-5 text-[#9945ff]" />
                      Self-hosted or Cloud options
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl bg-black/50 p-6 font-[family:var(--font-ibm-plex-mono)] shadow-2xl">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                    <div className="h-2 w-2 rounded-full bg-white/20" />
                    <span className="text-[10px] text-white/30">npm install @probe/sdk</span>
                  </div>
                  <pre className="mt-6 text-sm leading-relaxed">
                    <code className="text-[#14f195]">import</code> <code className="text-white">{`{ Probe }`}</code> <code className="text-[#14f195]">from</code> <code className="text-yellow-200">&quot;@probe/sdk&quot;</code>;{'\n\n'}
                    <code className="text-[#00c2ff]">const</code> <code className="text-white">probe = </code> <code className="text-[#14f195]">new</code> <code className="text-white">Probe(</code>{'\n'}
                    {'  '}<code className="text-white">apiKey: </code> <code className="text-yellow-200">&quot;pb_live_...&quot;</code>,{'\n'}
                    {'  '}<code className="text-white">programId: </code> <code className="text-yellow-200">&quot;your_prog_id&quot;</code>{'\n'}
                    <code className="text-white">);</code>{'\n\n'}
                    <code className="text-white/40">{`// Start monitoring`}</code>{'\n'}
                    <code className="text-white">probe.monitor();</code>
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Core Capabilities Showcase (Refined) */}
          <section className="mx-auto max-w-7xl px-6 py-24">
            <div className="flex flex-col items-end justify-between gap-6 md:flex-row">
              <div className="max-w-2xl">
                <div className="font-[family:var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.4em] text-[#14f195]">Capabilities</div>
                <h2 className="mt-4 font-[family:var(--font-space-grotesk)] text-5xl font-extrabold tracking-tight">The smarter fetcher showcase.</h2>
              </div>
              <p className="max-w-xs text-right text-white/50">A refined look at the high-impact engines powering Probe.</p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {highImpactFeatures.map((feature) => (
                <div key={feature.title} className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-0 transition-opacity group-hover:opacity-100`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                        <feature.icon className="h-6 w-6 text-[#14f195]" />
                      </div>
                      <span className="font-[family:var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-widest text-white/30">{feature.cadence}</span>
                    </div>
                    <h3 className="mt-8 text-2xl font-bold">{feature.title}</h3>
                    <p className="mt-4 text-base leading-relaxed text-white/50">{feature.text}</p>
                    <div className="mt-8 flex flex-wrap gap-2">
                      {feature.tags.map(tag => (
                        <span key={tag} className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white/40">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Architecture Visual */}
          <section className="mx-auto max-w-7xl px-6 py-24">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="solana-panel flex flex-col justify-center rounded-[3rem] p-12">
                <h2 className="font-[family:var(--font-space-grotesk)] text-4xl font-bold tracking-tight">Solana-native data flow.</h2>
                <p className="mt-6 text-lg text-white/50">
                  Our architecture is designed to minimize latency by processing data at the edge of the validator stream. 
                </p>
                <div className="mt-10 grid grid-cols-2 gap-6">
                  {gallery.map(item => (
                    <div key={item.title} className="group overflow-hidden rounded-2xl border border-white/5 bg-white/5 transition-all hover:border-white/10">
                      <img src={item.image} alt={item.title} className="h-32 w-full object-cover opacity-50 transition-opacity group-hover:opacity-100" />
                      <div className="p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/30">{item.label}</div>
                        <div className="mt-1 text-sm font-bold">{item.title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative overflow-hidden rounded-[3rem] border border-white/5 bg-black/40 p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,241,149,0.1),transparent_70%)]" />
                <SolanaIllustration />
              </div>
            </div>
          </section>

          <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
            <div className="mb-16 text-center">
              <div className="font-[family:var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.4em] text-[#14f195]">Pricing</div>
              <h2 className="mt-4 font-[family:var(--font-space-grotesk)] text-4xl font-bold tracking-tight sm:text-5xl">
                Simple pricing for builders and operators.
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {pricingCards.map((card) => (
                <div
                  key={card.tier}
                  className={`rounded-[2.5rem] border p-8 ${
                    card.featured
                      ? 'border-[#14f195]/20 bg-gradient-to-b from-[#14f195]/10 to-white/[0.03]'
                      : 'border-white/5 bg-white/[0.02]'
                  }`}
                >
                  <div className="font-[family:var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.3em] text-white/35">
                    {card.text}
                  </div>
                  <div className="mt-3 text-2xl font-bold">{card.tier}</div>
                  <div className="mt-5 text-5xl font-extrabold tracking-tight">{card.price}</div>
                  <div className="mt-8 space-y-3 text-white/60">
                    {card.bullets.map((bullet) => (
                      <div key={bullet}>{bullet}</div>
                    ))}
                  </div>
                  <Link
                    href="/register"
                    className={`mt-8 inline-flex rounded-full px-6 py-3 text-sm font-bold ${
                      card.featured ? 'solana-button text-[#03050c]' : 'border border-white/10 text-white/90'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section id="docs" className="mx-auto max-w-7xl px-6 py-24">
            <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <div className="font-[family:var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.4em] text-[#14f195]">Docs</div>
                <h2 className="mt-4 font-[family:var(--font-space-grotesk)] text-4xl font-bold tracking-tight sm:text-5xl">
                  Documentation that keeps up.
                </h2>
              </div>
              <Link href="#" className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white">
                Open docs hub
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {docsLinks.map((doc) => (
                <div key={doc.title} className="group rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 transition hover:border-white/10 hover:bg-white/[0.04]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <doc.icon className="h-5 w-5 text-[#14f195]" />
                  </div>
                  <h3 className="mt-6 text-2xl font-bold">{doc.title}</h3>
                  <p className="mt-4 text-white/50">{doc.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Footer / CTA */}
          <section className="mx-auto max-w-7xl px-6 py-24 text-center">
            <div className="relative overflow-hidden rounded-[3.5rem] border border-[#14f195]/20 bg-gradient-to-b from-[#14f195]/5 to-transparent px-6 py-24 shadow-[0_0_100px_rgba(20,241,149,0.05)]">
              <div className="relative z-10 mx-auto max-w-3xl">
                <h2 className="font-[family:var(--font-space-grotesk)] text-5xl font-extrabold tracking-tight sm:text-7xl">
                  Ready to ship <span className="solana-gradient-text">safer</span>?
                </h2>
                <p className="mt-8 text-xl text-white/60">
                  Join the next generation of Solana operators who monitor with Probe.
                </p>
                <div className="mt-12 flex flex-wrap justify-center gap-6">
                  <Link href="/register" className="solana-button rounded-full px-12 py-5 text-lg font-bold text-[#03050c]">
                    Launch Now
                  </Link>
                  <Link href="#" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-12 py-5 text-lg font-bold backdrop-blur-xl transition hover:bg-white/10">
                    Contact Sales
                    <ArrowUpRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
            
            <footer className="mt-24 border-t border-white/5 pt-12 text-white/30">
              <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-[#14f195]" />
                  <span className="font-bold tracking-tight text-white/60">Probe</span>
                </div>
                <div className="flex gap-8 text-sm">
                  <Link href="#" className="hover:text-white transition">Terms</Link>
                  <Link href="#" className="hover:text-white transition">Privacy</Link>
                  <Link href="#" className="hover:text-white transition">Status</Link>
                </div>
                <div className="text-sm">© 2026 Probe Observability Platform.</div>
              </div>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
}

function TerminalRow({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-black/40 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-col">
        <span className="font-[family:var(--font-ibm-plex-mono)] text-[9px] uppercase tracking-widest text-white/30">{label}</span>
        <span className="text-sm font-medium text-white/90">{value}</span>
      </div>
    </div>
  );
}

function SolanaIllustration() {
  return (
    <div className="relative h-full w-full opacity-60">
      <svg viewBox="0 0 920 420" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14f195" stopOpacity="0" />
            <stop offset="50%" stopColor="#14f195" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#00c2ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Animated Lines Placeholder */}
        <path d="M50 210 Q 230 50 460 210 T 870 210" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="10 10">
          <animate attributeName="stroke-dashoffset" from="200" to="0" dur="10s" repeatCount="indefinite" />
        </path>
        <path d="M50 210 Q 230 370 460 210 T 870 210" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="10 10">
          <animate attributeName="stroke-dashoffset" from="0" to="200" dur="10s" repeatCount="indefinite" />
        </path>

        {/* Nodes */}
        <g className="animate-pulse">
          <circle cx="460" cy="210" r="40" fill="#14f195" fillOpacity="0.1" stroke="#14f195" strokeWidth="1" />
          <circle cx="460" cy="210" r="15" fill="#14f195" />
        </g>
        
        <circle cx="230" cy="130" r="10" fill="#00c2ff" fillOpacity="0.5" />
        <circle cx="690" cy="130" r="10" fill="#9945ff" fillOpacity="0.5" />
        <circle cx="230" cy="290" r="10" fill="#00c2ff" fillOpacity="0.5" />
        <circle cx="690" cy="290" r="10" fill="#9945ff" fillOpacity="0.5" />

        <text x="460" y="270" textAnchor="middle" fill="white" fontSize="12" fontFamily="var(--font-ibm-plex-mono)" opacity="0.5">CENTRAL_INDEXER</text>
      </svg>
    </div>
  );
}
