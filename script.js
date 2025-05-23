document.addEventListener('DOMContentLoaded', function() {
    const BUILD_NUMBER = 'v1.1.0'; // Ensure this is defined

    // Create and add the build number header
    const buildHeader = document.createElement('div');
    buildHeader.id = 'build-number-header';
    buildHeader.textContent = `Build: ${BUILD_NUMBER}`;
    document.body.insertBefore(buildHeader, document.body.firstChild);

    const encounterCountDisplay = document.getElementById('encounter-count-value');
    const incrementButton = document.getElementById('increment-button');
    const decrementButton = document.getElementById('decrement-button');
    const resetButton = document.getElementById('reset-button');
    const pokemonSelect = document.getElementById('pokemon-select');
    const titleElement = document.querySelector('h1');
    const pokemonImage = document.getElementById('pokemon-image');
    const methodSelect = document.getElementById('method-select');
    const shinyOddsDisplay = document.getElementById('shiny-odds');
    const shinyCharmCheckbox = document.getElementById('shiny-charm');
    const finishHuntButton = document.getElementById('finish-hunt-button');
    const huntNotesInput = document.getElementById('huntNotes');
    const tyrantrumLeftImage = document.querySelector('.tyrantrum-left-image');
    const tyrantrumRightImage = document.querySelector('.tyrantrum-right-image');
    const tyrantrumId = 697; // Tyrantrum's PokeAPI ID
    const tyrantrumImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${tyrantrumId}.png`;
    const shinyPokedex = document.getElementById('shiny-pokedex');
    let completedHunts = loadCompletedHunts(); // Load from localStorage

    let encounterCount = 0;
    let currentPokemon = '';
    let huntingMethod = 'Encounters';
    let hasShinyCharm = false;
    let startTime = null;
    let encounteredPokemonCounts = {};
    // Assuming 'fullPokedex' is defined elsewhere in your script
    let fullPokedex = {};

    // New script for custom select
    const customSelect = document.querySelector('.custom-select-wrapper');
    const selectTrigger = customSelect ? customSelect.querySelector('.custom-select-trigger') : null;
    const customOptions = customSelect ? customSelect.querySelector('.custom-options') : null;
    let customOptionList = customOptions ? customOptions.querySelectorAll('.custom-option') : [];
    const realSelect = document.getElementById('pokemon-select');

    function populateCustomOptions() {
        if (realSelect && customOptions && fullPokedex && selectTrigger) {
            // Clear existing options
            customOptions.innerHTML = '';
            realSelect.innerHTML = '<option value="none">None</option>'; // Keep the default
            selectTrigger.querySelector('span').textContent = 'Select a Pokémon'; // Reset trigger text

            for (const pokemonName in fullPokedex) {
                const option = document.createElement('div');
                option.classList.add('custom-option');
                option.textContent = pokemonName;
                option.setAttribute('data-value', pokemonName);
                customOptions.appendChild(option);

                const realOption = document.createElement('option');
                realOption.value = pokemonName;
                realOption.textContent = pokemonName;
                realSelect.appendChild(realOption);
            }

            // Re-select custom option elements after populating
            customOptionList = customOptions.querySelectorAll('.custom-option');
            customOptionList.forEach(option => {
                option.addEventListener('click', function() {
                    const value = this.getAttribute('data-value');
                    const text = this.textContent;
                    if (selectTrigger && realSelect) {
                        selectTrigger.querySelector('span').textContent = text;
                        realSelect.value = value;
                        realSelect.dispatchEvent(new Event('change'));
                        if (customOptions) {
                            customOptions.style.display = 'none';
                        }
                        currentPokemon = value;
                        updateCountDisplay();
                        saveProgress(); // Save progress on Pokémon selection
                    }
                });
            });

            // Load previously selected Pokémon
            const savedPokemon = localStorage.getItem('selectedPokemon');
            if (savedPokemon && savedPokemon !== 'none' && realSelect) {
                realSelect.value = savedPokemon;
                if (selectTrigger && selectTrigger.querySelector('span')) {
                    const selectedOption = customOptions.querySelector(`.custom-option[data-value="${savedPokemon}"]`);
                    if (selectedOption) {
                        selectTrigger.querySelector('span').textContent = selectedOption.textContent;
                    } else {
                        selectTrigger.querySelector('span').textContent = savedPokemon.charAt(0).toUpperCase() + savedPokemon.slice(1);
                    }
                    currentPokemon = savedPokemon;
                    updateCountDisplay();
                }
            }
        }
    }

    if (selectTrigger) {
        selectTrigger.addEventListener('click', () => {
            if (customOptions) {
                customOptions.style.display = customOptions.style.display === 'block' ? 'none' : 'block';
            }
        });
    }

    // Close the dropdown if the user clicks outside
    document.addEventListener('click', (event) => {
        if (customSelect && !customSelect.contains(event.target)) {
            if (customOptions) {
                customOptions.style.display = 'none';
            }
        }
    });
    // End of new script

    if (tyrantrumLeftImage) {
        tyrantrumLeftImage.src = tyrantrumImageUrl;
    } else {
        console.error("Left Tyrantrum image element not found.");
    }

    if (tyrantrumRightImage) {
        tyrantrumRightImage.src = tyrantrumImageUrl;
    } else {
        console.error("Right Tyrantrum image element not found.");
    }

    function loadCompletedHunts() {
        const storedHunts = localStorage.getItem('completedHunts');
        return storedHunts ? JSON.parse(storedHunts) : [];
    }

    function saveCompletedHunts() {
        localStorage.setItem('completedHunts', JSON.stringify(completedHunts));
    }

    function displayPokedex() {
        if (!shinyPokedex) return; // Exit if the element doesn't exist
        shinyPokedex.innerHTML = ''; // Clear existing display
        completedHunts.forEach(pokemonName => {
            const entryDiv = document.createElement('div');
            entryDiv.classList.add('pokedex-entry');
            const pokemonId = getPokemonId(pokemonName); // Reuse your function
            const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemonId}.png`;
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = pokemonName;
            const nameSpan = document.createElement('span');
            nameSpan.textContent = pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1);

            entryDiv.appendChild(img);
            entryDiv.appendChild(nameSpan);
            shinyPokedex.appendChild(entryDiv);
        });
    }

    function updateShinyOddsDisplay() {
        const odds = getShinyOdds(huntingMethod, hasShinyCharm);
        if (hasShinyCharm) {
            shinyOddsDisplay.innerHTML = `Shiny Odds: ${odds.withCharm} (With Shiny Charm)`;
        } else {
            shinyOddsDisplay.innerHTML = `Shiny Odds: ${odds.withoutCharm} (Without Shiny Charm)`;
        }
    }

    function getShinyOdds(method, hasCharm) {
        let withoutCharm = '1/4096';
        let withCharm = '1/1365';
        switch (method) {
            case 'masuda':
                withoutCharm = '1/683 (Gen 6+), 1/683 (Gen 5), 1/2048 (Gen 4)';
                withCharm = '1/512 (Gen 6+), 1/512 (Gen 5), 1/1024 (Gen 4)';
                break;
            case 'sos-chaining':
                withoutCharm = 'Increases with chain, up to 1/315 (Gen 7)';
                withCharm = 'Increases with chain, up to 1/273 (Gen 7)';
                break;
            case 'chain-fishing':
                withoutCharm = 'Increases with chain (After 20, odds are the same), up to 1/100 (Gen 6)';
                withCharm = 'Increases with chain (After 20, odds are the same), up to 1/100 (Gen 6)';
                break;
            case 'friend-safari':
                withoutCharm = '1/819 (Gen 6)';
                withCharm = '1/586 (Gen 6)';
                break;
            case 'dexnav':
                withoutCharm = 'Increases with search level and chain (ORAS) - See: <a href="https://www.serebii.net/omegarubyalphasapphire/dexnav.shtml" target="_blank">Serebii.net</a>';
                withCharm = 'Higher increase with charm (ORAS) - See: <a href="https://www.serebii.net/omegarubyalphasapphire/dexnav.shtml" target="_blank">Serebii.net</a>';
                break;
            case 'radar-chaining':
                withoutCharm = 'Increases with chain, up to 1/200 (Gen 4), 1/100 (Gen 6), 1/99 (BDSP)';
                withCharm = 'Increases with chain, up to 1/200 (Gen 4), 1/100 (Gen 6), 1/99 (BDSP)';
                break;
            case 'dynamax-adventures':
                withoutCharm = '1/300';
                withCharm = '1/100';
                break;
            case 'outbreaks':
                withoutCharm = 'Increased odds, varies by game (e.g., 1/1365 in PLA)';
                withCharm = 'Further increased odds (PLA, SV)';
                break;
            case 'full-odds':
            case 'encounters':
            default:
                withoutCharm = '1/4096 (Gen 6+) / 1/8192 (Gen 1-5)';
                withCharm = '1/1365 (Gen 6+) / 1/2731 (Gen 5)';
                break;
        }
        return { withoutCharm: withoutCharm, withCharm: withCharm };
    }

    function updateCountDisplay() {
        encounterCountDisplay.textContent = encounterCount;
        const formattedMethod = huntingMethod
            .toLowerCase()
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        let methodText = `Method: ${
            huntingMethod
                .toLowerCase()
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
        }`;
        if (currentPokemon) {
            titleElement.textContent = `Shiny Hunt Tracker - Hunting: ${currentPokemon.charAt(0).toUpperCase() + currentPokemon.slice(1)}`;
            let pokemonId = getPokemonId(currentPokemon);
            let imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemonId}.png`;
            pokemonImage.src = imageUrl;
            pokemonImage.style.display = 'block';
            updateShinyOddsDisplay();
        } else {
            titleElement.textContent = `Shiny Hunt Tracker`;
            pokemonImage.src = '';
            pokemonImage.style.display = 'none';
        }
    }

    function getPokemonId(pokemonName) {
        switch (pokemonName) {
        case 'bulbasaur': return 1;
        case 'ivysaur': return 2;
        case 'venusaur': return 3;
        case 'charmander': return 4;
        case 'charmeleon': return 5;
        case 'charizard': return 6;
        case 'squirtle': return 7;
        case 'wartortle': return 8;
        case 'blastoise': return 9;
        case 'caterpie': return 10;
        case 'metapod': return 11;
        case 'butterfree': return 12;
        case 'weedle': return 13;
        case 'kakuna': return 14;
        case 'beedrill': return 15;
        case 'pidgey': return 16;
        case 'pidgeotto': return 17;
        case 'pidgeot': return 18;
        case 'rattata': return 19;
        case 'raticate': return 20;
        case 'spearow': return 21;
        case 'fearow': return 22;
        case 'ekans': return 23;
        case 'arbok': return 24;
        case 'pikachu': return 25;
        case 'raichu': return 26;
        case 'sandshrew': return 27;
        case 'sandslash': return 28;
        case 'nidoran-f': return 29;
        case 'nidorina': return 30;
        case 'nidoqueen': return 31;
        case 'nidoran-m': return 32;
        case 'nidorino': return 33;
        case 'nidoking': return 34;
        case 'clefairy': return 35;
        case 'clefable': return 36;
        case 'vulpix': return 37;
        case 'ninetales': return 38;
        case 'jigglypuff': return 39;
        case 'wigglytuff': return 40;
        case 'zubat': return 41;
        case 'golbat': return 42;
        case 'oddish': return 43;
        case 'gloom': return 44;
        case 'vileplume': return 45;
        case 'paras': return 46;
        case 'parasect': return 47;
        case 'venonat': return 48;
        case 'venomoth': return 49;
        case 'diglett': return 50;
        case 'dugtrio': return 51;
        case 'meowth': return 52;
        case 'persian': return 53;
        case 'psyduck': return 54;
        case 'golduck': return 55;
        case 'mankey': return 56;
        case 'primeape': return 57;
        case 'growlithe': return 58;
        case 'arcanine': return 59;
        case 'poliwag': return 60;
        case 'poliwhirl': return 61;
        case 'poliwrath': return 62;
        case 'abra': return 63;
        case 'kadabra': return 64;
        case 'alakazam': return 65;
        case 'machop': return 66;
        case 'machoke': return 67;
        case 'machamp': return 68;
        case 'bellsprout': return 69;
        case 'weepinbell': return 70;
        case 'victreebel': return 71;
        case 'tentacool': return 72;
        case 'tentacruel': return 73;
        case 'geodude': return 74;
        case 'graveler': return 75;
        case 'golem': return 76;
        case 'ponyta': return 77;
        case 'rapidash': return 78;
        case 'slowpoke': return 79;
        case 'slowbro': return 80;
        case 'magnemite': return 81;
        case 'magneton': return 82;
        case 'farfetchd': return 83;
        case 'doduo': return 84;
        case 'dodrio': return 85;
        case 'seel': return 86;
        case 'dewgong': return 87;
        case 'grimer': return 88;
        case 'muk': return 89;
        case 'shellder': return 90;
        case 'cloyster': return 91;
        case 'gastly': return 92;
        case 'haunter': return 93;
        case 'gengar': return 94;
        case 'onix': return 95;
        case 'drowzee': return 96;
        case 'hypno': return 97;
        case 'krabby': return 98;
        case 'kingler': return 99;
        case 'voltorb': return 100;
        case 'electrode': return 101;
        case 'exeggcute': return 102;
        case 'exeggutor': return 103;
        case 'cubone': return 104;
        case 'marowak': return 105;
        case 'hitmonlee': return 106;
        case 'hitmonchan': return 107;
        case 'lickitung': return 108;
        case 'koffing': return 109;
        case 'weezing': return 110;
        case 'rhyhorn': return 111;
        case 'rhydon': return 112;
        case 'chansey': return 113;
        case 'tangela': return 114;
        case 'kangaskhan': return 115;
        case 'horsea': return 116;
        case 'seadra': return 117;
        case 'goldeen': return 118;
        case 'seaking': return 119;
        case 'staryu': return 120;
        case 'starmie': return 121;
        case 'mr-mime': return 122;
        case 'scyther': return 123;
        case 'jynx': return 124;
        case 'electabuzz': return 125;
        case 'magmar': return 126;
        case 'pinsir': return 127;
        case 'tauros': return 128;
        case 'magikarp': return 129;
        case 'gyarados': return 130;
        case 'lapras': return 131;
        case 'ditto': return 132;
        case 'eevee': return 133;
        case 'vaporeon': return 134;
        case 'jolteon': return 135;
        case 'flareon': return 136;
        case 'porygon': return 137;
        case 'omanyte': return 138;
        case 'omastar': return 139;
        case 'kabuto': return 140;
        case 'kabutops': return 141;
        case 'aerodactyl': return 142;
        case 'snorlax': return 143;
        case 'articuno': return 144;
        case 'zapdos': return 145;
        case 'moltres': return 146;
        case 'dratini': return 147;
        case 'dragonair': return 148;
        case 'dragonite': return 149;
        case 'mewtwo': return 150;
        case 'mew': return 151;
        // Gen 2 (Johto) - Add here following the same pattern
        case 'chikorita': return 152;
        case 'bayleef': return 153;
        case 'meganium': return 154;
        case 'cyndaquil': return 155;
        case 'quilava': return 156;
        case 'typhlosion': return 157;
        case 'totodile': return 158;
        case 'croconaw': return 159;
        case 'feraligatr': return 160;
        case 'sentret': return 161;
        case 'furret': return 162;
        case 'hoothoot': return 163;
        case 'noctowl': return 164;
        case 'ledyba': return 165;
        case 'ledian': return 166;
        case 'spinarak': return 167;
        case 'ariados': return 168;
        case 'crobat': return 169;
        case 'chinchou': return 170;
        case 'lanturn': return 171;
        case 'pichu': return 172;
        case 'cleffa': return 173;
        case 'igglybuff': return 174;
        case 'togepi': return 175;
        case 'togetic': return 176;
        case 'natu': return 177;
        case 'xatu': return 178;
        case 'mareep': return 179;
        case 'flaaffy': return 180;
        case 'ampharos': return 181;
        case 'bellossom': return 182;
        case 'marill': return 183;
        case 'azumarill': return 184;
        case 'sudowoodo': return 185;
        case 'politoed': return 186;
        case 'hoppip': return 187;
        case 'skiploom': return 188;
        case 'jumpluff': return 189;
        case 'aipom': return 190;
        case 'sunkern': return 191;
        case 'sunflora': return 192;
        case 'yanma': return 193;
        case 'wooper': return 194;
        case 'quagsire': return 195;
        case 'espeon': return 196;
        case 'umbreon': return 197;
        case 'murkrow': return 198;
        case 'slowking': return 199;
        case 'misdreavus': return 200;
        case 'unown': return 201;
        case 'wobbuffet': return 202;
        case 'girafarig': return 203;
        case 'pineco': return 204;
        case 'forretress': return 205;
        case 'dunsparce': return 206;
        case 'gligar': return 207;
        case 'steelix': return 208;
        case 'snubbull': return 209;
        case 'granbull': return 210;
        case 'qwilfish': return 211;
        case 'scizor': return 212;
        case 'shuckle': return 213;
        case 'heracross': return 214;
        case 'sneasel': return 215;
        case 'teddiursa': return 216;
        case 'ursaring': return 217;
        case 'slugma': return 218;
        case 'magcargo': return 219;
        case 'swinub': return 220;
        case 'piloswine': return 221;
        case 'corsola': return 222;
        case 'remoraid': return 223;
        case 'octillery': return 224;
        case 'delibird': return 225;
        case 'mantine': return 226;
        case 'skarmory': return 227;
        case 'houndour': return 228;
        case 'houndoom': return 229;
        case 'kingdra': return 230;
        case 'phanpy': return 231;
        case 'donphan': return 232;
        case 'porygon2': return 233;
        case 'stantler': return 234;
        case 'smeargle': return 235;
        case 'tyrogue': return 236;
        case 'hitmontop': return 237;
        case 'smoochum': return 238;
        case 'elekid': return 239;
        case 'magby': return 240;
        case 'miltank': return 241;
        case 'blissey': return 242;
        case 'raikou': return 243;
        case 'entei': return 244;
        case 'suicune': return 245;
        case 'larvitar': return 246;
        case 'pupitar': return 247;
        case 'tyranitar': return 248;
        case 'lugia': return 249;
        case 'ho-oh': return 250;
        case 'celebi': return 251;
        // Gen 3 (Hoenn) - Add here
        case 'treecko': return 252;
        case 'grovyle': return 253;
        case 'sceptile': return 254;
        case 'torchic': return 255;
        case 'combusken': return 256;
        case 'blaziken': return 257;
        case 'mudkip': return 258;
        case 'marshtomp': return 259;
        case 'swampert': return 260;
        case 'poochyena': return 261;
        case 'mightyena': return 262;
        case 'zigzagoon': return 263;
        case 'linoone': return 264;
        case 'wurmple': return 265;
        case 'silcoon': return 266;
        case 'beautifly': return 267;
        case 'cascoon': return 268;
        case 'dustox': return 269;
        case 'lotad': return 270;
        case 'lombre': return 271;
        case 'ludicolo': return 272;
        case 'seedot': return 273;
        case 'nuzleaf': return 274;
        case 'shiftry': return 275;
        case 'taillow': return 276;
        case 'swellow': return 277;
        case 'wingull': return 278;
        case 'pelipper': return 279;
        case 'ralts': return 280;
        case 'kirlia': return 281;
        case 'gardevoir': return 282;
        case 'surskit': return 283;
        case 'masquerain': return 284;
        case 'shroomish': return 285;
        case 'breloom': return 286;
        case 'slakoth': return 287;
        case 'vigoroth': return 288;
        case 'slaking': return 289;
        case 'nincada': return 290;
        case 'ninjask': return 291;
        case 'shedinja': return 292;
        case 'whismur': return 293;
        case 'loudred': return 294;
        case 'exploud': return 295;
        case 'makuhita': return 296;
        case 'hariyama': return 297;
        case 'azurill': return 298;
        case 'nosepass': return 299;
        case 'skitty': return 300;
        case 'delcatty': return 301;
        case 'sableye': return 302;
        case 'mawile': return 303;
        case 'aron': return 304;
        case 'lairon': return 305;
        case 'aggron': return 306;
        case 'meditite': return 307;
        case 'medicham': return 308;
        case 'electrike': return 309;
        case 'manectric': return 310;
        case 'plusle': return 311;
        case 'minun': return 312;
        case 'volbeat': return 313;
        case 'illumise': return 314;
        case 'roselia': return 315;
        case 'gulpin': return 316;
        case 'swalot': return 317;
        case 'carvanha': return 318;
        case 'sharpedo': return 319;
        case 'wailmer': return 320;
        case 'wailord': return 321;
        case 'numel': return 322;
        case 'camerupt': return 323;
        case 'torkoal': return 324;
        case 'spoink': return 325;
        case 'grumpig': return 326;
        case 'spinda': return 327;
        case 'trapinch': return 328;
        case 'vibrava': return 329;
        case 'flygon': return 330;
        case 'cacnea': return 331;
        case 'cacturne': return 332;
        case 'swablu': return 333;
        case 'altaria': return 334;
        case 'zangoose': return 335;
        case 'seviper': return 336;
        case 'lunatone': return 337;
        case 'solrock': return 338;
        case 'barboach': return 339;
        case 'whiscash': return 340;
        case 'corphish': return 341;
        case 'crawdaunt': return 342;
        case 'baltoy': return 343;
        case 'claydol': return 344;
        case 'lileep': return 345;
        case 'cradily': return 346;
        case 'anorith': return 347;
        case 'armaldo': return 348;
        case 'feebas': return 349;
        case 'milotic': return 350;
        case 'castform': return 351;
        case 'kecleon': return 352;
        case 'shuppet': return 353;
        case 'banette': return 354;
        case 'duskull': return 355;
        case 'dusclops': return 356;
        case 'tropius': return 357;
        case 'chimecho': return 358;
        case 'absol': return 359;
        case 'wynaut': return 360;
        case 'snorunt': return 361;
        case 'glalie': return 362;
        case 'spheal': return 363;
        case 'sealio': return 364;
        case 'walrein': return 365;
        case 'clamperl': return 366;
        case 'huntail': return 367;
        case 'gorebyss': return 368;
        case 'relicanth': return 369;
        case 'luvdisc': return 370;
        case 'bagon': return 371;
        case 'shelgon': return 372;
        case 'salamence': return 373;
        case 'beldum': return 374;
        case 'metang': return 375;
        case 'metagross': return 376;
        case 'regirock': return 377;
        case 'regice': return 378;
        case 'registeel': return 379;
        case 'latias': return 380;
        case 'latios': return 381;
        case 'kyogre': return 382;
        case 'groudon': return 383;
        case 'rayquaza': return 384;
        case 'jirachi': return 385;
        case 'deoxys': return 386;
        // Gen 4 (Sinnoh) - Add here
        case 'turtwig': return 387;
        case 'grotle': return 388;
        case 'torterra': return 389;
        case 'chimchar': return 390;
        case 'monferno': return 391;
        case 'infernape': return 392;
        case 'piplup': return 393;
        case 'prinplup': return 394;
        case 'empoleon': return 395;
        case 'starly': return 396;
        case 'staravia': return 397;
        case 'staraptor': return 398;
        case 'bidoof': return 399;
        case 'bibarel': return 400;
        case 'kricketot': return 401;
        case 'kricketune': return 402;
        case 'shinx': return 403;
        case 'luxio': return 404;
        case 'luxray': return 405;
        case 'budew': return 406;
        case 'roserade': return 407;
        case 'cranidos': return 408;
        case 'rampardos': return 409;
        case 'shieldon': return 410;
        case 'bastiodon': return 411;
        case 'burmy': return 412;
        case 'burmy-sandy': return '412-sandy';
        case 'burmy-trash': return '412-trash';
        case 'wormadam': return 413;
        case 'mothim': return 414;
        case 'combee': return 415;
        case 'vespiquen': return 416;
        case 'pachirisu': return 417;
        case 'buizel': return 418;
        case 'floatzel': return 419;
        case 'cherubi': return 420;
        case 'cherrim': return 421;
        case 'shellos': return 422;
        case 'shellos-east': return '422-east';
        case 'gastrodon': return 423;
        case 'gastrodon-east': return '423-east';
        case 'ambipom': return 424;
        case 'drifloon': return 425;
        case 'drifblim': return 426;
        case 'buneary': return 427;
        case 'lopunny': return 428;
        case 'mismagius': return 429;
        case 'honchkrow': return 430;
        case 'glameow': return 431;
        case 'purugly': return 432;
        case 'chingling': return 433;
        case 'stunky': return 434;
        case 'skuntank': return 435;
        case 'bronzor': return 436;
        case 'bronzong': return 437;
        case 'bonsly': return 438;
        case 'mime-jr': return 439;
        case 'happiny': return 440;
        case 'chatot': return 441;
        case 'spiritomb': return 442;
        case 'gible': return 443;
        case 'gabite': return 444;
        case 'garchomp': return 445;
        case 'munchlax': return 446;
        case 'riolu': return 447;
        case 'lucario': return 448;
        case 'hippopotas': return 449;
        case 'hippowdon': return 450;
        case 'skorupi': return 451;
        case 'drapion': return 452;
        case 'croagunk': return 453;
        case 'toxicroak': return 454;
        case 'carnivine': return 455;
        case 'finneon': return 456;
        case 'lumineon': return 457;
        case 'mantyke': return 458;
        case 'snover': return 459;
        case 'abomasnow': return 460;
        case 'weavile': return 461;
        case 'magnezone': return 462;
        case 'lickilicky': return 463;
        case 'rhyperior': return 464;
        case 'tangrowth': return 465;
        case 'electivire': return 466;
        case 'magmortar': return 467;
        case 'togekiss': return 468;
        case 'yanmega': return 469;
        case 'leafeon': return 470;
        case 'glaceon': return 471;
        case 'gliscor': return 472;
        case 'mamoswine': return 473;
        case 'porygon-z': return 474;
        case 'gallade': return 475;
        case 'probopass': return 476;
        case 'dusknoir': return 477;
        case 'froslass': return 478;
        case 'rotom': return 479;
        case 'uxie': return 480;
        case 'mesprit': return 481;
        case 'azelf': return 482;
        case 'dialga': return 483;
        case 'palkia': return 484;
        case 'heatran': return 485;
        case 'regigigas': return 486;
        case 'giratina': return 487;
        case 'cresselia': return 488;
        case 'phione': return 489;
        case 'manaphy': return 490;
        case 'darkrai': return 491;
        case 'shaymin-land': return 492;
        case 'arceus': return 493;
        // Gen 5 (Unova) - Add here
        case 'victini': return 494;
        case 'snivy': return 495;
        case 'servine': return 496;
        case 'serperior': return 497;
        case 'tepig': return 498;
        case 'pignite': return 499;
        case 'emboar': return 500;
        case 'oshawott': return 501;
        case 'dewott': return 502;
        case 'samurott': return 503;
        case 'patrat': return 504;
        case 'watchog': return 505;
        case 'lillipup': return 506;
        case 'herdier': return 507;
        case 'stoutland': return 508;
        case 'purrloin': return 509;
        case 'liepard': return 510;
        case 'pansage': return 511;
        case 'simisage': return 512;
        case 'pansear': return 513;
        case 'simisear': return 514;
        case 'panpour': return 515;
        case 'simipour': return 516;
        case 'munna': return 517;
        case 'musharna': return 518;
        case 'pidove': return 519;
        case 'tranquill': return 520;
        case 'unfezant': return 521;
        case 'blitzle': return 522;
        case 'zebstrika': return 523;
        case 'roggenrola': return 524;
        case 'boldore': return 525;
        case 'gigalith': return 526;
        case 'woobat': return 527;
        case 'swoobat': return 528;
        case 'drilbur': return 529;
        case 'excadrill': return 530;
        case 'audino': return 531;
        case 'timburr': return 532;
        case 'gurdurr': return 533;
        case 'conkeldurr': return 534;
        case 'tympole': return 535;
        case 'palpitoad': return 536;
        case 'seismitoad': return 537;
        case 'throh': return 538;
        case 'sawk': return 539;
        case 'sewaddle': return 540;
        case 'swadloon': return 541;
        case 'leavanny': return 542;
        case 'venipede': return 543;
        case 'whirlipede': return 544;
        case 'scolipede': return 545;
        case 'cottonee': return 546;
        case 'whimsicott': return 547;
        case 'petilil': return 548;
        case 'lilligant': return 549;
        case 'basculin': return 550;
        case 'sandile': return 551;
        case 'krokorok': return 552;
        case 'krookodile': return 553;
        case 'darumaka': return 554;
        case 'darmanitan': return 555;
        case 'maractus': return 556;
        case 'dwebble': return 557;
        case 'crustle': return 558;
        case 'scraggy': return 559;
        case 'scrafty': return 560;
        case 'sigilyph': return 561;
        case 'yamask': return 562;
        case 'cofagrigus': return 563;
        case 'tirtouga': return 564;
        case 'carracosta': return 565;
        case 'archen': return 566;
        case 'archeops': return 567;
        case 'trubbish': return 568;
        case 'garbodor': return 569;
        case 'zorua': return 570;
        case 'zoroark': return 571;
        case 'minccino': return 572;
        case 'cinccino': return 573;
        case 'gothita': return 574;
        case 'gothorita': return 575;
        case 'gothitelle': return 576;
        case 'solosis': return 577;
        case 'duosion': return 578;
        case 'reuniclus': return 579;
        case 'ducklett': return 580;
        case 'swanna': return 581;
        case 'vanillite': return 582;
        case 'vanillish': return 583;
        case 'vanilluxe': return 584;
        case 'deerling': return 585;
        case 'deerling-summer': return '585-summer';
        case 'deerling-autumn': return '585-autumn';
        case 'deerling-winter': return '585-winter';
        case 'sawsbuck': return 586;
        case 'sawsbuck-summer': return '586-summer';
        case 'sawsbuck-autumn': return '586-autumn';
        case 'sawsbuck-winter': return '586-winter';
        case 'emolga': return 587;
        case 'karrablast': return 588;
        case 'escavalier': return 589;
        case 'foongus': return 590;
        case 'amoonguss': return 591;
        case 'frillish': return 592;
        case 'jellicent': return 593;
        case 'alomomola': return 594;
        case 'joltik': return 595;
        case 'galvantula': return 596;
        case 'ferroseed': return 597;
        case 'ferrothorn': return 598;
        case 'klink': return 599;
        case 'klang': return 600;
        case 'klinklang': return 601;
        case 'tynamo': return 602;
        case 'eelektrik': return 603;
        case 'eelektross': return 604;
        case 'elgyem': return 605;
        case 'beheeyem': return 606;
        case 'litwick': return 607;
        case 'lampent': return 608;
        case 'chandelure': return 609;
        case 'axew': return 610;
        case 'fraxure': return 611;
        case 'haxorus': return 612;
        case 'cubchoo': return 613;
        case 'beartic': return 614;
        case 'cryogonal': return 615;
        case 'shelmet': return 616;
        case 'accelgor': return 617;
        case 'stunfisk': return 618;
        case 'mienfoo': return 619;
        case 'mienshao': return 620;
        case 'druddigon': return 621;
        case 'golett': return 622;
        case 'golurk': return 623;
        case 'pawniard': return 624;
        case 'bisharp': return 625;
        case 'bouffalant': return 626;
        case 'rufflet': return 627;
        case 'braviary': return 628;
        case 'vullaby': return 629;
        case 'mandibuzz': return 630;
        case 'deino': return 633;
        case 'zweilous': return 634;
        case 'hydreigon': return 635;
        case 'larvesta': return 636;
        case 'volcarona': return 637;
        case 'cobalion': return 638;
        case 'terrakion': return 639;
        case 'virizion': return 640;
        case 'tornadus-incarnate': return 641;
        case 'thundurus-incarnate': return 642;
        case 'reshiram': return 643;
        case 'zekrom': return 644;
        case 'landorus-incarnate': return 645;
        case 'kyurem': return 646;
        case 'keldeo-ordinary': return 647;
        case 'meloetta-aria': return 648;
        case 'genesect': return 649;
        // Gen 6 (Kalos) - Add here
        case 'chespin': return 650;
        case 'quilladin': return 651;
        case 'chesnaught': return 652;
        case 'fennekin': return 653;
        case 'braixen': return 654;
        case 'delphox': return 655;
        case 'froakie': return 656;
        case 'frogadier': return 657;
        case 'greninja': return 658;
        case 'bunnelby': return 659;
        case 'diggersby': return 660;
        case 'fletchling': return 661;
        case 'fletchinder': return 662;
        case 'talonflame': return 663;
        case 'scatterbug': return 664;
        case 'spewpa': return 665;
        case 'vivillon-meadow': return '666-meadow';
        case 'vivillon-polar': return '666-polar';
        case 'vivillon-tundra': return '666-tundra';
        case 'vivillon-continental': return '666-continental';
        case 'vivillon-elegant': return '666-elegant';
        case 'vivillon-garden': return '666-garden';
        case 'vivillon-modern': return '666-modern';
        case 'vivillon-marine': return '666-marine';
        case 'vivillon-archipelago': return '666-archipelago';
        case 'vivillon-high-plains': return '666-high-plains';
        case 'vivillon-sandstorm': return '666-sandstorm';
        case 'vivillon-river': return '666-river';
        case 'vivillon-monsoon': return '666-monsoon';
        case 'vivillon-savanna': return '666-savanna';
        case 'vivillon-sun': return '666-sun';
        case 'vivillon-ocean': return '666-ocean';
        case 'vivillon-jungle': return '666-jungle';
        case 'vivillon-fancy': return '666-fancy';
        case 'vivillon-pokeball': return '666-pokeball';
        case 'flabebe': return 669;
        case 'flabebe-blue': return '669-blue';
        case 'flabebe-yellow': return '669-yellow';
        case 'flabebe-orange': return '669-orange';
        case 'flabebe-white': return '669-white';
        case 'floette': return 670;
        case 'floette-blue': return '670-blue';
        case 'floette-yellow': return '670-yellow';
        case 'floette-orange': return '670-orange';
        case 'floette-white': return '670-white';
        case 'florges': return 671;
        case 'florges-blue': return '671-blue';
        case 'florges-yellow': return '671-yellow';
        case 'florges-orange': return '671-orange';
        case 'florges-white': return '671-white';
        case 'skiddo': return 672;
        case 'gogoat': return 673;
        case 'pancham': return 674;
        case 'pangoro': return 675;
        case 'furfrou': return 676;
        case 'espurr': return 677;
        case 'meowstic-male': return 678;
        case 'honedge': return 679;
        case 'doublade': return 680;
        case 'aegislash': return 681;
        case 'spritzee': return 682;
        case 'aromatisse': return 683;
        case 'swirlix': return 684;
        case 'slurpuff': return 685;
        case 'inkay': return 686;
        case 'malamar': return 687;
        case 'binacle': return 688;
        case 'barbaracle': return 689;
        case 'skrelp': return 690;
        case 'dragalge': return 691;
        case 'clauncher': return 692;
        case 'clawitzer': return 693;
        case 'helioptile': return 694;
        case 'heliolisk': return 695;
        case 'tyrunt': return 696;
        case 'tyrantrum': return 697;
        case 'amaura': return 698;
        case 'aurorus': return 699;
        case 'sylveon': return 700;
        case 'hawlucha': return 701;
        case 'dedenne': return 702;
        case 'carbink': return 703;
        case 'goomy': return 704;
        case 'sliggoo': return 705;
        case 'goodra': return 706;
        case 'klefki': return 707;
        case 'phantump': return 708;
        case 'trevenant': return 709;
        case 'pumpkaboo-average': return 710;
        case 'gourgeist-average': return 711;
        case 'bergmite': return 712;
        case 'avalugg': return 713;
        case 'noibat': return 714;
        case 'noivern': return 715;
        case 'xerneas': return 716;
        case 'yveltal': return 717;
        case 'zygarde': return 718;
        case 'diancie': return 719;
        case 'hoopa-confined': return 720;
        case 'volcanion': return 721;
        // Gen 7 (Alola) - Add here
        case 'rowlet': return 722;
        case 'dartrix': return 723;
        case 'decidueye': return 724;
        case 'litten': return 725;
        case 'torracat': return 726;
        case 'incineroar': return 727;
        case 'popplio': return 728;
        case 'brionne': return 729;
        case 'primarina': return 730;
        case 'pikipek': return 731;
        case 'trumbeak': return 732;
        case 'toucannon': return 733;
        case 'yungoos': return 734;
        case 'gumshoos': return 735;
        case 'grubbin': return 736;
        case 'charjabug': return 737;
        case 'vikavolt': return 738;
        case 'crabrawler': return 739;
        case 'crabominable': return 740;
        case 'oricorio': return 741;
        case 'oricorio-pom-pom': return 10123;
        case 'oricorio-pau': return 10124;
        case 'oricorio-sensu': return 10125;
        case 'cutiefly': return 742;
        case 'ribombee': return 743;
        case 'rockruff': return 744;
        case 'rockruff-own-tempo': return 10151;
        case 'lycanroc': return 745;
        case 'lycanroc-midnight': return 10126;
        case 'lycanroc-dusk': return 10152;
        case 'wishiwashi': return 746;
        case 'mareanie': return 747;
        case 'toxapex': return 748;
        case 'mudbray': return 749;
        case 'mudsdale': return 750;
        case 'dewpider': return 751;
        case 'araquanid': return 752;
        case 'fomantis': return 753;
        case 'lurantis': return 754;
        case 'morelull': return 755;
        case 'shiinotic': return 756;
        case 'salandit': return 757;
        case 'salazzle': return 758;
        case 'stufful': return 759;
        case 'bewear': return 760;
        case 'bounsweet': return 761;
        case 'steenee': return 762;
        case 'tsareena': return 763;
        case 'comfey': return 764;
        case 'oranguru': return 765;
        case 'passimian': return 766;
        case 'wimpod': return 767;
        case 'golisopod': return 768;
        case 'sandygast': return 769;
        case 'palossand': return 770;
        case 'pyukumuku': return 771;
        case 'type-null': return 772;
        case 'silvally': return 773;
        case 'minior': return 10136;
        case 'minior-core-orange': return 10137;
        case 'minior-core-yellow': return 10138;
        case 'minior-core-green': return 10139;
        case 'minior-core-blue': return 10140;
        case 'minior-core-indigo': return 10141;
        case 'minior-core-violet': return 10142;
        case 'komala': return 775;
        case 'turtonator': return 776;
        case 'togedemaru': return 777;
        case 'mimikyu': return 778;
        case 'bruxish': return 779;
        case 'drampa': return 780;
        case 'dhelmise': return 781;
        case 'jangmo-o': return 782;
        case 'hakamo-o': return 783;
        case 'kommo-o': return 784;
        case 'tapu-koko': return 785;
        case 'tapu-lele': return 786;
        case 'tapu-bulu': return 787;
        case 'tapu-fini': return 788;
        case 'cosmog': return 789;
        case 'cosmoem': return 790;
        case 'solgaleo': return 791;
        case 'lunala': return 792;
        case 'nihilego': return 793;
        case 'buzzwole': return 794;
        case 'pheromosa': return 795;
        case 'xurkitree': return 796;
        case 'celesteela': return 797;
        case 'kartana': return 798;
        case 'guzzlord': return 799;
        case 'necrozma': return 800;
        case 'magearna': return 801;
        case 'magearna-original': return 10147;
        case 'marshadow': return 802;
        case 'poipole': return 803;
        case 'naganadel': return 804;
        case 'stakataka': return 805;
        case 'blacephalon': return 806;
        case 'zeraora': return 807;
        case 'meltan': return 808;
        case 'melmetal': return 809;
        // Gen 8 (Galar) - Add here
        case 'grookey': return 810;
        case 'thwackey': return 811;
        case 'rillaboom': return 812;
        case 'scorbunny': return 813;
        case 'raboot': return 814;
        case 'cinderace': return 815;
        case 'sobble': return 816;
        case 'drizzile': return 817;
        case 'inteleon': return 818;
        case 'skwovet': return 819;
        case 'greedent': return 820;
        case 'rookidee': return 821;
        case 'corvisquire': return 822;
        case 'corviknight': return 823;
        case 'blipbug': return 824;
        case 'dottler': return 825;
        case 'orbeetle': return 826;
        case 'nickit': return 827;
        case 'thievul': return 828;
        case 'gossifleur': return 829;
        case 'eldegoss': return 830;
        case 'wooloo': return 831;
        case 'dubwool': return 832;
        case 'chewtle': return 833;
        case 'drednaw': return 834;
        case 'yamper': return 835;
        case 'boltund': return 836;
        case 'rolycoly': return 837;
        case 'carkol': return 838;
        case 'coalossal': return 839;
        case 'applin': return 840;
        case 'flapple': return 841;
        case 'appletun': return 842;
        case 'silicobra': return 843;
        case 'sandaconda': return 844;
        case 'cramorant': return 845;
        case 'arrokuda': return 846;
        case 'barraskewda': return 847;
        case 'toxel': return 848;
        case 'toxtricity': return 849;
        case 'toxtricity-low-key': return 10184;
        case 'sizzlipede': return 850;
        case 'centiskorch': return 851;
        case 'clobbopus': return 852;
        case 'grapploct': return 853;
        case 'sinistea': return 854;
        case 'polteageist': return 855;
        case 'hatenna': return 856;
        case 'hattrem': return 857;
        case 'hatterene': return 858;
        case 'impidimp': return 859;
        case 'morgrem': return 860;
        case 'grimmsnarl': return 861;
        case 'obstagoon': return 862;
        case 'perrserker': return 863;
        case 'cursola': return 864;
        case 'sirfetchd': return 865;
        case 'mr-rime': return 866;
        case 'runerigus': return 867;
        case 'milcery': return 868;
        case 'alcremie': return 869;
        case 'falinks': return 870;
        case 'pincurchin': return 871;
        case 'snom': return 872;
        case 'frosmoth': return 873;
        case 'stonjourner': return 874;
        case 'eiscue': return 875;
        case 'indeedee': return 876;
        case 'indeedeee-female': return 876;
        case 'morpeko': return 877;
        case 'cufant': return 878;
        case 'copperajah': return 879;
        case 'dracozolt': return 880;
        case 'arctozolt': return 881;
        case 'dracovish': return 882;
        case 'arctovish': return 883;
        case 'duraludon': return 884;
        case 'regieleki': return 894;
        case 'regidrago': return 895;
        case 'zacian': return 888;
        case 'zamazenta': return 889;
        case 'eternatus': return 890;
        case 'kubfu': return 891;
        case 'urshifu': return 892;
        case 'urshifu-rapid-strike': return 10191;
        case 'zarude': return 893;
        case 'zarude-dada': return 10192;
        case 'regieleki': return 894;
        case 'regidrago': return 895;
        case 'glastrier': return 896;
        case 'spectrier': return 897;
        case 'calyrex': return 898;
        case 'wyrdeer': return 899;
        case 'kleavor': return 900;
        case 'ursaluna': return 901;
        case 'basculegion': return 902;
        case 'sneasler': return 903;
        case 'overqwil': return 904;
        case 'enamorus-incarnate': return 905;
        // Gen 9 (Paldea) - Add here
        case 'sprigatito': return 906;
        case 'floragato': return 907;
        case 'meowscarada': return 908;
        case 'fuecoco': return 909;
        case 'crocalor': return 910;
        case 'skeledirge': return 911;
        case 'quaxly': return 912;
        case 'quaxwell': return 913;
        case 'quaquaval': return 914;
        case 'lechonk': return 915;
        case 'oinkologne': return 916;
        case 'tarountula': return 917;
        case 'spidops': return 918;
        case 'nymble': return 919;
        case 'lokix': return 920;
        case 'pawmi': return 921;
        case 'pawmo': return 922;
        case 'pawmot': return 923;
        case 'tandemaus': return 924;
        case 'maushold': return 925;
        case 'fidough': return 926;
        case 'dachsbun': return 927;
        case 'smoliv': return 928;
        case 'dolliv': return 929;
        case 'arboliva': return 930;
        case 'squawkabilly': return 931;
        case 'nacli': return 932;
        case 'naclstack': return 933;
        case 'garganacl': return 934;
        case 'charcadet': return 935;
        case 'armarouge': return 936;
        case 'ceruledge': return 937;
        case 'tadbulb': return 938;
        case 'bellibolt': return 939;
        case 'wattrel': return 940;
        case 'kilowattrel': return 941;
        case 'maschiff': return 942;
        case 'mabosstiff': return 943;
        case 'shroodle': return 944;
        case 'grafaiai': return 945;
        case 'bramblin': return 946;
        case 'brambleghast': return 947;
        case 'toedscool': return 948;
        case 'toedscruel': return 949;
        case 'klawf': return 950;
        case 'capsakid': return 951;
        case 'scovillain': return 952;
        case 'rellor': return 953;
        case 'rabsca': return 954;
        case 'flittle': return 955;
        case 'espathra': return 956;
        case 'tinkatink': return 957;
        case 'tinkatuff': return 958;
        case 'tinkaton': return 959;
        case 'wiglett': return 960;
        case 'wugtrio': return 961;
        case 'bombirdier': return 962;
        case 'finizen': return 963;
        case 'palafin': return 964;
        case 'varoom': return 965;
        case 'revavroom': return 966;
        case 'cyclizar': return 967;
        case 'orthworm': return 968;
        case 'glimmet': return 969;
        case 'glimmora': return 970;
        case 'greavard': return 971;
        case 'houndstone': return 972;
        case 'flamigo': return 973;
        case 'cetoddle': return 974;
        case 'cetitan': return 975;
        case 'veluza': return 976;
        case 'dondozo': return 977;
        case 'tatsugiri': return 978;
        case 'annihilape': return 979;
        case 'clodsire': return 980;
        case 'farigiraf': return 981;
        case 'dudunsparce': return 982;
        case 'kingambit': return 983;
        case 'great-tusk': return 984;
        case 'scream-tail': return 985;
        case 'brute-bonnet': return 986;
        case 'flutter-mane': return 987;
        case 'slither-wing': return 988;
        case 'sandy-shocks': return 989;
        case 'iron-treads': return 990;
        case 'iron-bundle': return 991;
        case 'iron-hands': return 992;
        case 'iron-jugulis': return 993;
        case 'iron-moth': return 994;
        case 'iron-thorns': return 995;
        case 'frigibax': return 996;
        case 'arctibax': return 997;
        case 'baxcalibur': return 998;
        case 'gimmighoul-chest': return 999;
        case 'gholdengo': return 1000;
        case 'wo-chien': return 1001;
        case 'chien-pao': return 1002;
        case 'ting-lu': return 1003;
        case 'chi-yu': return 1004;
        case 'roaring-moon': return 1005;
        case 'iron-valiant': return 1006;
        case 'koraidon': return 1007;
        case 'miraidon': return 1008;
        case 'walking-wake': return 1009;
        case 'iron-leaves': return 1010;
        case 'dipplin': return 1011;
        case 'poltchageist': return 1012;
        case 'sinistcha': return 1013;
        case 'okidogi': return 1014;
        case 'munkidori': return 1015;
        case 'fezandipiti': return 1016;
        case 'ogerpon': return 1017;
        case 'archaludon': return 1018;
        case 'hydrapple': return 1019;
        case 'gouging-fire': return 1020;
        case 'raging-bolt': return 1021;
        case 'iron-boulder': return 1022;
        case 'iron-crown': return 1023;
        case 'terapagos': return 1024;
        case 'pecharunt': return 1025;
        // Regional Forms and others
        case 'rattata-alola': return 10091;
        case 'raticate-alola': return 10092;
        case 'raichu-alola': return 10100;
        case 'sandshrew-alola': return 10101;
        case 'sandslash-alola': return 10102;
        case 'vulpix-alola': return 10103;
        case 'ninetales-alola': return 10104;
        case 'diglett-alola': return 10105;
        case 'dugtrio-alola': return 10106;
        case 'meowth-alola': return 10107;
        case 'persian-alola': return 10108;
        case 'geodude-alola': return 10109;
        case 'graveler-alola': return 10110;
        case 'golem-alola': return 10111;
        case 'grimer-alola': return 10112;
        case 'muk-alola': return 10113;
        case 'exeggutor-alola': return 10114;
        case 'marowak-alola': return 10115;
        case 'meowth-galar': return 10161;
        case 'ponyta-galar': return 10162;
        case 'rapidash-galar': return 10163;
        case 'slowpoke-galar': return 10164;
        case 'slowbro-galar': return 10165;
        case 'farfetchd-galar': return 10166;
        case 'weezing-galar': return 10167;
        case 'mr-mime-galar': return 10168;
        case 'articuno-galar': return 10169;
        case 'zapdos-galar': return 10170;
        case 'moltres-galar': return 10171;
        case 'slowking-galar': return 10172;
        case 'corsola-galar': return 10173;
        case 'zigzagoon-galar': return 10174;
        case 'linoone-galar': return 10175;
        case 'darumaka-galar': return 10176;
        case 'darmanitan-galar': return 10177;
        case 'yamask-galar': return 10179;
        case 'stunfisk-galar': return 10180;
        case 'growlithe-hisui': return 10229;
        case 'arcanine-hisui': return 10230;
        case 'voltorb-hisui': return 10231;
        case 'electrode-hisui': return 10232;
        case 'typhlosion-hisui': return 10233;
        case 'qwilfish-hisui': return 10234;
        case 'sneasel-hisui': return 10235;
        case 'samurott-hisui': return 10236;
        case 'lilligant-hisui': return 10237;
        case 'zorua-hisui': return 10238;
        case 'zoroark-hisui': return 10239;
        case 'braviary-hisui': return 10240;
        case 'sliggoo-hisui': return 10241;
        case 'goodra-hisui': return 10242;
        case 'avalugg-hisui': return 10243;
        case 'decidueye-hisui': return 10244;
        case 'tauros-combat': return 10250;
        case 'tauros-blaze': return 10251;
        case 'tauros-aqua': return 10252;
        case 'wooper-paldea': return 10253;
        case 'wormadam-sandy': return 10004;
        case 'wormadam-trash': return 10005;
        case 'shaymin-sky': return 10006;
        case 'giratina-origin': return 10007;
        case 'rotom-heat': return 10008;
        case 'rotom-wash': return 10009;
        case 'rotom-frost': return 10010;
        case 'rotom-fan': return 10011;
        case 'rotom-mow': return 10012;
        case 'basculin-blue-striped': return 10016;
        case 'tornadus-therian': return 10019;
        case 'thundurus-therian': return 10020;
        case 'landorus-therian': return 10021;
        case 'keldeo-resolute': return 10024;
        case 'meowstic-female': return 10025;
        case 'pumpkaboo-large': return 10027;
        case 'pumpkaboo-small': return 10028;
        case 'pumpkaboo-super': return 10029;
        case 'gourgeist-large': return 10030;
        case 'gourgeist-small': return 10031;
        case 'gourgeist-super': return 10032;
        case 'oinkoologne-female': return 10254;
        case 'dudunsparce-three-segment': return 10255;
        case 'maushold-family-2': return 10257;
        case 'tatsugiri-droopy': return 10258;
        case 'tatsugiri-stretchy': return 10259;
        case 'squawkabilly-blue': return 10260;
        case 'squawkabilly-yellow': return 10261;
        case 'squawkabilly-white': return 10262;
        case 'gimmighoul-roaming': return 10263;
        case 'ursaluna-bloodmoon': return 10272;
        case 'dialga-origin': return 10245;
        case 'palkia-origin': return 10246;
        case 'basculin-white-striped': return 10247;
        case 'basculegion-female': return 10248;
        case 'enamorus-therian': return 10249
        default: return 0; // Default return if not found
    }
}

function saveProgress() {
    localStorage.setItem('encounterCount', encounterCount);
    localStorage.setItem('selectedPokemon', realSelect.value); // Save the value from the real select
    localStorage.setItem('huntingMethod', huntingMethod);
    localStorage.setItem('hasShinyCharm', hasShinyCharm);
    if (startTime) {
        localStorage.setItem('startTime', startTime.toISOString());
    } else {
        localStorage.removeItem('startTime');
    }
    localStorage.setItem('encounteredPokemonCounts', JSON.stringify(encounteredPokemonCounts));
    saveCompletedHunts(); // Save the Pokedex data as well
}

function loadProgress() {
    const savedCount = localStorage.getItem('encounterCount');
    if (savedCount !== null) {
        encounterCount = parseInt(savedCount, 10);
    }
    const savedPokemon = localStorage.getItem('selectedPokemon');
    // Loading of selected pokemon is now handled in populateCustomOptions
    const savedMethod = localStorage.getItem('huntingMethod');
    if (savedMethod !== null) {
        huntingMethod = savedMethod;
        methodSelect.value = savedMethod;
    }
    const savedShinyCharm = localStorage.getItem('hasShinyCharm');
    if (savedShinyCharm !== null) {
        hasShinyCharm = savedShinyCharm === 'true';
        shinyCharmCheckbox.checked = hasShinyCharm;
    }
    const savedStartTime = localStorage.getItem('startTime');
    if (savedStartTime) {
        startTime = new Date(savedStartTime);
    }
    const savedEncounterCounts = localStorage.getItem('encounteredPokemonCounts');
    if (savedEncounterCounts) {
        encounteredPokemonCounts = JSON.parse(savedEncounterCounts);
    }
    updateShinyOddsDisplay();
    updateCountDisplay();
    displayPokedex(); // Load and display the Pokedex on page load
}

function finishHuntAndDownload() {
    if (currentPokemon === 'none' || !currentPokemon) {
        alert('Please select a Pokémon to finish the hunt.');
        return;
    }

    const endTime = new Date();

    alert('Hunt finished! Your progress has been saved.');

    if (!completedHunts.includes(currentPokemon)) {
        completedHunts.push(currentPokemon);
        saveCompletedHunts();
        displayPokedex(); // Update the display
    } else {
        alert(`You have already finished a hunt for ${currentPokemon.charAt(0).toUpperCase() + currentPokemon.slice(1)}!`);
    }

    encounterCount = 0;
    currentPokemon = '';
    if (realSelect) realSelect.value = 'none';
    if (selectTrigger) selectTrigger.querySelector('span').textContent = 'Select a Pokémon';
    methodSelect.value = 'encounters';
    shinyCharmCheckbox.checked = false;
    startTime = null;
    encounteredPokemonCounts = {};
    updateCountDisplay();
    saveProgress();

    // Keep this line to clear the textarea
    huntNotesInput.value = '';
}

if (finishHuntButton) {
    finishHuntButton.addEventListener('click', finishHuntAndDownload);
} else {
    console.error("Finish hunt button not found in the DOM.");
}

// Call populateCustomOptions after the DOM is loaded
populateCustomOptions();
displayPokedex();
loadProgress();

window.scrollTo(0, 0); // Force scroll to top on load

    // Call populateCustomOptions to populate the custom dropdown
    if (fullPokedex.length > 0) {
        populateCustomOptions();
    } else {
        console.warn("fullPokedex is empty or not yet loaded. Ensure it's populated before populateCustomOptions is called.");
    }
});