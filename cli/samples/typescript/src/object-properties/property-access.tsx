import React from "react";
import { Box } from "@mui/material";

export default function PropertyAccess(key1, key2) {
    return (
        <Box
            sx={{
                dynamicPadding: key1.padding,
                dynamicMargin: key2.margin[0],
            }}
        >
            Styled with sx prop
        </Box>
    );
}
