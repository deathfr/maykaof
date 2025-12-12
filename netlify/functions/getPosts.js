import { getStore } from "@netlify/blobs";

export async function handler() {
  const store = getStore("posts");
  const data = await store.get("posts");

  return {
    statusCode: 200,
    body: data || "[]",
    headers: {
      "Content-Type": "application/json"
    }
  };
}
