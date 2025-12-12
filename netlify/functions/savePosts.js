import { getStore } from "@netlify/blobs";

export async function handler(event) {
  try {
    // --- AUTH ---
    const token = event.queryStringParameters?.token;
    if (token !== process.env.ADMIN_TOKEN) {
      return {
        statusCode: 401,
        body: "Unauthorized"
      };
    }

    // --- PARSE BODY (NAJWAŻNIEJSZE) ---
    if (!event.body) {
      return {
        statusCode: 400,
        body: "No body"
      };
    }

    let posts;
    try {
      posts = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        body: "Invalid JSON"
      };
    }

    if (!Array.isArray(posts)) {
      return {
        statusCode: 400,
        body: "Posts must be array"
      };
    }

    // --- SAVE TO BLOBS ---
    const store = getStore("posts");
    await store.set("posts", JSON.stringify(posts));

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: err.message || err.toString()
    };
  }
}
