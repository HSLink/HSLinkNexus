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
    return "0.0.1+unknown";
  }

  // 去掉开头的 v
  let version = gitVersion.startsWith("v") ? gitVersion.slice(1) : gitVersion;

  // 匹配 git describe 输出格式: 1.2.2-2-g881dec1
  // 转换为 SemVer 格式: 1.2.2-2+g881dec1
  // 其中 -2 是预发布版本（commits ahead），g881dec1 是构建元数据
  const match = version.match(/^(\d+\.\d+\.\d+)-(\d+)-(.+)$/);
  if (match) {
    const [, baseVersion, commits, hash] = match;
    return `${baseVersion}-${commits}+${hash}`;
  }

  // 如果是纯版本号（如 1.2.2），直接返回
  if (/^\d+\.\d+\.\d+$/.test(version)) {
    return version;
  }

  // 纯 hash 情况，fallback
  return `0.0.1+${version}`;
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

  const gitVersion = getGitVersion();
  console.log(`Git version: ${gitVersion || "not found"}`);

  const semverVersion = parseToSemver(gitVersion);
  console.log(`Semver version: ${semverVersion}`);

  updatePackageJson(semverVersion);
}

main();
