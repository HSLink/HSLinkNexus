/**
 * 自动下载GitHub用户头像和技术栈图标的脚本
 * 在编译期执行，确保资源文件的最新状态
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// 创建必要的目录
const contributorsDir = path.join(rootDir, 'src', 'assets', 'contributors');
const techDir = path.join(rootDir, 'src', 'assets', 'tech');

ensureDir(contributorsDir);
ensureDir(techDir);

// 贡献者信息
const contributors = [
  {
    username: 'kaidegit',
    filename: 'yekai.png'
  },
  {
    username: 'HalfSweet',
    filename: 'halfsweet.png'
  },
  {
    username: 'RCSN',
    filename: 'rcsn.png'
  },
  {
    username: 'sakumisu',
    filename: 'sakumisu.png'
  }
];

// 技术栈图标 - 更新了Tauri和DaisyUI的URL
const techStack = [
  {
    name: 'tauri',
    url: 'https://tauri.app/meta/favicon-32x32.png',
    filename: 'tauri.svg'
  },
  {
    name: 'vue',
    url: 'https://raw.githubusercontent.com/vuejs/art/master/logo.svg',
    filename: 'vue.svg'
  },
  {
    name: 'daisyui',
    url: 'https://img.daisyui.com/images/daisyui-logo/daisyui-logomark.svg',
    filename: 'daisyui.svg'
  },
  {
    name: 'tailwind',
    url: 'https://raw.githubusercontent.com/tailwindlabs/tailwindcss/master/.github/logo-light.svg',
    filename: 'tailwind.svg'
  }
];

// 复用本地图标
// 如果已有本地图标文件，尝试复用它们
function copyLocalIcons() {
  try {
    // 检查公共目录中是否有可用的图标
    const publicTauriIcon = path.join(rootDir, 'public', 'tauri.svg');
    const publicViteIcon = path.join(rootDir, 'public', 'vite.svg'); // Vue项目通常包含vite.svg
    
    if (fs.existsSync(publicTauriIcon)) {
      fs.copyFileSync(publicTauriIcon, path.join(techDir, 'tauri.svg'));
      console.log('✅ 已从本地复制 tauri 图标');
    }
    
    // 查找是否有src-tauri/icons中的图标可用
    const tauriIconPng = path.join(rootDir, 'src-tauri', 'icons', 'icon.png');
    if (fs.existsSync(tauriIconPng) && !fs.existsSync(path.join(techDir, 'tauri.svg'))) {
      fs.copyFileSync(tauriIconPng, path.join(techDir, 'tauri.png'));
      console.log('✅ 已从本地复制 tauri 图标 (PNG格式)');
    }
  } catch (error) {
    console.error('尝试复用本地图标时出错:', error.message);
  }
}

async function main() {
  try {
    console.log('🔄 开始下载资源文件...');
    
    // 尝试复用本地图标
    copyLocalIcons();
    
    // 下载GitHub头像
    const avatarPromises = [];
    for (const contributor of contributors) {
      const avatarUrl = `https://github.com/${contributor.username}.png?size=200`;
      const outputPath = path.join(contributorsDir, contributor.filename);
      
      // 将头像下载任务添加到Promise数组中
      const promise = downloadFile(avatarUrl, outputPath)
        .then(() => {
          console.log(`✅ 已下载 ${contributor.username} 的头像`);
        })
        .catch(error => {
          console.error(`❌ 下载 ${contributor.username} 头像失败:`, error.message);
        });
      
      avatarPromises.push(promise);
    }
    
    // 并行下载所有头像
    await Promise.all(avatarPromises);
    
    // 下载技术栈图标
    const techPromises = [];
    for (const tech of techStack) {
      const outputPath = path.join(techDir, tech.filename);
      
      // 如果已存在同名文件，跳过下载
      if (fs.existsSync(outputPath)) {
        console.log(`⏩ ${tech.name} 图标已存在，跳过下载`);
        continue;
      }
      
      // 如果存在同名但不同扩展名的文件，跳过下载
      const fileWithoutExt = path.join(
        path.dirname(outputPath),
        path.basename(outputPath, path.extname(outputPath))
      );
      const possibleFiles = fs.readdirSync(path.dirname(outputPath)).filter(
        file => file.startsWith(path.basename(fileWithoutExt))
      );
      
      if (possibleFiles.length > 0) {
        console.log(`⏩ ${tech.name} 图标已存在其他格式，跳过下载`);
        continue;
      }
      
      // 将技术图标下载任务添加到Promise数组中
      const promise = downloadFile(tech.url, outputPath)
        .then(() => {
          console.log(`✅ 已下载 ${tech.name} 的图标`);
        })
        .catch(error => {
          console.error(`❌ 下载 ${tech.name} 图标失败:`, error.message);
          // 如果下载失败，创建占位符SVG
          createPlaceholderSVG(outputPath, tech.name);
        });
      
      techPromises.push(promise);
    }
    
    // 并行下载所有技术图标
    await Promise.all(techPromises);
    
    console.log('🎉 资源文件准备完成!');
    
    // 确保脚本完成后退出
    process.exit(0);
  } catch (error) {
    console.error('❌ 发生错误:', error);
    process.exit(1);
  }
}

// 下载文件
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    // 设置超时时间为10秒，防止无限等待
    const request = https.get(url, {
      headers: {
        'User-Agent': 'HSLink-Nexus-Build-Script'
      },
      timeout: 10000 // 10秒超时
    }, (response) => {
      // 处理重定向
      if (response.statusCode === 302 || response.statusCode === 301) {
        if (response.headers.location) {
          downloadFile(response.headers.location, outputPath)
            .then(resolve)
            .catch(reject);
          return;
        } else {
          reject(new Error('重定向没有提供location头'));
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`状态码: ${response.statusCode}`));
        return;
      }
      
      const fileStream = fs.createWriteStream(outputPath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    });
    
    request.on('error', (err) => {
      reject(err);
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('请求超时'));
    });
    
    request.end();
  });
}

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 已创建目录: ${dir}`);
  }
}

// 创建占位符SVG
function createPlaceholderSVG(outputPath, name) {
  const colors = {
    tauri: '#FFC131',
    vue: '#42B883',
    daisyui: '#5EEAD4',
    tailwind: '#38BDF8'
  };
  
  const color = colors[name.toLowerCase()] || '#888888';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <rect width="100%" height="100%" fill="${color}" />
    <text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" fill="white" dominant-baseline="middle">
      ${name}
    </text>
  </svg>`;
  
  fs.writeFileSync(outputPath, svg);
  console.log(`🎨 已为 ${name} 创建占位符图标`);
}

// 执行主函数并确保处理所有错误
main().catch(error => {
  console.error('❌ 脚本执行出错:', error);
  process.exit(1);
});