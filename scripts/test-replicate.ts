import "dotenv/config";
import { ReplicateProvider } from "../src/providers/image/ReplicateProvider";

async function main() {
  console.log("🎨 ReplicateProvider 테스트 시작...\n");

  const provider = new ReplicateProvider();

  const result = await provider.generate({
    prompt:
      "pixel art RPG game character, warrior with sword, 8-bit retro style, transparent background, front facing, full body",
    width: 512,
    height: 512,
  });

  console.log("✅ 생성 완료!");
  console.log("  Provider:", result.providerUsed);
  console.log("  Model   :", result.modelUsed);
  console.log("  URL     :", result.url);
}

main().catch((err) => {
  console.error("❌ 실패:", err.message);
  process.exit(1);
});
