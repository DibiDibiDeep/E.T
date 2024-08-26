import { Outlet } from "react-router-dom";
import Footer from "../components/common/Footer";
import Header from "../components/common/Header";


function Layout1() {

    return(
        <>
            <Header />
            <Outlet />
            <Footer />
        </>
    )
}

export default Layout1;