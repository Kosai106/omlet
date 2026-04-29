import React from "react";
import { Box } from "@mui/material";

export default function NestedKeyPair() {
    return (
        <Box
            sx={{
                "&:hover": {
                    backgroundColor: "secondary.main",
                }
            }}
        >
            Styled with sx prop
        </Box>
    );
}
