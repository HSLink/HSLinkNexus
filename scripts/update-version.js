import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

function getGitVersion() {
  try {
    const version = execSync("git describe --tags --always", {
      encoding: "utf-8",
      cwd: rootDir,
    }).trim();
    return version;
  } catch (error) {
    console.warn("Failed to get git version:", error.message);
    return null;
  }
}

function parseToSemver(gitVersion) {
  if (!gitVersion) {
    return "0.0.1";
  }

  // 去掉开头的 v
  let version = gitVersion.startsWith("v") ? gitVersion.slice(1) : gitVersion;

  // 匹配 git describe 输出格式: 1.2.2-2-g881dec1
  // 转换为 SemVer 格式: 1.2.2+2
  // commits ahead 作为数字 build metadata；MSI/NSIS 要求 build metadata 为纯数字且 <= 65535
  const match = version.match(/^(\d+\.\d+\.\d+)-(\d+)-(.+)$/);
  if (match) {
    const [, baseVersion, commits] = match;
    return `${baseVersion}+${commits}`;
  }

  // 如果是纯版本号（如 1.2.2），直接返回
  if (/^\d+\.\d+\.\d+$/.test(version)) {
    return version;
  }

  // 纯 hash 情况（浅克隆拿不到 tag），fallback 到固定版本号
  console.warn(`Cannot resolve version from git: ${version}, fallback to 0.0.1`);
  return "0.0.1";
}

function updatePackageJson(semverVersion) {
  const packagePath = join(rootDir, "package.json");
  const packageContent = readFileSync(packagePath, "utf-8");
  const packageJson = JSON.parse(packageContent);

  if (packageJson.version !== semverVersion) {
    packageJson.version = semverVersion;
    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");
    console.log(`Updated package.json with version: ${semverVersion}`);
  } else {
    console.log("package.json version is up-to-date. No update needed.");
  }
}

function main() {
  console.log("Updating version from git tags...");

  // CI 构建任务直接复用 get-version 任务算好的版本，
  // 浅克隆下 git describe 拿不到 tag，必须与 get-version 保持一致
  const envVersion = process.env.VERSION?.trim();
  if (envVersion) {
    console.log(`Using version from env VERSION: ${envVersion}`);
    updatePackageJson(envVersion);
    return;
  }

  const gitVersion = getGitVersion();
  console.log(`Git version: ${gitVersion || "not found"}`);

  const semverVersion = parseToSemver(gitVersion);
  console.log(`Semver version: ${semverVersion}`);

  updatePackageJson(semverVersion);
}

main();
