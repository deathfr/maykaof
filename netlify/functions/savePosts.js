import fs from "fs";
import path from "path";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const token = event.queryStringParameters?.token;
  if (token !== process.env.SAVE_TOKEN) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  try {
    const posts = JSON.parse(event.body);

    const filePath = path.join(process.cwd(), "posts.json");
    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
