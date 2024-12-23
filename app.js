const express = require('express');
const shortid = require('shortid');
const MobileDetect = require('mobile-detect');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || process.env.CLOUDWARE_PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || '.';
const URLS_FILE = path.join(DATA_DIR, 'urls.json');

// 读取数据
let urls = {};
try {
  urls = require(URLS_FILE);
} catch (err) {
  // 如果文件不存在，使用空对象
  fs.writeFileSync(URLS_FILE, '{}');
}

// 保存数据
function saveUrls() {
  fs.writeFileSync(URLS_FILE, JSON.stringify(urls, null, 2));
}

app.use(express.json());
app.use(express.static('public'));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// 创建短链接
app.post('/api/shorten', (req, res) => {
  const { url } = req.body;
  const id = shortid.generate();
  
  urls[id] = {
    original_url: url,
    created_at: new Date().toISOString()
  };
  
  saveUrls();
  res.json({ shortUrl: `${req.protocol}://${req.get('host')}/${id}` });
});

// 重定向服务
app.get('/:id', (req, res) => {
  const { id } = req.params;
  const md = new MobileDetect(req.headers['user-agent']);
  
  if (!md.mobile()) {
    return res.status(403).send('只允许移动设备访问');
  }

  const urlData = urls[id];
  if (!urlData) {
    return res.status(404).send('链接不存在');
  }
  
  res.redirect(urlData.original_url);
});

// ��量创建短链接
app.post('/api/shorten/batch', async (req, res) => {
  const { urls: urlList } = req.body;
  
  if (!Array.isArray(urlList)) {
    return res.status(400).json({ error: '无效的请求格式' });
  }

  try {
    const results = await Promise.all(urlList.map(async (url) => {
      const id = shortid.generate();
      
      urls[id] = {
        original_url: url,
        created_at: new Date().toISOString()
      };

      return {
        url,
        shortUrl: `${req.protocol}://${req.get('host')}/${id}`,
        success: true
      };
    }));

    saveUrls();
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: '批量处理失败' });
  }
});

// 获取所有短链接列表
app.get('/api/urls', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const urlList = Object.entries(urls).map(([id, data]) => ({
    id,
    ...data
  }));

  res.json({
    urls: urlList.slice(offset, offset + limit),
    total: urlList.length
  });
});

// 添加健康检查接口
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// 未捕获的异常处理
process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的 Promise 拒绝:', reason);
});

// 添加根路由重定向
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 添加错误处理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`服务运行在 http://0.0.0.0:${port}`);
}); 