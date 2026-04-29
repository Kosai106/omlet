import cluster from "cluster";

import { config } from "../config/backend";

import { master, worker } from "./cluster";

if (!config.ENABLE_CLUSTER) {
    worker.start();
} else if (cluster.isPrimary) {
    master.start();
} else {
    worker.start();
}
