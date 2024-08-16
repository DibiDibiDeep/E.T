import styles from 'styles/Footer.module.css';
import React, { FC, ReactElement } from "react";
import { Box, Container, Grid, Typography } from "@mui/material";

function Footer(){

    return(
        <>
            <Box
                sx={{
                    width: "100%",
                    height: "auto",
                    backgroundColor: "primary.light",
                    paddingTop: "1rem",
                    paddingBottom: "1rem",
                }}
            >
                <Container maxWidth="lg">
                    <Grid container direction="column" alignItems="center">
                    <Grid item xs={12}>
                        <Typography color="primary" variant="h5">
                            Smileage
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography color="primary" variant="subtitle1">
                        {`ⓒDibiDibiDeep | ${new Date().getFullYear()}`}
                        </Typography>
                    </Grid>
                    </Grid>
                </Container>
            </Box>
        </>
    )
}

export default Footer;
