export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
];

const SUPPORTED_CODES = new Set(SUPPORTED_LANGUAGES.map((l) => l.code));

const ENGLISH_DEFAULT_COUNTRIES = new Set([
  'IN', 'BD', 'PK', 'NP', 'LK',
  'NG', 'KE', 'GH', 'UG', 'TZ', 'ZA',
  'AE', 'SA', 'QA', 'KW', 'OM',
  'MY', 'PH', 'SG'
]);

const COUNTRY_TO_DEFAULT_LANGUAGE: Record<string, string> = {
  US: 'en',
  CA: 'en',
  GB: 'en',
  AU: 'en',
  NZ: 'en',
  IE: 'en',
  IN: 'en',
  BD: 'en',
  PK: 'en',
  NP: 'en',
  LK: 'en',
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CO: 'es',
  CL: 'es',
  FR: 'fr',
  DE: 'de',
  IT: 'it',
  BR: 'pt',
  PT: 'pt',
  JP: 'ja',
  KR: 'ko',
  AE: 'en',
  SA: 'en',
  QA: 'en',
  KW: 'en',
  TR: 'tr',
};

export function normalizeLanguageCode(raw?: string | null): string {
  if (!raw) return 'en';
  const base = raw.toLowerCase().split('-')[0].trim();
  return SUPPORTED_CODES.has(base) ? base : 'en';
}

export function languageForCountry(countryCode?: string | null): string {
  if (!countryCode) return 'en';
  const country = countryCode.toUpperCase();
  if (ENGLISH_DEFAULT_COUNTRIES.has(country)) return 'en';
  return normalizeLanguageCode(COUNTRY_TO_DEFAULT_LANGUAGE[country] ?? 'en');
}

export function detectPreferredLanguage(
  browserLanguages: readonly string[] = [],
  countryCode?: string | null,
): string {
  if (countryCode) {
    const country = countryCode.toUpperCase();
    if (ENGLISH_DEFAULT_COUNTRIES.has(country)) return 'en';
  }

  for (const lang of browserLanguages) {
    const normalized = normalizeLanguageCode(lang);
    if (SUPPORTED_CODES.has(normalized)) return normalized;
  }

  return languageForCountry(countryCode);
}

export function looksLikeEnglishText(text: string): boolean {
  if (!text) return true;
  const letters = text.match(/[A-Za-z]/g)?.length ?? 0;
  const nonLatin = text.match(/[^\x00-\x7F]/g)?.length ?? 0;
  return letters >= nonLatin;
}

export function inferSourceLanguage(text: string): string {
  if (!text.trim()) return 'en';
  if (/\p{Script=Arabic}/u.test(text)) return 'ar';
  if (/\p{Script=Bengali}/u.test(text)) return 'bn';
  if (/\p{Script=Devanagari}/u.test(text)) return 'hi';
  if (/\p{Script=Hangul}/u.test(text)) return 'ko';
  if (/\p{Script=Hiragana}|\p{Script=Katakana}/u.test(text)) return 'ja';
  return looksLikeEnglishText(text) ? 'en' : 'en';
}

export const UI_DICTIONARY: Record<string, Partial<Record<string, string>>> = {
  explore: { en: 'Explore', es: 'Explorar', fr: 'Explorer', de: 'Entdecken', it: 'Esplora', pt: 'Explorar', ja: '探す', ko: '탐색', ar: 'استكشاف', hi: 'खोजें', bn: 'অনুসন্ধান', tr: 'Keşfet' },
  allProducts: { en: 'All Products', es: 'Todos los productos', fr: 'Tous les produits', de: 'Alle Produkte', it: 'Tutti i prodotti', pt: 'Todos os produtos', ja: 'すべての商品', ko: '모든 제품', ar: 'كل المنتجات', hi: 'सभी उत्पाद', bn: 'সব পণ্য', tr: 'Tüm ürünler' },
  digitalProducts: { en: 'Digital Products', es: 'Productos digitales', fr: 'Produits numériques', de: 'Digitale Produkte', it: 'Prodotti digitali', pt: 'Produtos digitais', ja: 'デジタル商品', ko: '디지털 제품', ar: 'منتجات رقمية', hi: 'डिजिटल उत्पाद', bn: 'ডিজিটাল পণ্য', tr: 'Dijital ürünler' },
  onlineCourses: { en: 'Online Courses', es: 'Cursos en línea', fr: 'Cours en ligne', de: 'Online-Kurse', it: 'Corsi online', pt: 'Cursos online', ja: 'オンラインコース', ko: '온라인 강좌', ar: 'دورات عبر الإنترنت', hi: 'ऑनलाइन कोर्स', bn: 'অনলাইন কোর্স', tr: 'Online kurslar' },
  courses: { en: 'Courses', es: 'Cursos', fr: 'Cours', de: 'Kurse', it: 'Corsi', pt: 'Cursos', ja: 'コース', ko: '강좌', ar: 'دورات', hi: 'कोर्स', bn: 'কোর্স', tr: 'Kurslar' },
  services: { en: 'Services', es: 'Servicios', fr: 'Services', de: 'Dienstleistungen', it: 'Servizi', pt: 'Serviços', ja: 'サービス', ko: '서비스', ar: 'خدمات', hi: 'सेवाएं', bn: 'সেবা', tr: 'Hizmetler' },
  consultations: { en: 'Consultations', es: 'Consultorías', fr: 'Consultations', de: 'Beratung', it: 'Consulenze', pt: 'Consultorias', ja: '相談', ko: '상담', ar: 'استشارات', hi: 'परामर्श', bn: 'পরামর্শ', tr: 'Danışmanlık' },
  orders: { en: 'Orders', es: 'Pedidos', fr: 'Commandes', de: 'Bestellungen', it: 'Ordini', pt: 'Pedidos', ja: '注文', ko: '주문', ar: 'الطلبات', hi: 'ऑर्डर', bn: 'অর্ডার', tr: 'Siparişler' },
  marketplace: { en: 'Marketplace', es: 'Mercado', fr: 'Marché', de: 'Marktplatz', it: 'Marketplace', pt: 'Marketplace', ja: 'マーケット', ko: '마켓플레이스', ar: 'السوق', hi: 'मार्केटप्लेस', bn: 'মার্কেটপ্লেস', tr: 'Pazar Yeri' },
  marketplaceDescription: { en: 'The premier marketplace for digital creators. Sell products, courses, services, and consultations all in one place.', es: 'El principal mercado para creadores digitales. Vende productos, cursos, servicios y consultorías en un solo lugar.', fr: 'La place de marché de référence pour les créateurs numériques. Vendez des produits, des cours, des services et des consultations au même endroit.', de: 'Der führende Marktplatz für digitale Creator. Verkaufen Sie Produkte, Kurse, Dienstleistungen und Beratungen an einem Ort.', it: 'Il marketplace principale per creatori digitali. Vendi prodotti, corsi, servizi e consulenze in un unico posto.', pt: 'O principal marketplace para criadores digitais. Venda produtos, cursos, serviços e consultorias em um só lugar.', ja: 'デジタルクリエイター向けの主要マーケットプレイス。商品、コース、サービス、相談を1か所で販売できます。', ko: '디지털 크리에이터를 위한 대표 마켓플레이스입니다. 제품, 강의, 서비스, 컨설팅을 한곳에서 판매하세요.', ar: 'السوق الرائد للمبدعين الرقميين. بع المنتجات والدورات والخدمات والاستشارات في مكان واحد.', hi: 'डिजिटल क्रिएटर्स के लिए प्रमुख मार्केटप्लेस। उत्पाद, कोर्स, सेवाएं और परामर्श सब कुछ एक ही जगह बेचें।', bn: 'ডিজিটাল ক্রিয়েটরদের জন্য সেরা মার্কেটপ্লেস। এক জায়গায় পণ্য, কোর্স, সেবা ও পরামর্শ বিক্রি করুন।', tr: 'Dijital üreticiler için önde gelen pazar yeri. Ürün, kurs, hizmet ve danışmanlığı tek yerde satın.' },
  forCreators: { en: 'For Creators', es: 'Para creadores', fr: 'Pour les créateurs', de: 'Für Ersteller', it: 'Per i creatori', pt: 'Para criadores', ja: 'クリエイター向け', ko: '크리에이터용', ar: 'للمبدعين', hi: 'क्रिएटर्स के लिए', bn: 'ক্রিয়েটরদের জন্য', tr: 'Üreticiler için' },
  startSelling: { en: 'Start Selling', es: 'Empieza a vender', fr: 'Commencer à vendre', de: 'Jetzt verkaufen', it: 'Inizia a vendere', pt: 'Comece a vender', ja: '販売を始める', ko: '판매 시작', ar: 'ابدأ البيع', hi: 'बेचना शुरू करें', bn: 'বিক্রি শুরু করুন', tr: 'Satışa başla' },
  creatorDashboard: { en: 'Creator Dashboard', es: 'Panel de creador', fr: 'Tableau de bord créateur', de: 'Creator-Dashboard', it: 'Dashboard creatore', pt: 'Painel do criador', ja: 'クリエイターダッシュボード', ko: '크리에이터 대시보드', ar: 'لوحة المبدع', hi: 'क्रिएटर डैशबोर्ड', bn: 'ক্রিয়েটর ড্যাশবোর্ড', tr: 'Üretici paneli' },
  successStories: { en: 'Success Stories', es: 'Historias de éxito', fr: 'Histoires de réussite', de: 'Erfolgsgeschichten', it: 'Storie di successo', pt: 'Histórias de sucesso', ja: '成功事例', ko: '성공 사례', ar: 'قصص النجاح', hi: 'सफलता की कहानियां', bn: 'সাফল্যের গল্প', tr: 'Başarı hikayeleri' },
  creatorCommunity: { en: 'Creator Community', es: 'Comunidad de creadores', fr: 'Communauté des créateurs', de: 'Creator-Community', it: 'Community dei creatori', pt: 'Comunidade de criadores', ja: 'クリエイターコミュニティ', ko: '크리에이터 커뮤니티', ar: 'مجتمع المبدعين', hi: 'क्रिएटर समुदाय', bn: 'ক্রিয়েটর কমিউনিটি', tr: 'Üretici topluluğu' },
  stayUpdated: { en: 'Stay Updated', es: 'Mantente al día', fr: 'Restez informé', de: 'Bleiben Sie auf dem Laufenden', it: 'Rimani aggiornato', pt: 'Fique atualizado', ja: '最新情報を受け取る', ko: '최신 소식 받기', ar: 'ابقَ على اطلاع', hi: 'अपडेट रहें', bn: 'আপডেট থাকুন', tr: 'Güncel kalın' },
  newsletterDescription: { en: 'Subscribe to our newsletter for the latest updates and creator tips.', es: 'Suscríbete a nuestro boletín para recibir las últimas novedades y consejos para creadores.', fr: 'Abonnez-vous à notre newsletter pour recevoir les dernières mises à jour et des conseils pour créateurs.', de: 'Abonnieren Sie unseren Newsletter für aktuelle Neuigkeiten und Tipps für Creator.', it: 'Iscriviti alla nostra newsletter per ricevere gli ultimi aggiornamenti e consigli per creator.', pt: 'Assine nossa newsletter para receber as últimas atualizações e dicas para criadores.', ja: '最新情報やクリエイター向けのヒントを受け取るには、ニュースレターを購読してください。', ko: '최신 업데이트와 크리에이터 팁을 받으려면 뉴스레터를 구독하세요.', ar: 'اشترك في نشرتنا الإخبارية للحصول على أحدث التحديثات ونصائح المبدعين.', hi: 'नवीनतम अपडेट और क्रिएटर टिप्स के लिए हमारे न्यूज़लेटर को सब्सक्राइब करें।', bn: 'সর্বশেষ আপডেট ও ক্রিয়েটর টিপস পেতে আমাদের নিউজলেটারে সাবস্ক্রাইব করুন।', tr: 'En son güncellemeler ve üretici ipuçları için bültenimize abone olun.' },
  enterYourEmail: { en: 'Enter your email', es: 'Ingresa tu correo', fr: 'Entrez votre e-mail', de: 'E-Mail eingeben', it: 'Inserisci la tua e-mail', pt: 'Digite seu e-mail', ja: 'メールアドレスを入力', ko: '이메일 입력', ar: 'أدخل بريدك الإلكتروني', hi: 'अपना ईमेल दर्ज करें', bn: 'আপনার ইমেইল লিখুন', tr: 'E-postanızı girin' },
  subscribe: { en: 'Subscribe', es: 'Suscribirse', fr: 'S’abonner', de: 'Abonnieren', it: 'Iscriviti', pt: 'Inscrever-se', ja: '購読する', ko: '구독하기', ar: 'اشترك', hi: 'सदस्यता लें', bn: 'সাবস্ক্রাইব করুন', tr: 'Abone ol' },
  allRightsReserved: { en: 'All rights reserved.', es: 'Todos los derechos reservados.', fr: 'Tous droits réservés.', de: 'Alle Rechte vorbehalten.', it: 'Tutti i diritti riservati.', pt: 'Todos os direitos reservados.', ja: 'All rights reserved.', ko: 'All rights reserved.', ar: 'جميع الحقوق محفوظة.', hi: 'सर्वाधिकार सुरक्षित।', bn: 'সর্বস্বত্ব সংরক্ষিত।', tr: 'Tüm hakları saklıdır.' },
  privacyPolicy: { en: 'Privacy Policy', es: 'Política de privacidad', fr: 'Politique de confidentialité', de: 'Datenschutzerklärung', it: 'Informativa sulla privacy', pt: 'Política de privacidade', ja: 'プライバシーポリシー', ko: '개인정보 처리방침', ar: 'سياسة الخصوصية', hi: 'गोपनीयता नीति', bn: 'গোপনীয়তা নীতি', tr: 'Gizlilik Politikası' },
  termsOfService: { en: 'Terms of Service', es: 'Términos del servicio', fr: 'Conditions d’utilisation', de: 'Nutzungsbedingungen', it: 'Termini di servizio', pt: 'Termos de serviço', ja: '利用規約', ko: '서비스 약관', ar: 'شروط الخدمة', hi: 'सेवा की शर्तें', bn: 'সেবার শর্তাবলী', tr: 'Hizmet Şartları' },
  cookieSettings: { en: 'Cookie Settings', es: 'Configuración de cookies', fr: 'Paramètres des cookies', de: 'Cookie-Einstellungen', it: 'Impostazioni cookie', pt: 'Configurações de cookies', ja: 'Cookie設定', ko: '쿠키 설정', ar: 'إعدادات ملفات تعريف الارتباط', hi: 'कुकी सेटिंग्स', bn: 'কুকি সেটিংস', tr: 'Cerez ayarlari' },
  sitemap: { en: 'Sitemap', es: 'Mapa del sitio', fr: 'Plan du site', de: 'Sitemap', it: 'Mappa del sito', pt: 'Mapa do site', ja: 'サイトマップ', ko: '사이트맵', ar: 'خريطة الموقع', hi: 'साइटमैप', bn: 'সাইটম্যাপ', tr: 'Site haritasi' },
  budget: { en: 'Budget', es: 'Presupuesto', fr: 'Budget', de: 'Budget', it: 'Budget', pt: 'Orçamento', ja: '予算', ko: '예산', ar: 'الميزانية', hi: 'बजट', bn: 'বাজেট', tr: 'Butce' },
  under50: { en: 'Under $50', es: 'Menos de $50', fr: 'Moins de 50 $', de: 'Unter 50 $', it: 'Sotto i 50 $', pt: 'Menos de $50', ja: '$50未満', ko: '$50 미만', ar: 'أقل من 50 دولارا', hi: '$50 से कम', bn: '$50 এর নিচে', tr: '$50 alti' },
  deliveryTime: { en: 'Delivery Time', es: 'Tiempo de entrega', fr: 'Delai de livraison', de: 'Lieferzeit', it: 'Tempo di consegna', pt: 'Prazo de entrega', ja: '納期', ko: '배송 시간', ar: 'وقت التسليم', hi: 'डिलीवरी समय', bn: 'ডেলিভারি সময়', tr: 'Teslimat suresi' },
  upTo24Hours: { en: 'Up to 24 hours', es: 'Hasta 24 horas', fr: 'Jusqu a 24 heures', de: 'Bis zu 24 Stunden', it: 'Fino a 24 ore', pt: 'Ate 24 horas', ja: '24時間以内', ko: '24시간 이내', ar: 'حتى 24 ساعة', hi: '24 घंटे तक', bn: '২৪ ঘণ্টা পর্যন্ত', tr: '24 saate kadar' },
  upTo3Days: { en: 'Up to 3 days', es: 'Hasta 3 dias', fr: 'Jusqu a 3 jours', de: 'Bis zu 3 Tagen', it: 'Fino a 3 giorni', pt: 'Ate 3 dias', ja: '3日以内', ko: '3일 이내', ar: 'حتى 3 أيام', hi: '3 दिन तक', bn: '৩ দিন পর্যন্ত', tr: '3 gune kadar' },
  upTo7Days: { en: 'Up to 7 days', es: 'Hasta 7 dias', fr: 'Jusqu a 7 jours', de: 'Bis zu 7 Tagen', it: 'Fino a 7 giorni', pt: 'Ate 7 dias', ja: '7日以内', ko: '7일 이내', ar: 'حتى 7 أيام', hi: '7 दिन तक', bn: '৭ দিন পর্যন্ত', tr: '7 gune kadar' },
  upTo14Days: { en: 'Up to 14 days', es: 'Hasta 14 dias', fr: 'Jusqu a 14 jours', de: 'Bis zu 14 Tagen', it: 'Fino a 14 giorni', pt: 'Ate 14 dias', ja: '14日以内', ko: '14일 이내', ar: 'حتى 14 يوما', hi: '14 दिन तक', bn: '১৪ দিন পর্যন্ত', tr: '14 gune kadar' },
  mostPopular: { en: 'Most Popular', es: 'Mas popular', fr: 'Le plus populaire', de: 'Am beliebtesten', it: 'Piu popolare', pt: 'Mais popular', ja: '人気順', ko: '인기순', ar: 'الأكثر شعبية', hi: 'सबसे लोकप्रिय', bn: 'সর্বাধিক জনপ্রিয়', tr: 'En populer' },
  bestRating: { en: 'Best Rating', es: 'Mejor valoracion', fr: 'Meilleure note', de: 'Beste Bewertung', it: 'Migliore valutazione', pt: 'Melhor avaliacao', ja: '高評価順', ko: '평점순', ar: 'الأعلى تقييما', hi: 'सर्वश्रेष्ठ रेटिंग', bn: 'সেরা রেটিং', tr: 'En iyi puan' },
  priceLowToHigh: { en: 'Price: Low to High', es: 'Precio: de menor a mayor', fr: 'Prix : croissant', de: 'Preis: aufsteigend', it: 'Prezzo: dal piu basso al piu alto', pt: 'Preco: do menor para o maior', ja: '価格: 安い順', ko: '가격: 낮은 순', ar: 'السعر: من الأقل إلى الأعلى', hi: 'कीमत: कम से ज्यादा', bn: 'দাম: কম থেকে বেশি', tr: 'Fiyat: dusukten yuksege' },
  priceHighToLow: { en: 'Price: High to Low', es: 'Precio: de mayor a menor', fr: 'Prix : decroissant', de: 'Preis: absteigend', it: 'Prezzo: dal piu alto al piu basso', pt: 'Preco: do maior para o menor', ja: '価格: 高い順', ko: '가격: 높은 순', ar: 'السعر: من الأعلى إلى الأقل', hi: 'कीमत: ज्यादा से कम', bn: 'দাম: বেশি থেকে কম', tr: 'Fiyat: yuksekten dusuge' },
  newest: { en: 'Newest', es: 'Mas reciente', fr: 'Plus recent', de: 'Neueste', it: 'Piu recente', pt: 'Mais recente', ja: '新着順', ko: '최신순', ar: 'الأحدث', hi: 'नवीनतम', bn: 'সর্বশেষ', tr: 'En yeni' },
  clear: { en: 'Clear', es: 'Limpiar', fr: 'Effacer', de: 'Loschen', it: 'Cancella', pt: 'Limpar', ja: 'クリア', ko: '지우기', ar: 'مسح', hi: 'साफ करें', bn: 'মুছুন', tr: 'Temizle' },
  adjustFiltersOrSearch: { en: 'Try adjusting your filters or search term', es: 'Intenta ajustar tus filtros o termino de busqueda', fr: 'Essayez dajuster vos filtres ou votre recherche', de: 'Passen Sie Ihre Filter oder Suchbegriffe an', it: 'Prova a modificare i filtri o il termine di ricerca', pt: 'Tente ajustar seus filtros ou termo de busca', ja: 'フィルターや検索語を調整してみてください', ko: '필터나 검색어를 조정해 보세요', ar: 'حاول تعديل عوامل التصفية أو عبارة البحث', hi: 'अपने फिल्टर या खोज शब्द बदलकर देखें', bn: 'ফিল্টার বা সার্চ টার্ম পরিবর্তন করে দেখুন', tr: 'Filtrelerinizi veya arama teriminizi ayarlamayi deneyin' },
  clearFilters: { en: 'Clear Filters', es: 'Limpiar filtros', fr: 'Effacer les filtres', de: 'Filter loschen', it: 'Cancella filtri', pt: 'Limpar filtros', ja: 'フィルターをクリア', ko: '필터 지우기', ar: 'مسح عوامل التصفية', hi: 'फिल्टर साफ करें', bn: 'ফিল্টার মুছুন', tr: 'Filtreleri temizle' },
  browseAllOfferings: { en: 'Browse All Offerings', es: 'Ver todas las ofertas', fr: 'Parcourir toutes les offres', de: 'Alle Angebote durchsuchen', it: 'Sfoglia tutte le offerte', pt: 'Ver todas as ofertas', ja: 'すべての提供を表示', ko: '모든 제공 보기', ar: 'تصفح كل العروض', hi: 'सभी ऑफर देखें', bn: 'সব অফার দেখুন', tr: 'Tum tekliflere goz at' },
  browseAllTags: { en: 'Browse All Tags', es: 'Ver todas las etiquetas', fr: 'Parcourir tous les tags', de: 'Alle Tags durchsuchen', it: 'Sfoglia tutti i tag', pt: 'Ver todas as tags', ja: 'すべてのタグを見る', ko: '모든 태그 보기', ar: 'تصفح كل العلامات', hi: 'सभी टैग देखें', bn: 'সব ট্যাগ দেখুন', tr: 'Tum etiketlere goz at' },
  allServices: { en: 'All Services', es: 'Todos los servicios', fr: 'Tous les services', de: 'Alle Dienstleistungen', it: 'Tutti i servizi', pt: 'Todos os servicos', ja: 'すべてのサービス', ko: '모든 서비스', ar: 'كل الخدمات', hi: 'सभी सेवाएं', bn: 'সব সেবা', tr: 'Tum hizmetler' },
  selectCurrency: { en: 'Select Currency', es: 'Seleccionar moneda', fr: 'Choisir la devise', de: 'Währung wählen', it: 'Seleziona valuta', pt: 'Selecionar moeda', ja: '通貨を選択', ko: '통화 선택', ar: 'اختر العملة', hi: 'मुद्रा चुनें', bn: 'মুদ্রা নির্বাচন', tr: 'Para birimi seç' },
  selectLanguage: { en: 'Select Language', es: 'Seleccionar idioma', fr: 'Choisir la langue', de: 'Sprache wählen', it: 'Seleziona lingua', pt: 'Selecionar idioma', ja: '言語を選択', ko: '언어 선택', ar: 'اختر اللغة', hi: 'भाषा चुनें', bn: 'ভাষা নির্বাচন', tr: 'Dil seç' },
  translatedFrom: { en: 'Translated from', es: 'Traducido del', fr: 'Traduit de', de: 'Übersetzt aus', it: 'Tradotto da', pt: 'Traduzido de', ja: '翻訳元', ko: '번역 원문', ar: 'مترجم من', hi: 'अनुवादित', bn: 'অনুবাদিত', tr: 'Şuradan çevrildi' },
  automaticTranslation: { en: 'Automatic translation', es: 'Traducción automática', fr: 'Traduction automatique', de: 'Automatische Übersetzung', it: 'Traduzione automatica', pt: 'Tradução automática', ja: '自動翻訳', ko: '자동 번역', ar: 'ترجمة تلقائية', hi: 'स्वचालित अनुवाद', bn: 'স্বয়ংক্রিয় অনুবাদ', tr: 'Otomatik çeviri' },
  viewOriginal: { en: 'View original', es: 'Ver original', fr: 'Voir l’original', de: 'Original anzeigen', it: 'Vedi originale', pt: 'Ver original', ja: '原文を見る', ko: '원문 보기', ar: 'عرض الأصل', hi: 'मूल देखें', bn: 'মূল দেখুন', tr: 'Orijinali göster' },
  viewTranslation: { en: 'View translation', es: 'Ver traducción', fr: 'Voir la traduction', de: 'Übersetzung anzeigen', it: 'Vedi traduzione', pt: 'Ver tradução', ja: '翻訳を見る', ko: '번역 보기', ar: 'عرض الترجمة', hi: 'अनुवाद देखें', bn: 'অনুবাদ দেখুন', tr: 'Çeviriyi göster' },
  noImage: { en: 'No image', es: 'Sin imagen', fr: 'Pas d’image', de: 'Kein Bild', it: 'Nessuna immagine', pt: 'Sem imagem', ja: '画像なし', ko: '이미지 없음', ar: 'لا توجد صورة', hi: 'कोई छवि नहीं', bn: 'কোনো ছবি নেই', tr: 'Görsel yok' },
  from: { en: 'From', es: 'Desde', fr: 'À partir de', de: 'Ab', it: 'Da', pt: 'A partir de', ja: 'から', ko: '부터', ar: 'من', hi: 'से', bn: 'থেকে', tr: 'Başlangıç' },
};

export function translateUiKey(language: string, key: string, fallback?: string): string {
  const row = UI_DICTIONARY[key];
  if (!row) return fallback ?? key;
  return row[language] ?? row.en ?? fallback ?? key;
}
