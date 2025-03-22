// app/routes/webhooks/app.uninstalled.tsx
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { shopify } from "../shopify.server";
import { data } from "@remix-run/node"
import db from "../db.server";

export const loader: LoaderFunction = async ({ request }) => {
    //This endpoint is a POST request, we should never use a GET. This prevents shopify loading the page.
    return data(JSON.stringify({error: "Method not allowed"}), {status: 405, headers: {'Content-Type': 'application/json'}});
};

export const action: ActionFunction = async ({ request, context }) => {
  const { topic, shop } = await shopify(context).authenticate.webhook(request);

  switch (topic) {
    case "APP_UNINSTALLED":
      try {
        // Delete the client's Voiceflow API key from the database
        await db(context.cloudflare.env.DATABASE_URL).client.deleteMany({ where: { shopDomain: shop } });

        // We might also want to perform other cleanup tasks here,
        // such as deleting any stored session data etc.

        console.log(`App uninstalled by ${shop}.  Client data deleted.`);
        return data(null, { status: 200 });
      } catch (error: any) {
        console.error(`Error handling APP_UNINSTALLED webhook for ${shop}:`, error);
        return data(JSON.stringify({ error: "Failed to process uninstall webhook" }), {
          status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
        });
      }
    default:
      console.warn(`Unhandled webhook topic: ${topic}`);
      return data(JSON.stringify({ error: "Unhandled webhook topic" }), { status: 400, headers: {'Content-Type': 'application/json'} });
  }
};


