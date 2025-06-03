import React from 'react';

export default function FooterComponent() {
    return (
        <footer className="footer">
            <div className="container">
                <p>&copy; {new Date().getFullYear()} My Website. All rights reserved.</p>
            </div>
        </footer>
    );
}
