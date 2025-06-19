const path = require('path');
const fs = require('fs');

class ReadCache {
  constructor() {
    this.cache = {};
    this.path = path.join(__dirname, '../', 'cache.json');
    this.load(); // tự động load khi khởi tạo
  }

  load() {
    try {
      const raw = fs.readFileSync(this.path, 'utf-8');
      this.cache = JSON.parse(raw);
    } catch (err) {
      console.warn("⚠️ Không thể đọc cache.json, sẽ dùng cache rỗng.");
      this.cache = {};
    }
  }

  getCache() {
    return this.cache;
  }

  reload() {
    this.load();
  }
}

const cacheContext = new ReadCache();
module.exports = cacheContext;
