import { getStore } from "@netlify/blobs";

export async function handler(event) {
  try {
    const token = event.queryStringParameters?.token;
    if (token !== process.env.ADMIN_TOKEN) {
      return {
        statusCode: 401,
        body: "Unauthorized"
      };
    }

    const store = getStore("posts");
    const body = JSON.parse(event.body);

    // zapisujemy CAŁE posty jako jeden JSON
    await store.set("posts", JSON.stringify(body));

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: err.toString()
    };
  }
}
