import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { rm } from 'fs/promises';

// Get the absolute path to the project root
const __dirname = dirname(fileURLToPath(import.meta.url));

// ✅ Path to the SDK folder
const sdkPath = resolve(__dirname, "../frontend/src/lib/api");

const deleteIfExists = async (filePath) => {
  try {
    await rm(filePath, { recursive: true, force: true });
    console.log(`🧹 Removed: ${filePath}`);
  } catch (e) {
    console.log("error: ", e)
  }
};

const deleteFiles = async () => {
  await deleteIfExists(`${sdkPath}/.openapi-generator`);
  await deleteIfExists(`${sdkPath}/.openapi-generator-ignore`);
  await deleteIfExists(`${sdkPath}/.gitignore`);
  await deleteIfExists(`${sdkPath}/.npmignore`);
  await deleteIfExists(`${sdkPath}/git_push.sh`);
  await deleteIfExists(`${sdkPath}/README.md`);
  await deleteIfExists(`${sdkPath}/package.json`);
  await deleteIfExists(`${sdkPath}/tsconfig.json`);
  await deleteIfExists(`${sdkPath}/tsconfig.esm.json`);
};

deleteFiles().then(() => console.log("✅ Post-generation cleanup done."));
