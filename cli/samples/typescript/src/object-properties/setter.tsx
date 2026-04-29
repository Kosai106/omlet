import React from "react";
import { Box } from "@mui/material";

export default function Setter() {
    return (
        <Box
            sx={{
                width: 100,
                set dynamicWidth(value) {
                    this.width = value / 2;
                }
            }}
        >
            Styled with sx prop
        </Box>
    );
}
