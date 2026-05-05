import bcrypt from "bcryptjs";
import {
  PrismaClient,
  ReportType,
  ReservationStatus,
  Role,
  TransportStatus,
} from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.report.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.scheduledReportRun.deleteMany();
  await prisma.transportUnit.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = await bcrypt.hash("Admin123!", 12);
  const userPasswordHash = await bcrypt.hash("Usuario123!", 12);

  const admin = await prisma.user.create({
    data: {
      fullName: "Mariana Torres",
      email: "admin@reportes.com",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const analyst = await prisma.user.create({
    data: {
      fullName: "Carlos Méndez",
      email: "usuario@reportes.com",
      passwordHash: userPasswordHash,
      role: Role.USER,
      isActive: true,
    },
  });

  const operator = await prisma.user.create({
    data: {
      fullName: "Laura Sánchez",
      email: "operador@reportes.com",
      passwordHash: userPasswordHash,
      role: Role.USER,
      isActive: true,
    },
  });

  const transports = await prisma.transportUnit.createMany({
    data: [
      {
        code: "BUS-101",
        plateNumber: "ABC-101",
        status: TransportStatus.ACTIVE,
        capacity: 42,
        isActive: true,
      },
      {
        code: "BUS-102",
        plateNumber: "ABC-102",
        status: TransportStatus.ACTIVE,
        capacity: 38,
        isActive: true,
      },
      {
        code: "BUS-103",
        plateNumber: "ABC-103",
        status: TransportStatus.MAINTENANCE,
        capacity: 50,
        isActive: true,
      },
    ],
  });

  const transportUnits = await prisma.transportUnit.findMany({
    orderBy: { code: "asc" },
  });

  const today = new Date();
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);
  const fourDaysAgo = new Date(today);
  fourDaysAgo.setDate(today.getDate() - 4);
  const sixDaysAgo = new Date(today);
  sixDaysAgo.setDate(today.getDate() - 6);

  await prisma.reservation.createMany({
    data: [
      {
        code: "RES-9001",
        travelDate: twoDaysAgo,
        seats: 2,
        status: ReservationStatus.CONFIRMED,
        userId: analyst.id,
        transportUnitId: transportUnits[0].id,
      },
      {
        code: "RES-9002",
        travelDate: fourDaysAgo,
        seats: 1,
        status: ReservationStatus.PENDING,
        userId: operator.id,
        transportUnitId: transportUnits[1].id,
      },
      {
        code: "RES-9003",
        travelDate: sixDaysAgo,
        seats: 4,
        status: ReservationStatus.CONFIRMED,
        userId: analyst.id,
        transportUnitId: transportUnits[0].id,
      },
    ],
  });

  await prisma.report.createMany({
    data: [
      {
        tipo: ReportType.TRANSPORTES_ACTIVOS,
        fecha: sixDaysAgo,
        usuarioId: analyst.id,
        descripcion:
          "Reporte semanal para supervisar la disponibilidad de la flota activa.",
        isActive: true,
      },
      {
        tipo: ReportType.RESERVAS_POR_FECHA,
        fecha: fourDaysAgo,
        usuarioId: operator.id,
        descripcion:
          "Consolidado operacional de reservas por fecha para la ventana comercial.",
        isActive: true,
      },
      {
        tipo: ReportType.ADMINISTRATIVO,
        fecha: twoDaysAgo,
        usuarioId: analyst.id,
        descripcion:
          "Resumen ejecutivo con métricas clave para seguimiento administrativo.",
        isActive: true,
      },
    ],
  });

  const createdReports = await prisma.report.findMany({
    orderBy: { createdAt: "asc" },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        action: "AUTH_LOGIN",
        entity: "User",
        entityId: admin.id,
        userId: admin.id,
        metadata: { email: admin.email },
      },
      {
        action: "REPORT_CREATE",
        entity: "Report",
        entityId: createdReports[0]?.id,
        userId: admin.id,
        metadata: { tipo: ReportType.TRANSPORTES_ACTIVOS },
      },
      {
        action: "REPORT_CREATE",
        entity: "Report",
        entityId: createdReports[1]?.id,
        userId: admin.id,
        metadata: { tipo: ReportType.RESERVAS_POR_FECHA },
      },
      {
        action: "REPORT_SCHEDULED_RUN",
        entity: "ScheduledReportRun",
        entityId: null,
        userId: admin.id,
        metadata: { plantilla: "administrativo", formato: "pdf" },
      },
    ],
  });

  await prisma.scheduledReportRun.create({
    data: {
      reportType: ReportType.ADMINISTRATIVO,
      format: "pdf",
      status: "SUCCESS",
      trigger: "seed",
      fileName: "administrativo-seed.pdf",
      recordsCount: 4,
      summary: {
        transportesActivos: transports.count,
        reservasTotales: 3,
      },
    },
  });

  console.log("Seed completed successfully.");
  console.log("Admin credentials: admin@reportes.com / Admin123!");
  console.log("User credentials: usuario@reportes.com / Usuario123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
