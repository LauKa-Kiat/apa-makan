// One entry per mall. `name` is the canonical name used when a new row is
// inserted. `match` finds the existing row in `places`, whatever it was
// called when it was first added by hand.
import * as cheerio from "cheerio";
import { getJson, getText } from "./http.mjs";

/** @typedef {{ key: string, name: string, match: RegExp, url: string, skip?: string, scrape: () => Promise<string[]> }} Source */

/** @type {Source[]} */
export const sources = [
  {
    key: "mid-valley",
    name: "Mid Valley Megamall",
    match: /^(?!.*garden).*mid\s*valley/i,
    url: "https://www.midvalley.com.my/food/directory/",
    async scrape() {
      const $ = cheerio.load(await getText(this.url));
      return $('.module-directory a[href*="/tenant/"][href$="/EAT"]')
        .map((_, a) => $(a).text())
        .get();
    },
  },
  {
    key: "sunway-pyramid",
    name: "Sunway Pyramid",
    match: /sunway\s*pyramid/i,
    url: "https://www.sunwaypyramid.com/directory?refcode=FOOD_BEVERAGES",
    async scrape() {
      const api =
        "https://www.sunwaypyramid.com/api/directory/live/v1/public/shops/list-paged";
      const limit = 100;
      const names = [];
      for (let offset = 0; ; offset += limit) {
        const page = await getJson(
          `${api}?offset=${offset}&limit=${limit}&refcode=FOOD_BEVERAGES`,
        );
        names.push(...page.docs.map((d) => d.title));
        if (page.docs.length < limit || names.length >= page.total) break;
      }
      return names;
    },
  },
  {
    key: "pavilion-kl",
    name: "Pavilion Kuala Lumpur",
    match: /pavilion(?!.*(bukit|jalil|damansara))/i,
    url: "https://www.pavilion-kl.com/dine/",
    async scrape() {
      const $ = cheerio.load(await getText(this.url));
      return $('a[href*="pavilion-kl.com/store/"]')
        .map((_, a) => $(a).text())
        .get();
    },
  },
  {
    key: "ioi-city-mall",
    name: "IOI City Mall",
    match: /ioi\s*city/i,
    url: "https://www.ioicitymall.com.my/directory-icm/?mallcategory=foodnbeverage",
    async scrape() {
      const base =
        "https://www.ioicitymall.com.my/script/?html&osp=305&type=osp&mallcategory=foodnbeverage&malltagging=&catid=36&page=";
      const names = [];
      for (let page = 0; page < 100; page++) {
        const html = await getText(base + page);
        if (!html.trim()) break;
        const $ = cheerio.load(html);
        const found = $(".thumb-info-inner")
          .map((_, el) => $(el).text())
          .get();
        if (found.length === 0) break;
        names.push(...found);
      }
      return names;
    },
  },
  {
    key: "1-utama",
    name: "1 Utama Shopping Centre",
    match: /(1|one)\s*utama/i,
    url: "https://www.1utama.com.my/mall-shop/?storeCat=restaurants",
    // The directory sits behind a Cloudflare bot check. We don't try to get
    // past it, so this row is left as it is. Update it by hand.
    skip: "directory is behind a Cloudflare bot check",
    async scrape() {
      return [];
    },
  },
];
