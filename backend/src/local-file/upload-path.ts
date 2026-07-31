import 'dotenv/config';
import * as path from 'path';

const PRODUCTION_UPLOAD_ROOT = '/opt/portal/uploads';

function isProductionEnvironment() {
  const environment = (process.env.ENVIRONMENT || process.env.NODE_ENV || '').toLowerCase();
  return environment === 'production';
}

export function getUploadRoot() {
  const configuredRoot = process.env.UPLOAD_ROOT?.trim();

  if (configuredRoot) {
    return path.resolve(configuredRoot);
  }

  if (isProductionEnvironment()) {
    return PRODUCTION_UPLOAD_ROOT;
  }

  return path.join(process.cwd(), 'uploads');
}
