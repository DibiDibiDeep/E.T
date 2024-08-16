import { Outlet } from "react-router-dom";
import Footer from "components/common/Footer";
import Header from "components/common/Header";

import { ThemeProvider } from "@mui/material/styles";
import theme from "styles/theme"


function Layout1() {

    return(
        <>
            <ThemeProvider theme={theme}>
                <Header />
                <Outlet />
                <Footer />
            </ThemeProvider>
        </>
    )
}

export default Layout1;