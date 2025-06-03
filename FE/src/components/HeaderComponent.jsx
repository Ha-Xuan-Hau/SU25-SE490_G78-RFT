import React from 'react';

export default function HeaderComponent() {
    return (
        <header className="header">
            <div className="container">
                <nav>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h1 style={{ margin: 0 }}>My Website</h1>
                        <ul style={{ display: 'flex', listStyle: 'none', gap: '20px', margin: 0 }}>
                            <li><a href="/">Home</a></li>
                            <li><a href="/about">About</a></li>
                            <li><a href="/contact">Contact</a></li>
                        </ul>
                    </div>
                </nav>
            </div>
        </header>
    );
}
