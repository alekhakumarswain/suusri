import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css'; 
import '@fortawesome/fontawesome-free/css/all.min.css';
import './Main.css'; 

export default function Navbar() {
    return (
        <>
            <nav className="navbar navbar-expand-lg sticky-top">
                <div className="container">
                    <a className="navbar-brand" href="/"><b>SuuSri</b></a>
                </div>
                
            </nav>
        </>
    );
}
