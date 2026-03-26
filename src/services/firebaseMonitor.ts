import { Logger } from '../utils/logger';

interface FirebaseOperation {
  type: 'read' | 'write' | 'delete';
  collection: string;
  timestamp: number;
  caller?: string;
}

class FirebaseMonitor {
  private operations: FirebaseOperation[] = [];
  private startTime: number = Date.now();
  private logInterval: NodeJS.Timeout | null = null;

  start() {
    this.startTime = Date.now();
    this.operations = [];
    
    // Her 30 saniyede bir rapor
    this.logInterval = setInterval(() => {
      this.printReport();
    }, 30000);
    
    Logger.success('Firebase Monitor başlatıldı');
  }

  stop() {
    if (this.logInterval) {
      clearInterval(this.logInterval);
      this.logInterval = null;
    }
    this.printReport();
  }

  trackRead(collection: string, caller?: string) {
    this.operations.push({
      type: 'read',
      collection,
      timestamp: Date.now(),
      caller
    });
  }

  trackWrite(collection: string, caller?: string) {
    this.operations.push({
      type: 'write',
      collection,
      timestamp: Date.now(),
      caller
    });
  }

  trackDelete(collection: string, caller?: string) {
    this.operations.push({
      type: 'delete',
      collection,
      timestamp: Date.now(),
      caller
    });
  }

  private printReport() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const totalOps = this.operations.length;
    
    if (totalOps === 0) {
      Logger.info('Firebase Monitor: Henüz işlem yok');
      return;
    }

    // Collection bazında grupla
    const byCollection: Record<string, { read: number; write: number; delete: number }> = {};
    
    for (const op of this.operations) {
      if (!byCollection[op.collection]) {
        byCollection[op.collection] = { read: 0, write: 0, delete: 0 };
      }
      byCollection[op.collection][op.type]++;
    }

    // Caller bazında grupla
    const byCaller: Record<string, number> = {};
    for (const op of this.operations) {
      if (op.caller) {
        byCaller[op.caller] = (byCaller[op.caller] || 0) + 1;
      }
    }

    // Type bazında grupla
    const byType = {
      read: this.operations.filter(op => op.type === 'read').length,
      write: this.operations.filter(op => op.type === 'write').length,
      delete: this.operations.filter(op => op.type === 'delete').length
    };

    console.log('\n' + '='.repeat(80));
    console.log('📊 FIREBASE KULLANIM RAPORU');
    console.log('='.repeat(80));
    console.log(`⏱️  Süre: ${elapsed.toFixed(0)} saniye`);
    console.log(`📈 Toplam İşlem: ${totalOps} (${(totalOps / elapsed).toFixed(2)} ops/sec)`);
    console.log(`📖 Read: ${byType.read} | ✍️  Write: ${byType.write} | 🗑️  Delete: ${byType.delete}`);
    
    console.log('\n📁 COLLECTION BAZINDA:');
    const sortedCollections = Object.entries(byCollection)
      .sort((a, b) => {
        const totalA = a[1].read + a[1].write + a[1].delete;
        const totalB = b[1].read + b[1].write + b[1].delete;
        return totalB - totalA;
      });
    
    for (const [collection, stats] of sortedCollections) {
      const total = stats.read + stats.write + stats.delete;
      const percentage = ((total / totalOps) * 100).toFixed(1);
      console.log(`  ${collection.padEnd(20)} | Total: ${total.toString().padStart(4)} (${percentage}%) | R:${stats.read} W:${stats.write} D:${stats.delete}`);
    }

    if (Object.keys(byCaller).length > 0) {
      console.log('\n🔍 CALLER BAZINDA (Top 10):');
      const sortedCallers = Object.entries(byCaller)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      for (const [caller, count] of sortedCallers) {
        const percentage = ((count / totalOps) * 100).toFixed(1);
        console.log(`  ${caller.padEnd(40)} | ${count.toString().padStart(4)} (${percentage}%)`);
      }
    }

    // Son 10 saniyedeki işlemler
    const recentOps = this.operations.filter(op => Date.now() - op.timestamp < 10000);
    if (recentOps.length > 0) {
      console.log(`\n⚡ Son 10 saniye: ${recentOps.length} işlem (${(recentOps.length / 10).toFixed(2)} ops/sec)`);
    }

    console.log('='.repeat(80) + '\n');
  }

  getStats() {
    return {
      total: this.operations.length,
      elapsed: (Date.now() - this.startTime) / 1000,
      opsPerSecond: this.operations.length / ((Date.now() - this.startTime) / 1000)
    };
  }

  reset() {
    this.operations = [];
    this.startTime = Date.now();
    Logger.info('Firebase Monitor sıfırlandı');
  }
}

export const firebaseMonitor = new FirebaseMonitor();
