# Open the Sky

Gerçek gökyüzünü hesaplayan bir iOS ve Android uygulaması — gökyüzünün bir çizimi değil. Ona bir yer ve bir an ver; 5044 Hipparcos yıldızını, 88 takımyıldızı, Güneş'i, Ay'ı ve beş gezegeni gerçekten durdukları yere koysun. Sonra gökyüzünün istediğin parçasına teleskopla bak, doğduğun dakikanın gökyüzünü aç, o gökyüzünü bir başkasınınkiyle karşılaştır.

Her şey pakete gömülü bir katalogdan Skia ile çiziliyor. Harita döşemesi yok, ağ isteği yok, astroloji servisi yok: uygulama kendi astronomisini kendi yapıyor.

## Ne yapıyor

### Ana ekran

Kendi profillerin ve arkadaşlarınınki, seçilen yıldızın ışığının ne zamandır yolda olduğunu sayan canlı bir sayaç, bulunduğun yer için şu anki gökyüzü ve dil değiştirici. Arkadaş profilleri carousel gibi kayıyor.

### Gökyüzünü aç

Gökyüzü 17 sektöre bölünüyor: 70°'nin üstünde tek bir başucu kapağı, sonra yüksek kuşakta (35°–70°) sekiz yön ve alçak kuşakta (ufuk–35°) sekiz yön. Genel görünüm bunları azimut-eşit uzaklıklı bir radar olarak çiziyor — dış çember ufuk, merkez başucu — o anın yıldızları, takımyıldız çizgileri ve gezegenleriyle. Bir sektöre dokun, teleskop olarak açılsın:

- **Kaydır ve iki parmakla yakınlaştır**, bir fotoğraf uygulamasındaki gibi. Dar alan daha sönük yıldızları hak ediyor: kadir sınırı 75°'de 4.2'den 6°'de 6.0'a kayıyor.
- **Yıldız çizimi** parlaklığı izliyor — B−V renk indisinden gelen renkli disk, kadirle büyüyen hâle ve en parlak birkaçında kırınım ışınları. Böylece geniş alan bir serpinti, dar alan gerçek bir mercek görüntüsü gibi okunuyor.
- **Canlı mod** nişanı telefonun pusula ve hareket sensörlerinden alıyor; telefonu kaldırdığında arkasında kalan gökyüzünü gösteriyor. Gerçek cihaz gerekiyor.
- **Zaman şeridi** tüm gökyüzünü ileri geri sürüklüyor; doğum dakikana, şimdiye ve bir sonraki doğum gününe atlama düğmeleriyle.
- **HUD** yükseklik, azimut, görüş alanı, kadir sınırı, yerel yıldız zamanı ve nişangâhın ortasında duran nesneyi yazıyor.

### Doğum gökyüzü

Doğduğun yerin üstünde, doğduğun dakikadaki gökyüzü: başucunda duran yıldız ve ışığının kat ettiği yol, doğuda yükselen takımyıldız, Ay'ın evresi ve burcu, o an yukarıda olan gezegenler ve gece olup olmadığı.

### Poster

Aynı gökyüzü, paylaşılabilir 1080×1920 bir görsel olarak: yıldız alanı, ufuk, adın, tarih ve koordinatlar.

### Aynı gökyüzü

İki profil yan yana: gökyüzlerinin yüzde kaçının örtüştüğü, her birinin başucu yıldızı ve aralarındaki açı, her biri için doğuda yükselen takımyıldız, gerçek evresiyle çizilmiş iki Ay, ve takımyıldızların ortak / yalnız sende / yalnız onda diye ayrılmış hâli. Her takımyıldız, bir ikon setinden seçilmiş değil, katalog çizgilerinden izdüşürülmüş kendi şeklini taşıyor.

## Gökyüzü nasıl hesaplanıyor

| Adım | Nerede | Ne oluyor |
| --- | --- | --- |
| Katalog | `src/sky/catalog.ts` | 6. kadire kadar 5044 yıldız, 215'i isimli, 88 takımyıldız ve 893 çizgi noktası. Her yıldızın ekvatoral birim vektörü yükleme anında bir kez hesaplanıyor. |
| Yıldız zamanı | `src/sky/math/time.ts` | Jülyen günü, ardından Greenwich ortalama yıldız zamanı artı boylam. |
| Ekvatoral → yatay | `src/sky/math/equatorial.ts` | Yerel yıldız zamanı ve enlemden kurulan tek bir döndürme, önceden hesaplanmış vektörlere uygulanıyor. Yükseklik, azimut ve yatay birim vektörünü döndürüyor. |
| Teleskop | `src/sky/scene/build.ts` | Gnomonik (teğet düzlem) izdüşüm: bakış yönü bir eksen takımına dönüşüyor ve her yıldız üç skaler çarpıma iniyor; teğet düzlemin arkasında kalanlar işaretle eleniyor. |
| Radar | `src/features/open-sky/radar` | Azimut-eşit uzaklık: yarıçap 90° − yükseklik ile doğrusal. |
| Güneş, Ay, gezegenler | `src/sky/ephemeris` | Gezegenler için tarihe göre çözülen Kepler öğeleri, Ay'ın konumu, evresi ve aydınlanması için düşük dereceli bir seri, ve burca indirgenmiş ekliptik boylam. |

## Teknoloji

React Native 0.83 üstünde Expo SDK 55, tüm 2B çizim için `@shopify/react-native-skia`, etkileşimler için Gesture Handler ve Reanimated, gözlemci konumu için `expo-location`, canlı mod için `expo-sensors` (DeviceMotion ve Magnetometer), poster paylaşımı için `expo-sharing`. Baştan sona TypeScript; `@/` takma adı `src`'ye bakıyor.

## Çalıştırma

```bash
npm install
npx expo start
```

iOS simülatörü için `i`, Android için `a`.

### Gerçek telefonda

```bash
npx expo start
```

QR kodunu aynı Wi-Fi ağındaki Expo Go (SDK 55) ile okut. Canlı modu yalnızca gerçek cihazda deneyebilirsin; simülatörde pusula yok. Hızı dürüstçe ölçmek için sunucuyu yayınlanmış bir yapı gibi başlat:

```bash
npx expo start --no-dev --minify
```

## Diller

İngilizce, Türkçe, Almanca ve İspanyolca; ana ekrandan değiştiriliyor. Takımyıldız, yıldız, gezegen ve burç isimleri dile göre katalogdan geliyor; tarih ve sayılar `Intl` üzerinden biçimleniyor.

## Katalogu yeniden üretmek

`assets/data/sky.json` (208 KB) [d3-celestial](https://github.com/ofrohn/d3-celestial) verilerinden üretiliyor. Onu bu projenin yanına klonlarsan betik kendisi buluyor:

```bash
git clone https://github.com/ofrohn/d3-celestial.git ../d3-celestial
npm run build:sky
```

Başka bir yerdeyse yolu açıkça ver:

```bash
CELESTIAL_DATA=/path/to/d3-celestial/data npm run build:sky
```

Paketi küçük tutmak için yıldızlar sıkışık demetler hâlinde saklanıyor: `[ra, dec, kadir, bv, ışıkYılı, isim, tanım]`.

## Klasör yapısı

```
src/
  sky/          katalog, matematik, efemeris, sahne izdüşümü, çıkarımlar
  features/     ana ekran, gökyüzünü aç, doğum gökyüzü, aynı gökyüzü, profil
  components/   mono metin, paneller, çizili glifler
  i18n/         en, tr, de, es dil tabloları
  profiles/     profil modeli, şehirler, örnek kişiler
  providers/    dil ve profil bağlamı
scripts/
  build-sky-data.js
assets/data/sky.json
```

## Performans notları

Ağır iş gökyüzü karesi: her yıldızın ve her takımyıldız çizgi noktasının tek bir an için yerleştirilmesi. Bugünkü kodu şu ölçümler şekillendirdi.

- **Kare 11.6 ms değil, 0.5 ms.** Her yıldızı `{ ...star, ...horizontal }` diye kurmak 5044 nesne için kare başına ~11 ms harcıyordu; alanları tek tek yazmak aynı işi 0.25 ms'ye, tüm kareyi 11.6 ms'den 0.52 ms'ye indirdi — masaüstü V8'de ölçüldü ve sonuçlar 1.65e-13 derece farkla aynı çıktı. Maliyet trigonometri değil, nesne yayılımıymış.
- **İzdüşüm vektör cebiri.** Yıldızlar yatay birim vektörlerini taşıyor; teleskop skaler çarpımlarla izdüşürüyor ve teğet düzlemin arkasında kalanları kare başına trigonometri yerine tek bir işaret testiyle atıyor.
- **Jestler JS thread'ini uyandırmıyor.** Kaydırma ve yakınlaştırma worklet olarak çalışıp çizili gökyüzünü UI thread'inde bir matrisle taşıyor; sahne yalnızca parmak kalkınca yeniden kuruluyor. Aynı gökyüzünün iki gnomonik görüntüsü arasındaki fark tam olarak projektif bir dönüşüm olduğundan bu bir yaklaşıklık değil: yeniden kurulmuş konumlarla 1e-13 piksel uyuşuyor, yani parmak kalktığında gökyüzü zıplamıyor. Sahne ekran kenarlarının ötesine taşacak şekilde kuruluyor ki sürükleme boşluk değil gerçek yıldız açsın.
- **Zaman şeridi etiketi gökyüzünden ayırıyor.** Tarih etiketi ve cetvel parmağı birebir izlerken gökyüzü karesi kısılmış bir değerle hesaplanıyor; böylece hızlı bir sürükleme arka arkaya onlarca tam gökyüzü hesabını kuyruğa almıyor.
- **HUD okuması kısılmış** (~100 ms) ve teleskop memoize edilmiş, yani nişan almak çevresindeki panelleri yeniden çizdirmiyor. Sürükleme sırasında rakamlar, yuvarlanmış dereceleri her değiştiğinde UI thread'inden besleniyor.

Döngüdeki en yavaş şey geliştirme kipi; geliştirme sunucusu bağlıyken Expo Go üstünden ölçülen hiçbir şey uygulamanın gerçek hızı değil.

## Kaynak

Yıldız ve takımyıldız verileri [d3-celestial](https://github.com/ofrohn/d3-celestial) projesinden (Hipparcos katalogu, IAU takımyıldız sınırları).
