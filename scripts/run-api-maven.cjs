const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const apiDir = path.join(repoRoot, 'api');
const isWindows = process.platform === 'win32';

function getJavaVersion(javaHome) {
  const releaseFile = path.join(javaHome, 'release');
  if (!fs.existsSync(releaseFile)) {
    return null;
  }

  const releaseContents = fs.readFileSync(releaseFile, 'utf8');
  const versionMatch = releaseContents.match(/JAVA_VERSION="([^"]+)"/);
  if (!versionMatch) {
    return null;
  }

  const numeric = versionMatch[1].replace(/"/g, '').split('.')[0];
  const major = Number.parseInt(numeric, 10);
  return Number.isNaN(major) ? null : major;
}

function listChildDirectories(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dir, entry.name));
}

function findJavaHomes() {
  const candidates = [];

  if (process.env.JAVA_HOME) {
    candidates.push(process.env.JAVA_HOME);
  }

  if (isWindows) {
    candidates.push(path.join('C:', 'Program Files', 'Java', 'latest'));
    candidates.push(...listChildDirectories(path.join('C:', 'Program Files', 'Java')));
    candidates.push(...listChildDirectories(path.join('C:', 'Program Files', 'Eclipse Adoptium')));
  } else {
    candidates.push('/usr/lib/jvm/default-java');
    candidates.push(...listChildDirectories('/usr/lib/jvm'));
    candidates.push(...listChildDirectories('/Library/Java/JavaVirtualMachines').map((dir) =>
      path.join(dir, 'Contents', 'Home'),
    ));
  }

  return [...new Set(candidates)].filter((candidate) => getJavaVersion(candidate) >= 21);
}

function resolveMavenCommand() {
  if (isWindows) {
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/c', 'mvn.cmd', ...process.argv.slice(2)],
    };
  }

  const wrapper = path.join(apiDir, isWindows ? 'mvnw.cmd' : 'mvnw');
  if (fs.existsSync(wrapper)) {
    return { command: wrapper, args: process.argv.slice(2) };
  }

  return { command: 'mvn', args: process.argv.slice(2) };
}

const javaHomes = findJavaHomes();

if (javaHomes.length === 0) {
  console.error(
    'Java 21+ was not found. Please install JDK 21 and/or set JAVA_HOME to a Java 21 installation.',
  );
  process.exit(1);
}

const selectedJavaHome = javaHomes
  .map((javaHome) => ({ javaHome, version: getJavaVersion(javaHome) }))
  .sort((left, right) => right.version - left.version)[0].javaHome;
const maven = resolveMavenCommand();

const javaBin = path.join(selectedJavaHome, 'bin');
const env = {
  ...process.env,
  JAVA_HOME: selectedJavaHome,
  PATH: `${javaBin}${path.delimiter}${process.env.PATH ?? ''}`,
};

const result = spawnSync(maven.command, maven.args, {
  cwd: apiDir,
  env,
  stdio: 'inherit',
  shell: false,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
