const QuickGameSearch = require('./quickGameSearch');

async function buildPopularGames() {
    console.log('🚀 Building cache for popular games...');
    
    const searcher = new QuickGameSearch();
    
    // Popular games to pre-cache
    const popularAppIds = [
        228980,  // Steamworld Heist
        220,     // Half-Life 2
        570,     // Dota 2
        440,     // Team Fortress 2
        730,     // Counter-Strike 2
        1091500, // Cyberpunk 2077
        1172620, // Elden Ring
        1444780, // ITS DARK SOULS
        489830,  // The Witcher 3
        227300,  // Half-Life
        1250410, // Deep Rock Galactic
        413150,  // Stardew Valley
        292030,  // The Witcher 2
        21570,   // Garry's Mod
        203160,  // Torchlight II
        108600,  // Project Zomboid
        4000,    // Garry's Mod (alternative)
        252490,  // Rust
        381210,  // Dead by Daylight
        431960,  // Among Us
        570,     // Dota 2
        1091500, // Cyberpunk 2077
        1172620, // Elden Ring
        1444780, // It's Dark Souls
        489830,  // The Witcher 3
        365270,  // Hitman 3
        230410,  // Warframe
        209650,  // Terraria
        255710,  // Cities Skylines
        292030,  // The Witcher 2
        // Add Resident Evil games
        304240,  // Resident Evil 7
        339340,  // Resident Evil 2 Remake
        330930,  // Resident Evil 3 Remake
        601360,  // Resident Evil Village
        348250,  // Resident Evil 4
        203710,  // Resident Evil 5
        204100,  // Resident Evil 6
    ];

    let count = 0;
    let failed = 0;

    for (const appId of popularAppIds) {
        try {
            const name = await searcher.fetchGameName(appId);
            if (name) {
                count++;
                console.log(`✅ ${count}. ${name} (${appId})`);
            } else {
                failed++;
            }
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            failed++;
            console.error(`❌ Failed to fetch ${appId}`);
        }
    }

    console.log('');
    console.log('✅ Popular games cache built!');
    console.log(`📊 Stats:`);
    console.log(`   - Fetched: ${count}`);
    console.log(`   - Failed: ${failed}`);
    console.log(`   - Total cached: ${searcher.gameNames.size}`);
    
    process.exit(0);
}

buildPopularGames().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
