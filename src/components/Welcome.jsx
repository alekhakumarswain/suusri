import React from "react";
import Main from "./Main";
import Navbar from './Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';


export default function Welcome() {
    return (
        <>
            <Navbar/>
            <Main />
        </>
    );
}
