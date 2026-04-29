import { checkRegistryHealth } from "./helper/registry";

jest.setTimeout(60000);

async function waitForVerdaccio(timeout = 10000) {
    let keepGoing = true;
    const tid = setTimeout(() => { keepGoing = false; }, timeout);

    while (keepGoing) {
        console.log("Checking registry...");
        const result = await checkRegistryHealth();

        if (result) {
            console.log("Verdaccio is up!");
            clearTimeout(tid);

            return true;
        }
    }
}

waitForVerdaccio();
