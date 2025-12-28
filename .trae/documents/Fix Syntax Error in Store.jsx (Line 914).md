I have identified a syntax error in `src/pages/Store.jsx` around line 914. The code is corrupted with unexpected characters and malformed JSX attributes, specifically:
```javascript
className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl<font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/50 transution-tlltduration-300 hover:scale-105 flex items-center gap-2"on
```
It appears to be a mix of `className` and some other attributes or text that got pasted incorrectly.

I will fix this by:
1.  **Reading `src/pages/Store.jsx` around line 914** to get the full context of the corrupted block.
2.  **Replacing the corrupted code** with the correct JSX structure for the "View Details" and "Download" buttons, ensuring all attributes like `className`, `onClick`, and the closing tags are correct.
3.  **Verifying** that the surrounding code (like the `featuredGames.map` loop) is also intact.

**Action:**
-   **Edit `src/pages/Store.jsx`**: Repair the corrupted button code block.