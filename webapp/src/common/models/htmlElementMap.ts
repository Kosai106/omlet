// Seeded default mapping from raw HTML element to the design-system component
// that usually replaces it. Used to frame the raw-HTML report as an actionable
// "swap this for that" backlog. Workspaces can override these (and add their
// own) via the editable map on the Workspace model; the effective map is the
// defaults overlaid by the workspace's stored overrides.
export const DEFAULT_HTML_ELEMENT_MAP: Record<string, string> = {
    a: "Link",
    button: "Button",
    input: "TextInput",
    textarea: "Textarea",
    select: "Select",
    option: "Option",
    img: "Image",
    table: "Table",
    form: "Form",
    label: "Label",
    dialog: "Modal",
    nav: "Nav",
    ul: "List",
    ol: "List",
    li: "ListItem",
    h1: "Heading",
    h2: "Heading",
    h3: "Heading",
    h4: "Heading",
    h5: "Heading",
    h6: "Heading",
    p: "Text",
    progress: "ProgressBar",
};
