import { getStore } from "@netlify/blobs";

export async function handler() {
  try {
    const store = getStore("posts");
    const data = await store.get("posts");

    let posts = [];

    if (data) {
      try {
        posts = JSON.parse(data);
        if (!Array.isArray(posts)) posts = [];
      } catch {
        posts = [];
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(posts)
    };

  } catch (err) {
    return {
      statusCode: 200, // UWAGA: celowo 200
      headers: {
        "Content-Type": "application/json"
      },
      body: "[]"
    };
  }
}
