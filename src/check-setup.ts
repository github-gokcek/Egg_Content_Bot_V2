import * as fs from 'fs';
import * as path from 'path';

console.log('🔍 Platform Uyumluluk Kontrolü Başlatılıyor...\n');

// Gerekli klasörleri kontrol et ve oluştur
const requiredDirs = [
  'temp',
  'dist'
];

console.log('📁 Gerekli klasörler kontrol ediliyor...');
for (const dir of requiredDirs) {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  ✅ ${dir}/ klasörü oluşturuldu`);
  } else {
    console.log(`  ✓ ${dir}/ klasörü mevcut`);
  }
}

// .env dosyasını kontrol et
console.log('\n🔐 Ortam değişkenleri kontrol ediliyor...');
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('  ⚠️  .env dosyası bulunamadı!');
  console.log('  ℹ️  .env.example dosyasını kopyalayıp .env olarak kaydedin');
} else {
  console.log('  ✓ .env dosyası mevcut');
}

// Node.js versiyonunu kontrol et
console.log('\n🔧 Node.js versiyonu kontrol ediliyor...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion >= 18) {
  console.log(`  ✅ Node.js ${nodeVersion} (Uyumlu)`);
} else {
  console.log(`  ❌ Node.js ${nodeVersion} (v18+ gerekli)`);
  process.exit(1);
}

// Platform bilgisi
console.log('\n💻 Platform Bilgisi:');
console.log(`  İşletim Sistemi: ${process.platform}`);
console.log(`  Mimari: ${process.arch}`);
console.log(`  Çalışma Dizini: ${process.cwd()}`);

// Asset klasörünü kontrol et (opsiyonel)
console.log('\n🖼️  Asset klasörü kontrol ediliyor...');
const assetDir = path.join(process.cwd(), 'assetler');
if (!fs.existsSync(assetDir)) {
  console.log('  ⚠️  assetler/ klasörü bulunamadı (Opsiyonel)');
  console.log('  ℹ️  Reklam sistemi için assetler/Ninja.png dosyası gerekli');
} else {
  console.log('  ✓ assetler/ klasörü mevcut');
  const ninjaPath = path.join(assetDir, 'Ninja.png');
  if (fs.existsSync(ninjaPath)) {
    console.log('  ✓ Ninja.png dosyası mevcut');
  } else {
    console.log('  ⚠️  Ninja.png dosyası bulunamadı');
  }
}

console.log('\n✅ Platform uyumluluk kontrolü tamamlandı!');
console.log('\n📝 Sonraki adımlar:');
console.log('  1. .env dosyasını yapılandırın');
console.log('  2. src/services/firebase.ts dosyasını düzenleyin');
console.log('  3. npm run deploy - Komutları deploy edin');
console.log('  4. npm run dev - Botu başlatın');
