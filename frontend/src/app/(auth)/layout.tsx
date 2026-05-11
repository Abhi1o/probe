export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#03050c] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,241,149,0.08),transparent_25%),radial-gradient(circle_at_80%_18%,rgba(153,69,255,0.1),transparent_30%)]" />
      <div className="landing-grid absolute inset-0 opacity-10" />
      
      <div className="relative z-10 w-full px-4 py-12">
        {children}
      </div>
    </div>
  );
}
