import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
  DeliveryMethod
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import type { AppLoadContext } from "@remix-run/node";

export const shopify = (context: AppLoadContext) => shopifyApp({
  apiKey: context.cloudflare.env.SHOPIFY_API_KEY,
  apiSecretKey: context.cloudflare.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: ["read_products"],
  appUrl: context.cloudflare.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(
    prisma(context.cloudflare.env.DATABASE_URL),
  ),  distribution: AppDistribution.AppStore,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/app.uninstalled",
    },
	APP_SCOPES_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/app.scopes_update",
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
...(process.env.SHOP_CUSTOM_DOMAIN
? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
: {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
