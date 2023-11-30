import { gameConfig } from "../config/GameSettings";
import { Save } from "../models/save.model";
import { ORMContext } from "../server";
import { KoaController } from "../utils/KoaController";
import { logging } from "../utils/logger";
import { storeItems } from "../data/storeItems";
import { User } from "../models/user.model";
import { getDefaultBaseData } from "../data/getDefaultBaseData";
import { FilterFrontendKeys } from "../utils/FrontendKey";
import { flags } from "../data/flags";

export const baseLoad: KoaController = async ctx => {
  // Try find an already existing save
  const user: User = ctx.authUser;
  await ORMContext.em.populate(user, ["save"]);

  let save = user.save;
  logging(`Loading base for user: ${ctx.authUser.username}`);
  if (save) {
    logging(`Base loaded:`, JSON.stringify(save, null, 2));
  } else {
    // There was no existing save, create one with some defaults
    logging(`Base not found, creating a new save`);

    save = ORMContext.em.create(Save, getDefaultBaseData(user));

    // Add the save to the database
    await ORMContext.em.persistAndFlush(save);

    user.save = save;

    // Update user base save
    await ORMContext.em.persistAndFlush(user);
  }
  const filteredSave = FilterFrontendKeys(save);

  const isTutorialEnabled = gameConfig.skipTutorial ? 205 : 0;

  ctx.status = 200;
  ctx.body = {
  // Optional
  // ownershipchanged: // puts base occupied message on screen
  // Optional
  // baseoccupied: // Same logic as 'ownershipchanged'
  // Optional - Only used if `isMainYard` and base mode is `BUILD`
  //  **and** only if it is set
  //  ***ANDDDDD*** only if `userid` = `LOGIN._playerID`
  //   if it is not set but 2 other conditions are met and
  //   the client has an allianceID set previously
  //   or the `ALLIANCES._myAlliance` object is set
  //     then it removes the alliances registered on client
  // alliancedata: {
  //   alliance_id: // int
  // }
  // // Included as it is only supplied in getDefaultBaseData
  // powerups:
  // attpowerups:
    flags,
    error: 0,
    basename: "testBase",
    pic_square: "https://apprecs.org/ios/images/app-icons/256/df/634186975.jpg",
    storeitems: { ...storeItems},
    ...filteredSave,
    id: filteredSave.basesaveid, // _lastSaveID
    tutorialstage: isTutorialEnabled,
    // Important: 'h' must always be at the end of the payload, as the client checks for this
    h: "someHashValue",
    hn: 0,
  };
};
