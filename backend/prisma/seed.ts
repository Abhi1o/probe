import { PrismaClient, Network } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@probe.dev' },
    update: {},
    create: {
      email: 'admin@probe.dev',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create test user
  const testPassword = await bcrypt.hash('test123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@probe.dev' },
    update: {},
    create: {
      email: 'test@probe.dev',
      password: testPassword,
      name: 'Test User',
      role: 'USER',
    },
  });
  console.log('✅ Created test user:', testUser.email);

  // ============================================================
  // REAL SOLANA PROGRAMS - VERIFIED FROM OFFICIAL DOCUMENTATION
  // Source: https://solana.com/docs/core/programs/builtin-programs
  // Source: https://spl.solana.com
  // These are the SAME program IDs on BOTH devnet and mainnet
  // (Solana native/core programs share the same address on all networks)
  // ============================================================
  const programs = [
    {
      name: 'SPL Token Program',
      programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      network: 'DEVNET',
      description: 'Official SPL Token Program — handles all fungible token minting, transfers, and account management. Every token on Solana (USDC, BONK, etc.) uses this. Source: https://spl.solana.com/token',
      isActive: true,
    },
    {
      name: 'System Program',
      programId: '11111111111111111111111111111111',
      network: 'DEVNET',
      description: 'Solana native System Program — the only program that can create new accounts and transfer SOL. Every wallet transaction goes through this. Source: https://solana.com/docs/core/programs/builtin-programs',
      isActive: true,
    },
    {
      name: 'Token-2022 Program',
      programId: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
      network: 'DEVNET',
      description: 'Next-generation SPL Token Program with extensions — supports transfer fees, confidential transfers, interest-bearing tokens, and more. Source: https://spl.solana.com/token-2022',
      isActive: true,
    },
    {
      name: 'Associated Token Account Program',
      programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      network: 'DEVNET',
      description: 'Creates deterministic token accounts for wallets. Called every time a wallet receives a new token type for the first time. Source: https://spl.solana.com/associated-token-account',
      isActive: true,
    },
    {
      name: 'Compute Budget Program',
      programId: 'ComputeBudget111111111111111111111111111111',
      network: 'DEVNET',
      description: 'Sets compute unit limits and priority fees for transactions. Used by almost every modern Solana transaction to set priority fees. Source: https://solana.com/docs/core/programs/builtin-programs',
      isActive: true,
    },
    {
      name: 'Metaplex Token Metadata',
      programId: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
      network: 'DEVNET',
      description: 'Metaplex NFT Metadata Program — stores on-chain metadata for all NFTs and tokens. Used by every NFT project on Solana. Source: https://developers.metaplex.com',
      isActive: true,
    },
    {
      name: 'Memo Program v2',
      programId: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
      network: 'DEVNET',
      description: 'Attaches human-readable memos to transactions. Used by exchanges and wallets to tag transfers with reference notes. Source: https://spl.solana.com/memo',
      isActive: true,
    },
  ];

  for (const programData of programs) {
    const program = await prisma.program.upsert({
      where: { programId: programData.programId },
      update: {},
      create: {
        name: programData.name,
        programId: programData.programId,
        network: programData.network as Network,
        description: programData.description,
        isActive: programData.isActive,
        user: {
          connect: { id: admin.id }
        }
      },
    });
    console.log('✅ Created program:', program.name);

    // Create sample alerts for each program
    const alert = await prisma.alert.create({
      data: {
        programId: program.id,
        name: `High Transaction Volume - ${program.name}`,
        description: 'Alert when transaction count exceeds threshold',
        condition: 'TRANSACTION_COUNT_THRESHOLD',
        comparison: 'GREATER_THAN',
        threshold: 1000,
        channels: ['EMAIL'],
        enabled: true,
      },
    });
    console.log('  ✅ Created alert:', alert.name);
  }

  // Create API keys for admin user
  const apiKey = await prisma.apiKey.create({
    data: {
      userId: admin.id,
      name: 'Default API Key',
      key: 'pk_test_' + Math.random().toString(36).substring(2, 15),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });
  console.log('✅ Created API key:', apiKey.name);

  // Create sample audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'USER_LOGIN',
        resource: 'auth',
        details: { ip: '127.0.0.1', userAgent: 'Mozilla/5.0' },
      },
      {
        userId: admin.id,
        action: 'PROGRAM_CREATED',
        resource: 'programs',
        details: { programId: programs[0].programId },
      },
      {
        userId: testUser.id,
        action: 'USER_LOGIN',
        resource: 'auth',
        details: { ip: '127.0.0.1', userAgent: 'Mozilla/5.0' },
      },
    ],
  });
  console.log('✅ Created audit logs');

  // Create sample metrics
  const firstProgram = await prisma.program.findFirst();
  if (firstProgram) {
    const now = new Date();
    const metrics = [];
    
    for (let i = 0; i < 24; i++) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      metrics.push({
        programId: firstProgram.id,
        timestamp: hour,
        hour: hour,
        txCount: Math.floor(Math.random() * 1000) + 100,
        successCount: Math.floor(Math.random() * 900) + 50,
        failureCount: Math.floor(Math.random() * 100),
        avgComputeUnits: Math.random() * 200000,
        avgFee: Math.random() * 5000,
      });
    }

    await prisma.metric.createMany({
      data: metrics,
    });
    console.log('✅ Created sample metrics');
  }

  console.log('');
  console.log('🎉 Database seeding completed!');
  console.log('');
  console.log('📝 Default Credentials:');
  console.log('   Admin: admin@probe.dev / admin123');
  console.log('   Test:  test@probe.dev / test123');
  console.log('');
  console.log('🔑 API Key:', apiKey.key);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
