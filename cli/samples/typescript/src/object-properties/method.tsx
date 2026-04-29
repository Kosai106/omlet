import React from "react";
import { Box } from "@mui/material";

export default function Method() {
    return (
        <Box
            sx={{
                width: 100,
                calculateSize() {
                    return this.width + 50; // Method to calculate size
                },
            }}
        >
            Styled with sx prop
        </Box>
    );
}
