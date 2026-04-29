import React from "react";
import { Box } from "@mui/material";

export default function ArrayValues() {
    return (
        <Box
            sx={{
                margin: [0, 10, 20, 30],
                gridTemplateColumns: ["1fr", "2fr"],
            }}
        >
            Styled with sx prop
        </Box>
    );
}
