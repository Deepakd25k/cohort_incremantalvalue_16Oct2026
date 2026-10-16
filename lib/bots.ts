// Crawlers, link previews and automation tools. They must never count as visitors.
const BOT_UA =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|gtmetrix|preview|facebookexternalhit|meta-externalagent|whatsapp|telegram|discord|skype|vercel|python|curl|wget|httpclient|phantom|puppeteer|playwright|selenium/i;

export const isBot = (ua: string | null) => !ua || BOT_UA.test(ua);
