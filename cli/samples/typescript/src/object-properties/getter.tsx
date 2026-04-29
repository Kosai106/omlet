import React from "react";
import { Box } from "@mui/material";

export default function Getter() {
    return (
        <Box
            sx={{
                width: 100,
                get dynamicWidth() {
                    return this.width * 2;
                }
            }}
        >
            Styled with sx prop
        </Box>
    );
}
