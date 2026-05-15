import { PrismaClient } from '@prisma/client';

async function check() {
  const prisma = new PrismaClient();
  try {
    const template = await prisma.feeChallanTemplate.findFirst({ where: { isDefault: true } });
    if (template) {
      console.log('Template Placeholders:');
      const matches = template.htmlContent.match(/\{\{.*?\}\}/g);
      console.log(JSON.stringify(Array.from(new Set(matches)), null, 2));
    } else {
      console.log('No default template found');
    }
  } finally {
    await prisma.$disconnect();
  }
}

check();
