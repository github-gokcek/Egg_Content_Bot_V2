import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin komutları')
    .addSubcommand(sub =>
      sub.setName('test')
        .setDescription('Test etkinliği duyurusu gönder')
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    // Admin kontrolü
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız!',
        ephemeral: true
      });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'test') {
      const embed = new EmbedBuilder()
        .setColor(0xff6b35)
        .setDescription(`# 🚀 **ÖZEL TEST ETKİNLİĞİ** 🚀

## 🎯 **Sunucumuzun Geleceğini Şekillendir!**

\`\`\`
⏰ BAŞLAMA SAATİ: 21:00
⌛ SÜRE: 15-20 Dakika
🎮 ZORLUK: Kolay & Eğlenceli
\`\`\`

### 🌟 **Bu Etkinlik Nedir?**

Botumuzun yeni özelliklerini test etmek ve sunucumuzu daha da geliştirmek için **özel bir test seansı** düzenliyoruz! 

\`\`\`
💡 RAHAT KATILIM:
• Alt-tab yapabilirsin
• Başka işlerle ilgilenebilirsin  
• Sadece arada bir butona basman yeterli
• Stressiz ve keyifli bir deneyim!
\`\`\`

---

## 🎁 **KATILIM ÖDÜLLERİ**

### 🏆 **Özel Test Rolü**
\`\`\`
🎭 "Beta Tester" rolü
✨ Sunucuda özel statü
🌈 Renkli isim görünümü
\`\`\`

### 💰 **Bonus Bakiye**
\`\`\`
🪙 +500 Coin hediye!
💎 Market alışverişi için ekstra para
🎯 Diğer oyunculardan önde başla
\`\`\`

### 🚀 **Erken Erişim Ayrıcalıkları**
\`\`\`
⚡ Yeni özellikler ilk sende!
🔮 Gelecek güncellemeleri önce gör
👑 VIP test kullanıcısı ol
🎪 Özel etkinliklere davet
\`\`\`

---

## 📋 **KATILIM ŞARTLARI**

\`\`\`
✅ Sunucuda kayıtlı olmak
✅ 15-20 dakika ayırabilmek
✅ Arada bir Discord'a bakmak
✅ Eğlenmeye hazır olmak! 🎉
\`\`\`

---

## 🎪 **NEDEN KATILMALISIN?**

### 🌟 **Sunucunun Gelişimine Katkı**
\`\`\`
• Botun daha iyi olmasına yardım et
• Fikirlerini paylaş ve dinlensin
• Toplulukla birlikte büyü
\`\`\`

### 🎁 **Eşsiz Ödüller**
\`\`\`
• Bu fırsatı bir daha bulamayabilirsin
• Sadece test katılımcılarına özel
• Gelecekte "Ben de vardım" diyebilirsin
\`\`\`

### 🚀 **Öncelikli Erişim**
\`\`\`
• Yeni özellikler ilk sende olacak
• Diğerlerinden hep bir adım önde
• Özel test grubunun parçası ol
\`\`\`

---

## ⚡ **HEMEN KATIL!**

\`\`\`
🎯 Saat 21:00'da burada ol
🎮 Sadece 15-20 dakika
🏆 Muhteşem ödüller kazan
🚀 Sunucunun geleceğini şekillendir
\`\`\`

### 💬 **Sorularınız mı var?**
\`\`\`
• Adminlere sorabilirsiniz
• Test hakkında merak ettiklerinizi öğrenin
• Birlikte harika bir deneyim yaşayalım!
\`\`\`

---

## 🎊 **UNUTMA!**

**Bu sadece bir test değil, sunucumuzun geleceğine yapacağın bir yatırım!** 

\`\`\`
⭐ Beta Tester rolü
💰 500 Coin bonus  
🚀 Erken erişim ayrıcalıkları
🎪 Özel etkinlik davetleri
\`\`\`

**Saat 21:00'da görüşmek üzere!** 🎉

---

*Bu fırsat bir daha gelmeyebilir. Kaçırma!* ⚡`);

      await interaction.reply({ 
        content: '@everyone',
        embeds: [embed],
        ephemeral: false 
      });
    }
  },
};