import { RybbitClient } from "./src/rybbit-client.js";

async function main() {
  const client = new RybbitClient({
    baseUrl: "https://rybbit.intaqt.com",
    apiKey: "LNpJfcYVcGQAFkVdTlmhGtuuKpZPwpVoXxcIpHRZiMBuHdiatwcdVJSmTNZqlFtM"
  });

  try {
    const res = await client.getMetric("32f49c2c0562", {
      parameter: "pathname",
      start_date: "2026-06-18",
      end_date: "2026-06-18"
    });
    console.log("Success:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
