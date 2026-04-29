export enum Profession {
    Developer = "developer",
    Designer = "designer",
    ProductManager = "productManager",
    TeamLead = "teamLead",
    Executive = "executive",
}

export function getProfessionLabel(profession: Profession) {
    switch (profession) {
        case Profession.Developer:
            return "Developer";
        case Profession.Designer:
            return "Designer";
        case Profession.ProductManager:
            return "Product Manager";
        case Profession.TeamLead:
            return "Team Lead";
        case Profession.Executive:
            return "Executive";
    }
}
