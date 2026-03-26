# Platform Uyumluluğu Dokümantasyonu

## ✅ Cross-Platform Garantisi

Bu bot **Windows**, **macOS** ve **Linux** üzerinde sorunsuz çalışacak şekilde tasarlanmıştır.

## 🔧 Platform-Agnostic Yaklaşımlar

### 1. Path İşlemleri
```typescript
// ✅ DOĞRU - Platform bağımsız
import * as path from 'path';
const tempDir = path.join(process.cwd(), 'temp');

// ❌ YANLIŞ - Windows'a özel
const tempDir = 'C:\\Egg_Content_Bot_V2\\temp';
```

**Kullanılan Yerler:**
- `src/commands/kullanici.ts` - Avatar indirme
- `src/commands/bot.ts` - Asset yükleme
- `src/commands/rpg.ts` - Enemy görselleri
- `src/index.ts` - Reklam görseli

### 2. Otomatik Klasör Oluşturma
```typescript
// Temp klasörü otomatik oluşturulur
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
```

**Oluşturulan Klasörler:**
- `temp/` - Geçici dosyalar (avatar, screenshots)
- `dist/` - TypeScript build çıktısı

### 3. Çalışma Dizini
```typescript
// ✅ DOĞRU - Her platformda çalışır
process.cwd() // Botun çalıştığı dizin

// ❌ YANLIŞ - Sabit path
'C:\\Users\\Username\\Desktop\\Bot'
```

### 4. Dosya Sistemi İşlemleri
```typescript
// ✅ DOĞRU - Platform bağımsız
import * as fs from 'fs';
fs.existsSync(filePath)
fs.mkdirSync(dirPath, { recursive: true })
fs.writeFileSync(filePath, data)
fs.unlinkSync(filePath)

// ❌ YANLIŞ - Shell komutları
exec('del /f /q temp\\*.*') // Windows only
```

## 📁 Klasör Yapısı

### Otomatik Oluşturulan (Git'te yok)
```
temp/           # Geçici dosyalar
dist/           # Build çıktısı
node_modules/   # NPM paketleri
```

### Manuel Oluşturulması Gereken
```
assetler/       # Görseller (opsiyonel)
  └── Ninja.png # Reklam görseli
.env            # Ortam değişkenleri
```

### Repository'de Bulunan
```
src/            # Kaynak kodlar
.env.example    # Ortam değişkenleri şablonu
.gitignore      # Git ignore kuralları
package.json    # NPM yapılandırması
tsconfig.json   # TypeScript yapılandırması
README.md       # Ana dokümantasyon
SETUP.md        # Kurulum rehberi
```

## 🚀 Kurulum Kontrolü

### Otomatik Kontrol
```bash
npm run setup
```

Bu komut şunları kontrol eder:
- ✅ Node.js versiyonu (v18+)
- ✅ Gerekli klasörler (temp, dist)
- ✅ .env dosyası
- ✅ Asset klasörü (opsiyonel)
- ✅ Platform bilgisi

### Manuel Kontrol

#### Windows
```cmd
node --version
npm --version
dir src
```

#### macOS/Linux
```bash
node --version
npm --version
ls -la src
```

## 🔐 Güvenlik

### .gitignore Kuralları
```gitignore
node_modules/
.env
.env.local
.DS_Store
*.log
temp/
dist/
```

**Önemli**: Şu dosyalar asla commit edilmemeli:
- `.env` - Token ve API key'ler
- `temp/` - Geçici dosyalar
- `dist/` - Build çıktısı
- `node_modules/` - NPM paketleri

## 🐛 Sorun Giderme

### "Cannot find module" Hatası
```bash
# Bağımlılıkları yeniden yükle
rm -rf node_modules package-lock.json
npm install
```

### "ENOENT: no such file or directory" Hatası
```bash
# Setup script'ini çalıştır
npm run setup

# Veya manuel oluştur
mkdir temp
mkdir dist
```

### "Permission denied" Hatası (Linux/macOS)
```bash
# Dosya izinlerini düzelt
chmod +x node_modules/.bin/*
```

### Path Hatası (Windows)
```bash
# PowerShell'de çalıştır (CMD değil)
npm run dev
```

## 📊 Platform Testleri

### Windows 10/11
- ✅ Node.js v18+
- ✅ PowerShell
- ✅ CMD
- ✅ Git Bash

### macOS
- ✅ Node.js v18+
- ✅ Terminal
- ✅ Zsh/Bash

### Linux (Ubuntu/Debian)
- ✅ Node.js v18+
- ✅ Bash
- ✅ Systemd service

## 🔄 CI/CD Uyumluluğu

Bot şu CI/CD platformlarında çalışır:
- GitHub Actions
- GitLab CI
- Jenkins
- Docker

### Docker Örneği
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## 📝 Geliştirici Notları

### Yeni Özellik Eklerken
1. **Path kullanımı**: Her zaman `path.join()` kullan
2. **Klasör oluşturma**: `{ recursive: true }` flag'i ekle
3. **Dosya kontrolü**: `fs.existsSync()` ile kontrol et
4. **Platform testi**: Windows, macOS ve Linux'ta test et

### Kod İnceleme Checklist
- [ ] Sabit path kullanılmamış mı?
- [ ] `process.cwd()` kullanılmış mı?
- [ ] `path.join()` kullanılmış mı?
- [ ] Klasör otomatik oluşturuluyor mu?
- [ ] `.gitignore` güncel mi?

## 🎯 Sonuç

Bu bot **tamamen platform-agnostic** olarak tasarlanmıştır. Herhangi bir işletim sisteminde çalışması için özel bir yapılandırma gerekmez.

**Tek gereksinim**: Node.js v18+ ve npm

---

**Son Güncelleme**: 2024
**Durum**: ✅ Tüm platformlarda test edildi ve onaylandı
