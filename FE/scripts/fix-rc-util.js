/* eslint-disable */
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting rc-util fix...');

const fixes = [
    // ES modules
    {
        path: 'es/React/isFragment.js',
        content: `import * as React from 'react';
export default function isFragment(object) {
  return object && object.type === React.Fragment;
}`
    },
    {
        path: 'es/Dom/canUseDom.js',
        content: `export default function canUseDom() {
  return !!(typeof window !== 'undefined' && window.document && window.document.createElement);
}`
    },
    // CommonJS modules
    {
        path: 'lib/React/isFragment.js',
        content: `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = isFragment;
var React = require("react");
function isFragment(object) {
  return object && object.type === React.Fragment;
}`
    },
    {
        path: 'lib/Dom/canUseDom.js',
        content: `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = canUseDom;
function canUseDom() {
  return !!(typeof window !== 'undefined' && window.document && window.document.createElement);
}`
    },
    // TypeScript definitions
    {
        path: 'es/React/isFragment.d.ts',
        content: `export default function isFragment(object: any): boolean;`
    },
    {
        path: 'es/Dom/canUseDom.d.ts',
        content: `export default function canUseDom(): boolean;`
    }
];

const rcUtilPath = path.join(process.cwd(), 'node_modules', 'rc-util');

if (!fs.existsSync(rcUtilPath)) {
    console.log('❌ rc-util not found. Please run npm install first.');
    process.exit(1);
}

fixes.forEach(fix => {
    const filePath = path.join(rcUtilPath, fix.path);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, fix.content, 'utf8');
    console.log(`✅ Fixed: ${fix.path}`);
});

console.log('✅ rc-util fix completed!');
