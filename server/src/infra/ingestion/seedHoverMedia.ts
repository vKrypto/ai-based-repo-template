import "dotenv/config";
import { dbPool } from "../../shared/db/pool.js";
import { chooseHoverMedia } from "./hoverMedia.js";

async function main(): Promise<void> {
  const result = await dbPool.query<{ id: number }>(
    `SELECT pv.id
     FROM product_variant pv
     WHERE NOT EXISTS (SELECT 1 FROM product_image pi WHERE pi.variant_id = pv.id AND pi.position = 1)
     ORDER BY pv.id`
  );

  let imageCount = 0;
  let videoCount = 0;

  for (const variant of result.rows) {
    const hoverMedia = chooseHoverMedia(variant.id);
    if (!hoverMedia) {
      continue;
    }

    await dbPool.query(
      "INSERT INTO product_image (variant_id, url, position, media_type) VALUES ($1, $2, 1, $3)",
      [variant.id, hoverMedia.url, hoverMedia.mediaType]
    );

    if (hoverMedia.mediaType === "video") {
      videoCount += 1;
    } else {
      imageCount += 1;
    }
  }

  console.log(`assigned ${imageCount} hover images and ${videoCount} hover videos`);
  await dbPool.end();
}

main().catch((error: unknown) => {
  console.error("hover media seeding failed", error);
  process.exit(1);
});
