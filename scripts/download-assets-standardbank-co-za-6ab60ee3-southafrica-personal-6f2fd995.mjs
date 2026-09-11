import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "public/sites/standardbank-co-za-6ab60ee3/southafrica-personal-6f2fd995/images");
const shared = join(root, "public/sites/standardbank-co-za-6ab60ee3/shared");

const files = [
  [join(shared, "favicon.ico"), "https://www.standardbank.co.za/static_file/assets/favicons/favicon.ico"],
  [join(shared, "favicon-32.png"), "https://www.standardbank.co.za/static_file/assets/favicons/favicon-32x32.png"],
  [join(shared, "sa-flag.png"), "https://www.standardbank.co.za/static_file/assets/components/country-selector/south-africa.png"],
  [join(shared, "app.png"), "https://www.standardbank.co.za/static_file/Resources/img/app.png"],
  [join(dest, "hero-mtn8.jpg"), "https://www.standardbank.co.za/static_file/SBG/Assets/Img/SA/Personal/Home%20page%20banner%20images/MTN8_Landscape_lw_h%20800x450.jpg"],
  [join(dest, "hero-samsung.jpg"), "https://www.standardbank.co.za/static_file/SBG/Assets/Img/SA/Home%20page/SAMSUNG-Banners-to-size-800x450-D.jpg"],
  [join(dest, "hero-life.jpg"), "https://www.standardbank.co.za/static_file/SBG/Assets/Img/SA/Home%20page/5869%20STD%20Image%20Resize%20Flexi%20Life%20Plan%20Website%20800%20x%20450.jpg"],
  [join(dest, "hero-lotto.jpg"), "https://www.standardbank.co.za/static_file/SBG/Assets/Img/SA/Personal/Lotto_banners_800x450.jpg"],
  [join(dest, "hero-safeguard.jpg"), "https://www.standardbank.co.za/static_file/SBG/Assets/Img/SA/Security%20Centre/5662_SB_Guard_800x450.jpg"],
  [join(dest, "card-everyday.jpg"), "https://www.standardbank.co.za/static_file/SBG/Assets/Img/SA/Home%20page/Everyday_banking_Landscape_SW_520x240.jpg"],
  [join(dest, "card-learn.jpg"), "https://www.standardbank.co.za/static_file/SBG/Assets/Img/SA/Learn/97563903_Landscape_sw.jpg"],
  [join(dest, "card-youth.jpg"), "https://www.standardbank.co.za/static_file/SBG/Assets/Img/SA/Personal%20Banking/Mymo_19758_ChinaAfrica_Landscape_SW_520x240.jpg"],
  [join(dest, "card-private.jpg"), "https://www.standardbank.co.za/static_file/SBG/Assets/Img/SA/Home%20page/Tablet-520x240-Private-Ban.jpg"],
  [join(dest, "card-over55.jpg"), "https://www.standardbank.co.za/static_file/SBG/Assets/Img/SA/Home%20page/over55_520x240.jpg"],
  [join(dest, "banner-trusted.jpg"), "https://www.standardbank.co.za/static_file/SBG/Assets/Img/SA/Security%20Centre/Trusted%20Person/Trusted_Persons_2192217105_Landscape_600x300.jpg"],
  [join(dest, "banner-ucount.jpg"), "https://www.standardbank.co.za/static_file/SBG/Assets/Img/SA/UCount/UC-shield-banners2.jpg"],
];

async function fetchOne(path, url) {
  await mkdir(dirname(path), { recursive: true });
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 StandardBankDemoClone" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await writeFile(path, Buffer.from(await res.arrayBuffer()));
  console.log("ok", path.split("/").slice(-2).join("/"));
}

const queue = [...files];
async function worker() {
  while (queue.length) {
    const item = queue.shift();
    if (!item) return;
    try {
      await fetchOne(item[0], item[1]);
    } catch (err) {
      console.error("fail", item[1], err.message);
    }
  }
}

await Promise.all([worker(), worker(), worker(), worker()]);
