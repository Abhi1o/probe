import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Known Solana program labels for human-readable display
const KNOWN_PROGRAMS: Record<string, string> = {
  '11111111111111111111111111111111': 'System Program',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'SPL Token',
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb': 'Token-2022',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'Associated Token Account',
  'ComputeBudget111111111111111111111111111111': 'Compute Budget',
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s': 'Metaplex Metadata',
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr': 'Memo v2',
  'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo': 'Memo v1',
  'BPFLoaderUpgradeab1e11111111111111111111111': 'BPF Loader Upgradeable',
  'BPFLoader2111111111111111111111111111111111': 'BPF Loader 2',
  'Vote111111111111111111111111111111111111111': 'Vote Program',
  'Stake11111111111111111111111111111111111111': 'Stake Program',
  'SysvarRent111111111111111111111111111111111': 'Sysvar Rent',
  'SysvarC1ock11111111111111111111111111111111': 'Sysvar Clock',
  'SysvarRecentB1ockHashes11111111111111111111': 'Sysvar Recent Blockhashes',
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'Raydium AMM v4',
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': 'Orca Whirlpool',
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter v6',
  '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin': 'Serum DEX v3',
  'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD': 'Marinade Finance',
  'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo': 'Solend',
  'FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH': 'Pyth Oracle',
  'SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f': 'Switchboard V2',
  'CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR': 'Candy Machine v3',
  'BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY': 'Bubblegum',
  'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K': 'Magic Eden v2',
};

function getLabel(programId: string): string {
  return KNOWN_PROGRAMS[programId] || `${programId.slice(0, 6)}...${programId.slice(-4)}`;
}

export interface CpiGraphNode {
  programId: string;
  label: string;
  isMonitored: boolean;       // Is this program in Probe?
  isYourProgram: boolean;     // Is this the program being viewed?
  invocationCount: number;    // Total times this node appears
  successRate: number;
  isKnownProgram: boolean;    // Is it in our known programs registry?
}

export interface CpiGraphEdge {
  id: string;
  callerProgramId: string;
  calleeProgramId: string;
  callerLabel: string;
  calleeLabel: string;
  invocationCount: number;
  successCount: number;
  failureCount: number;
  failureRate: number;
  avgComputeUnits: number;
  maxDepth: number;
  lastInvoked: Date;
}

export interface CpiRiskReport {
  totalRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  breakdown: {
    dependencyBreadth: { score: number; count: number };
    failureInheritance: { score: number; avgCalleeFailureRate: number };
    computeConcentration: { score: number };
    nestingDepth: { score: number; maxDepth: number };
  };
  recommendations: string[];
  outgoingEdges: number;
  incomingEdges: number;
}

@Injectable()
export class CpiService {
  private readonly logger = new Logger(CpiService.name);

  constructor(private prisma: PrismaService) {}

  // ── Extract CPI edges from stored rawData ─────────────────────────────────
  async extractCpiFromStoredTransactions(programId: string): Promise<number> {
    const program = await this.prisma.program.findUnique({
      where: { id: programId },
      select: { programId: true, name: true },
    });
    if (!program) return 0;

    // Get transactions with rawData that haven't been CPI-analyzed yet
    const transactions = await this.prisma.transaction.findMany({
      where: { programId, rawData: { not: null } },
      select: { id: true, signature: true, rawData: true, status: true },
      take: 5000,
      orderBy: { blockTime: 'desc' },
    });

    let extracted = 0;
    const edgeMap = new Map<string, {
      callerProgramId: string; calleeProgramId: string;
      callerLabel: string; calleeLabel: string;
      invocations: number; successes: number; failures: number;
      totalCu: number; maxDepth: number;
    }>();

    for (const tx of transactions) {
      try {
        const raw = tx.rawData as any;
        if (!raw?.meta?.innerInstructions?.length) continue;

        const success = tx.status === 'SUCCESS';
        const outerInstructions = raw.transaction?.message?.instructions || [];

        for (const innerGroup of raw.meta.innerInstructions) {
          const outerIx = outerInstructions[innerGroup.index];
          const callerProgramId = outerIx?.programId || program.programId;

          for (let i = 0; i < innerGroup.instructions.length; i++) {
            const innerIx = innerGroup.instructions[i];
            const calleeProgramId = innerIx?.programId;
            if (!calleeProgramId || calleeProgramId === callerProgramId) continue;

            const depth = this.estimateDepth(i, innerGroup.instructions);
            const edgeKey = `${callerProgramId}::${calleeProgramId}`;

            const existing = edgeMap.get(edgeKey) || {
              callerProgramId,
              calleeProgramId,
              callerLabel: getLabel(callerProgramId),
              calleeLabel: getLabel(calleeProgramId),
              invocations: 0,
              successes: 0,
              failures: 0,
              totalCu: 0,
              maxDepth: 1,
            };

            existing.invocations++;
            if (success) existing.successes++; else existing.failures++;
            existing.maxDepth = Math.max(existing.maxDepth, depth);
            edgeMap.set(edgeKey, existing);
            extracted++;
          }
        }
      } catch {
        // Skip malformed rawData
      }
    }

    // Upsert all edges in batch
    for (const edge of edgeMap.values()) {
      await this.prisma.cpiEdge.upsert({
        where: {
          callerProgramId_calleeProgramId: {
            callerProgramId: edge.callerProgramId,
            calleeProgramId: edge.calleeProgramId,
          },
        },
        create: {
          callerProgramId: edge.callerProgramId,
          callerLabel: edge.callerLabel,
          calleeProgramId: edge.calleeProgramId,
          calleeLabel: edge.calleeLabel,
          invocationCount: edge.invocations,
          successCount: edge.successes,
          failureCount: edge.failures,
          avgComputeUnits: 0,
          maxDepth: edge.maxDepth,
          lastInvoked: new Date(),
        },
        update: {
          callerLabel: edge.callerLabel,
          calleeLabel: edge.calleeLabel,
          invocationCount: { increment: edge.invocations },
          successCount: { increment: edge.successes },
          failureCount: { increment: edge.failures },
          maxDepth: { set: edge.maxDepth },
          lastInvoked: new Date(),
        },
      });
    }

    this.logger.log(`Extracted ${edgeMap.size} CPI edges from ${transactions.length} transactions for ${program.name}`);
    return edgeMap.size;
  }

  private estimateDepth(index: number, instructions: any[]): number {
    // Simple heuristic: instructions later in the list tend to be deeper
    // Solana encodes inner instructions in execution order
    if (index === 0) return 1;
    if (index < 3) return 1;
    if (index < 8) return 2;
    return 3;
  }

  // ── Get CPI graph for a program ───────────────────────────────────────────
  async getCpiGraph(programId: string): Promise<{
    nodes: CpiGraphNode[];
    edges: CpiGraphEdge[];
    riskReport: CpiRiskReport;
  }> {
    const program = await this.prisma.program.findUnique({
      where: { id: programId },
      select: { programId: true },
    });
    if (!program) return { nodes: [], edges: [], riskReport: this.emptyRisk() };

    const solanaAddress = program.programId;

    // Get all edges where this program is caller OR callee
    const [outgoing, incoming] = await Promise.all([
      this.prisma.cpiEdge.findMany({ where: { callerProgramId: solanaAddress } }),
      this.prisma.cpiEdge.findMany({ where: { calleeProgramId: solanaAddress } }),
    ]);

    const allEdges = [...outgoing, ...incoming];

    // Build node map
    const nodeMap = new Map<string, CpiGraphNode>();

    const addNode = (pid: string, label: string, invocations: number, successes: number) => {
      const existing = nodeMap.get(pid);
      if (existing) {
        existing.invocationCount += invocations;
      } else {
        nodeMap.set(pid, {
          programId: pid,
          label,
          isMonitored: false,
          isYourProgram: pid === solanaAddress,
          invocationCount: invocations,
          successRate: invocations > 0 ? successes / invocations : 1,
          isKnownProgram: !!KNOWN_PROGRAMS[pid],
        });
      }
    };

    for (const edge of allEdges) {
      addNode(edge.callerProgramId, edge.callerLabel, edge.invocationCount, edge.successCount);
      addNode(edge.calleeProgramId, edge.calleeLabel, edge.invocationCount, edge.successCount);
    }

    // Mark monitored programs
    const monitoredPrograms = await this.prisma.program.findMany({
      select: { programId: true },
    });
    const monitoredSet = new Set(monitoredPrograms.map(p => p.programId));
    for (const node of nodeMap.values()) {
      node.isMonitored = monitoredSet.has(node.programId);
    }

    const edges: CpiGraphEdge[] = allEdges.map(e => ({
      id: e.id,
      callerProgramId: e.callerProgramId,
      calleeProgramId: e.calleeProgramId,
      callerLabel: e.callerLabel,
      calleeLabel: e.calleeLabel,
      invocationCount: e.invocationCount,
      successCount: e.successCount,
      failureCount: e.failureCount,
      failureRate: e.invocationCount > 0 ? e.failureCount / e.invocationCount : 0,
      avgComputeUnits: e.avgComputeUnits,
      maxDepth: e.maxDepth,
      lastInvoked: e.lastInvoked,
    }));

    const riskReport = this.computeRiskScore(outgoing, incoming);

    return {
      nodes: [...nodeMap.values()],
      edges,
      riskReport,
    };
  }

  // ── CPI Risk Score ────────────────────────────────────────────────────────
  private computeRiskScore(outgoing: any[], incoming: any[]): CpiRiskReport {
    const dependencyCount = outgoing.length;
    const dependencyScore = Math.min(25, dependencyCount * 5);

    const avgCalleeFailureRate = outgoing.length > 0
      ? outgoing.reduce((sum, e) => sum + (e.invocationCount > 0 ? e.failureCount / e.invocationCount : 0), 0) / outgoing.length
      : 0;
    const failureScore = Math.round(avgCalleeFailureRate * 35);

    const maxDepthSeen = outgoing.length > 0 ? Math.max(...outgoing.map(e => e.maxDepth)) : 0;
    const nestingScore = maxDepthSeen >= 3 ? 15 : maxDepthSeen === 2 ? 8 : 0;

    const totalRiskScore = Math.min(100, dependencyScore + failureScore + nestingScore);

    const riskLevel: 'low' | 'medium' | 'high' | 'critical' =
      totalRiskScore >= 70 ? 'critical'
      : totalRiskScore >= 50 ? 'high'
      : totalRiskScore >= 25 ? 'medium'
      : 'low';

    const recommendations: string[] = [];
    if (dependencyCount > 5) recommendations.push(`Your program calls ${dependencyCount} external programs. Each dependency is a potential failure point.`);
    if (avgCalleeFailureRate > 0.05) recommendations.push(`Average callee failure rate is ${(avgCalleeFailureRate * 100).toFixed(1)}%. Add error handling for CPI failures.`);
    if (maxDepthSeen >= 3) recommendations.push(`CPI nesting depth of ${maxDepthSeen} detected. Deep nesting increases compute costs and failure risk.`);
    if (incoming.length > 10) recommendations.push(`${incoming.length} programs call your program. Ensure your program handles unexpected callers safely.`);
    if (recommendations.length === 0) recommendations.push('CPI risk is low. Your program has minimal external dependencies.');

    return {
      totalRiskScore,
      riskLevel,
      breakdown: {
        dependencyBreadth: { score: dependencyScore, count: dependencyCount },
        failureInheritance: { score: failureScore, avgCalleeFailureRate },
        computeConcentration: { score: 0 },
        nestingDepth: { score: nestingScore, maxDepth: maxDepthSeen },
      },
      recommendations,
      outgoingEdges: outgoing.length,
      incomingEdges: incoming.length,
    };
  }

  private emptyRisk(): CpiRiskReport {
    return {
      totalRiskScore: 0, riskLevel: 'low',
      breakdown: {
        dependencyBreadth: { score: 0, count: 0 },
        failureInheritance: { score: 0, avgCalleeFailureRate: 0 },
        computeConcentration: { score: 0 },
        nestingDepth: { score: 0, maxDepth: 0 },
      },
      recommendations: ['No CPI data yet. Transactions are being indexed.'],
      outgoingEdges: 0, incomingEdges: 0,
    };
  }

  // ── Get top callee programs (what does this program call most?) ───────────
  async getTopCallees(programId: string, limit = 10) {
    const program = await this.prisma.program.findUnique({
      where: { id: programId },
      select: { programId: true },
    });
    if (!program) return [];

    return this.prisma.cpiEdge.findMany({
      where: { callerProgramId: program.programId },
      orderBy: { invocationCount: 'desc' },
      take: limit,
    });
  }

  // ── Get top caller programs (who calls this program most?) ────────────────
  async getTopCallers(programId: string, limit = 10) {
    const program = await this.prisma.program.findUnique({
      where: { id: programId },
      select: { programId: true },
    });
    if (!program) return [];

    return this.prisma.cpiEdge.findMany({
      where: { calleeProgramId: program.programId },
      orderBy: { invocationCount: 'desc' },
      take: limit,
    });
  }
}
