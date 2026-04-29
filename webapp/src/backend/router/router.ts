import { Router } from "express";

import { config } from "../../config/backend";

import { apiRouter as api } from "./api";
import { pagesRouter as pages } from "./pages";

const rootRouter = Router();

rootRouter.use(config.API_ROOT_PATH, api);
rootRouter.use("/", pages);

export { rootRouter as router };
