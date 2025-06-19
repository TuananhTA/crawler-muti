class ProductQueue {
  constructor() {
    this.queue = [];
    this.listeners = [];
  }
  
  push(item) {
    this.queue.push(item);
    this.listeners.forEach(cb => cb(item));
  }
  
  removeAll(){
    this.queue = [];
  }
  
  onPush(callback) {
    this.listeners.push(callback);
  }
  
  getAll() {
    return this.queue;
  }
}

// Singleton instance
let productQueueInstance = new ProductQueue();

module.exports = productQueueInstance ;
