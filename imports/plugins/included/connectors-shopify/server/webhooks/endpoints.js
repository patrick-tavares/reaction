import crypto from "crypto";

import { Meteor } from "meteor/meteor";

import { Reaction } from "/server/api";

function verifyWebhook(req) {
  // ensure we have a shopId in the request query string
  if (!req || !req.query || !req.query.shopId) {
    throw new Meteor.Error("access-denied", "webhook requests must include a shopId");
  }

  // We'll verify the shop-domain in addition to the Reaction shopId
  const shopUrl = req.headers["x-shopify-shop-domain"];
  const shopName = shopUrl && shopUrl.split(".")[0];

  // Find the correct shopify package
  const shopifyPkg = Reaction.getPackageSettingsWithOptions({
    "shopId": req.query.shopId,
    "name": "reaction-connectors-shopify",
    "settings.shopName": shopName
  });

  // Fail if we can't find a shopify package
  if (!shopifyPkg || !shopifyPkg.settings) {
    throw new Meteor.Error("server-error", `No shopify package found for shop ${Reaction.getShopId()}`);
  }

  const hmac = crypto.createHmac("sha256", shopifyPkg.settings.sharedSecret).update(req.rawBody).digest("base64");
  if (hmac !== req.headers["x-shopify-hmac-sha256"]) {
    throw new Meteor.Error("access-denied", "Could not verify webhook request was from Shopify");
  }

  return true;
}

Reaction.Endpoints.add("post", "/webhooks/shopify/orders-create", function (req, res) {
  // We'll move the code that's in the orders-updated hook into here once it's functional
  // easier to iterate in that hook for now.
  Reaction.Endpoints.sendResponse(res);

  // If we can verify that this request is legitimate, call our shopify/sync/orders/created
  if (verifyWebhook(req)) {
    Meteor.call("shopify/sync/orders/created", req.body.line_items);
  }
});