import React from "react";
import { Box } from "@mui/material";

export default function NestedObject() {
    return (
        <Box
            sx={{
                customStyles: {
                    color: "red",
                    border: {
                        style: "solid",
                        width: "2px",
                    },
                }
            }}
        >
            Styled with sx prop
        </Box>
    );
}
