import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ChallanTemplateTypeName = 'INSTALLMENT' | 'EXTRA' | 'HOSTEL';

const TEMPLATE_FILE_BY_TYPE: Record<ChallanTemplateTypeName, string> = {
  INSTALLMENT: 'installment-challan-template.html',
  EXTRA: 'extra-challan-template.html',
  HOSTEL: 'hostel-challan-template.html',
};

const TEMPLATE_LABEL_BY_TYPE: Record<ChallanTemplateTypeName, string> = {
  INSTALLMENT: 'Installment',
  EXTRA: 'Extra',
  HOSTEL: 'Hostel',
};

export const normalizeChallanTemplateType = (type?: string): ChallanTemplateTypeName => {
  const normalized = String(type || 'INSTALLMENT').toUpperCase();
  return normalized === 'EXTRA' || normalized === 'HOSTEL' ? normalized : 'INSTALLMENT';
};

const findBundledTemplatePath = (type: ChallanTemplateTypeName) => {
  const fileName = TEMPLATE_FILE_BY_TYPE[type];
  const candidates = [
    join(process.cwd(), 'templates', fileName),
    join(process.cwd(), '..', 'templates', fileName),
  ];
  return candidates.find((candidate) => existsSync(candidate));
};

export async function resolveFeeChallanTemplate(
  prisma: PrismaService,
  type?: string,
) {
  const normalizedType = normalizeChallanTemplateType(type);

  const defaultTemplate = await prisma.feeChallanTemplate.findFirst({
    where: { type: normalizedType as any, isDefault: true },
    orderBy: { updatedAt: 'desc' },
  });
  if (defaultTemplate) return defaultTemplate;

  const sameTypeTemplate = await prisma.feeChallanTemplate.findFirst({
    where: { type: normalizedType as any },
    orderBy: { updatedAt: 'desc' },
  });
  if (sameTypeTemplate) return sameTypeTemplate;

  const bundledPath = findBundledTemplatePath(normalizedType);
  if (bundledPath) {
    const now = new Date();
    return {
      id: 0,
      name: `Bundled ${TEMPLATE_LABEL_BY_TYPE[normalizedType]} Challan Template`,
      htmlContent: readFileSync(bundledPath, 'utf8'),
      type: normalizedType,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
      isBundled: true,
    };
  }

  throw new BadRequestException(
    `No ${TEMPLATE_LABEL_BY_TYPE[normalizedType]} challan template found. Please configure a ${normalizedType} template.`,
  );
}
