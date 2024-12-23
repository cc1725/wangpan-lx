const fs = require('fs');
const path = require('path');

// 创建 dist 目录
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// 要复制的文件列表
const filesToCopy = [
    'app.js',
    'package.json',
    'urls.json',
    'start.sh',
    'Procfile'
];

// 复制文件到 dist
filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, `dist/${file}`);
    }
});

// 复制 public 目录
if (!fs.existsSync('dist/public')) {
    fs.mkdirSync('dist/public');
}
fs.copyFileSync('public/index.html', 'dist/public/index.html');

// 设置 start.sh 的执行权限
fs.chmodSync('dist/start.sh', '755');

console.log('构建完成！文件已保存到 dist 目录'); 