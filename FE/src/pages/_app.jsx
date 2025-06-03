import React from 'react';
import '@/assets/global.css';
import HeaderComponent from '@/components/HeaderComponent';
import FooterComponent from '@/components/FooterComponent';


function MyApp({ Component, pageProps }) {
    return (
        <>
            <HeaderComponent />
            <main className="main">
                <div className="container">
                    <Component {...pageProps} />
                </div>
            </main>
            <FooterComponent />
        </>
    );
}

export default MyApp;
