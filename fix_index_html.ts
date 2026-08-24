import fs from 'fs';

let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(/<title>.*?<\/title>/, '<title>ReturnIQ - Return Intelligence</title>');
code = code.replace(/<meta name="description" content=".*?" \/>/, '<meta name="description" content="Transform messy e-commerce return data into evidence-backed product decisions." />');
code = code.replace(/<meta property="og:title" content=".*?" \/>/, '<meta property="og:title" content="ReturnIQ - Return Intelligence" />');
code = code.replace(/<meta property="og:description" content=".*?" \/>/, '<meta property="og:description" content="Transform messy e-commerce return data into evidence-backed product decisions." />');

// Add og:image if missing
if (!code.includes('og:image')) {
  code = code.replace(
    /<meta name="twitter:card" content="summary_large_image" \/>/,
    '<meta name="twitter:card" content="summary_large_image" />\n    <meta property="og:image" content="https://app.returniq.com/og-image.png" />'
  );
}

fs.writeFileSync('index.html', code);
console.log('Fixed index.html OG tags');
