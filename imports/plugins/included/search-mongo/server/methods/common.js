import { Reaction } from "/server/api";
import { Packages } from "/lib/collections";

const utils = {
  getPackageSettings: function () {
    const searchPackage = Packages.findOne({
      shopId: Reaction.getShopId(),
      name: "reaction-search"
    });
    return searchPackage.settings;
  }
};

export default utils;
