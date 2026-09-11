import { PrismaClient, type PriceReportStatus } from '@prisma/client';
import { parsePriceReportOperatorCommand } from '../lib/price-report-operator';

const prisma = new PrismaClient();

const reportSelect = {
  id: true,
  reason: true,
  displayedPrice: true,
  observedPrice: true,
  offerObservedAt: true,
  status: true,
  createdAt: true,
  resolvedAt: true,
  resolutionNote: true,
  offer: {
    select: {
      id: true,
      shopName: true,
      product: { select: { id: true, name: true } },
    },
  },
} as const;

type ReportRow = Awaited<ReturnType<typeof findReport>>;

function findReport(id: string) {
  return prisma.priceReport.findUnique({ where: { id }, select: reportSelect });
}

function write(value: unknown, json: boolean) {
  if (json) {
    console.log(JSON.stringify(value, null, 2));
    return;
  }
  if (Array.isArray(value)) {
    if (!value.length) {
      console.log('Обращений не найдено.');
      return;
    }
    for (const report of value as NonNullable<ReportRow>[]) printReport(report);
    return;
  }
  printReport(value as NonNullable<ReportRow>);
}

function printReport(report: NonNullable<ReportRow>) {
  const observed = report.observedPrice === null ? 'не указана' : `${report.observedPrice} ₽`;
  console.log([
    `${report.id}  ${report.status}  ${report.reason}`,
    `  ${report.offer.product.name} · ${report.offer.shopName} · offer ${report.offer.id}`,
    `  показано ${report.displayedPrice} ₽ · увидено ${observed} · создано ${report.createdAt.toISOString()}`,
    report.resolutionNote ? `  решение: ${report.resolutionNote}` : null,
  ].filter(Boolean).join('\n'));
}

async function main() {
  const command = parsePriceReportOperatorCommand(process.argv.slice(2));
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

  if (command.action === 'list') {
    const reports = await prisma.priceReport.findMany({
      where: command.status === 'ALL' ? undefined : { status: command.status },
      orderBy: { createdAt: 'asc' },
      take: command.limit,
      select: reportSelect,
    });
    write(reports, command.json);
    return;
  }

  const targetStatus: PriceReportStatus = command.action === 'resolve' ? 'RESOLVED' : 'DISMISSED';
  const changed = await prisma.priceReport.updateMany({
    where: { id: command.id, status: 'OPEN' },
    data: { status: targetStatus, resolvedAt: new Date(), resolutionNote: command.note },
  });
  if (changed.count !== 1) {
    const existing = await prisma.priceReport.findUnique({ where: { id: command.id }, select: { status: true } });
    if (!existing) throw new Error(`PriceReport ${command.id} was not found`);
    throw new Error(`PriceReport ${command.id} is already ${existing.status}; only OPEN reports can be closed`);
  }
  const report = await findReport(command.id);
  if (!report) throw new Error(`PriceReport ${command.id} disappeared after update`);
  write(report, command.json);
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
