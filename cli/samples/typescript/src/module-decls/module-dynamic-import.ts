const dollyPromise = import("dolly");

async function whereIsDolly() {
    return (await dollyPromise).location;
}

async function whereIsMolly() {
    const molly = await import("molly");

    return molly.location;
}

export default function thirteen() { }
export default 1331;