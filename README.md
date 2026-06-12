# Matambayi — Dandalin Tambayoyin Al'umma da Raba Ilimi

**Matambayi** babban dandali ne na zamani (kwatankwacin Stack Overflow ko Quora) wanda aka gina shi gaba ɗaya cikin harshen standard Hausa. Wuri ne da al'ummar Hausawa zasu iya tattaunawa, yin tambayoyi, ba da amsoshi masu amfani, raba gogewar rayuwa, da gina kasuwar ilimi ta gaskiya.

---

## 🌟 Sassan Dandalin (Key Features)

*   **Tambaya da Amsoshi (Q&A):** Masu amfani na iya raba tambayoyi tare da mabuɗan kalmomi (Tags) gami da ba da amsoshin kwararru ko na gargajiya.
*   **Mafi Kyawun Amsa (Best Solution):** Mai tambaya yana da ikon zaɓar amsa guda ɗaya mafi inganci a matsayin *"Mafi kyawun amsa"* (ana nuna shi da kalar kore mai haske).
*   **Maki da Daraja (Reputation System):** Kowane mai amfani yana samun maki na daraja (Reputation) sakamakon samun maki masu kyau (upvotes) ko kuma idan aka zaɓi amsarsa a matsayin mafi kyau.
*   **Maganar Ra'ayoyi (Comments):** Ana iya tattaunawa ta gajeriyar hanya akan tambaya ko amsa domin neman ƙarin bayani.
*   **Neman Tambayoyi (Search System):** Ana iya binciko tambayoyi daki-daki ta hanyar amfani da mabuɗan kalmomi ko kowane rubutu.
*   **Rajista da Shiga (Auth):** Tsaftataccen tsarin shiga da rajista, haɗe da tsarin maido da kalmar sirri ta amfani da lambar PIN ta musamman.
*   **Gudanarwa (Admin Moderation):** Shugabanni (Admins) suna da ikon goge tambayoyi, amsoshi, ko kalaman batanci don kiyaye mutuncin dandali.

---

## 🛠️ Bayanan Asusu na Gwaji (Pre-seeded Accounts)

Domin sauƙaƙa gwajin dandali, mun riga mun saka asusun gwaji guda hudu tare da tambayoyi masu inganci akan Noma, Lafiya, da Tarihi:

1.  **Sarkin Gudanarwa (Admin):**
    *   **Username:** `@Sarkin_Tattaunawa`
    *   **Password:** `admin123`
    *   **PIN na Maido da Sirri:** `9999`
    *   *Matsayi:* Mai Gudanarwa (Admin) - Yana da ikon goge kowane rubutu da bai dace ba.

2.  **Malamai da Masana (Users):**
    *   **Suna (Aliyu Mohammad):** `@Aliyu_Kano` / Password: `user123` / PIN: `1111`
    *   **Suna (Safiya Yusuf):** `@Safiya_Zaria` / Password: `user123` / PIN: `2222`
    *   **Suna (Bala Funtua - Noma):** `@Malam_Bala_Funtua` / Password: `user123` / PIN: `3333`

---

## 🚀 Yadda Ake Gudu A Gida (Setup & Start Instructions)

Dandalin Matambayi yana gudana azaman cikakken tsarin **Full-Stack (Vite + React + Express + Node.js)**.

### 1. Shigar Da Kayan Aiki
```bash
npm install
```

### 2. Gudu A Yanayin Ci-gaba (Development Mode)
```bash
npm run dev
```

### 3. Gina Shi Domin Turawa (Production Build)
```bash
npm run build
npm start
```

---

## 🗄️ Tsarin Database (Storage)
Ana adana duka bayanai (Users, Questions, Answers, Comments) cikin tsaftataccen fayil na JSON a `./data/db.json`. Wannan yana sa tsarin ya kasance mai saurin gudu, mai zaman kansa (offline-first), kuma ba ya buƙatar saita hadadden database na waje don gudanar da sassan applet a lokacin gwaji.

"Sallamar Tambaya Ita Ce Makullin Sanin Kowa." — Matambayi Community.
