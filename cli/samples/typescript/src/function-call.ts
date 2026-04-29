const intro = "yekte yavrum, yekte";

function sing(): string {
    return intro + "\n" + yekte();
}

function yekte(): string {
    return "pastirmalar tekte";
}

export const song = sing();
