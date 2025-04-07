// Variables globales
let selectedPlayerId = null;
let playerData = {};
let teamsData = [];

// Datos precargados para el despliegue estático
const NBA_TEAMS = [
  {"id": "1610612737", "full_name": "Atlanta Hawks", "abbreviation": "ATL"},
  {"id": "1610612738", "full_name": "Boston Celtics", "abbreviation": "BOS"},
  {"id": "1610612751", "full_name": "Brooklyn Nets", "abbreviation": "BKN"},
  {"id": "1610612766", "full_name": "Charlotte Hornets", "abbreviation": "CHA"},
  {"id": "1610612741", "full_name": "Chicago Bulls", "abbreviation": "CHI"},
  {"id": "1610612739", "full_name": "Cleveland Cavaliers", "abbreviation": "CLE"},
  {"id": "1610612742", "full_name": "Dallas Mavericks", "abbreviation": "DAL"},
  {"id": "1610612743", "full_name": "Denver Nuggets", "abbreviation": "DEN"},
  {"id": "1610612765", "full_name": "Detroit Pistons", "abbreviation": "DET"},
  {"id": "1610612744", "full_name": "Golden State Warriors", "abbreviation": "GSW"},
  {"id": "1610612745", "full_name": "Houston Rockets", "abbreviation": "HOU"},
  {"id": "1610612754", "full_name": "Indiana Pacers", "abbreviation": "IND"},
  {"id": "1610612746", "full_name": "Los Angeles Clippers", "abbreviation": "LAC"},
  {"id": "1610612747", "full_name": "Los Angeles Lakers", "abbreviation": "LAL"},
  {"id": "1610612763", "full_name": "Memphis Grizzlies", "abbreviation": "MEM"},
  {"id": "1610612748", "full_name": "Miami Heat", "abbreviation": "MIA"},
  {"id": "1610612749", "full_name": "Milwaukee Bucks", "abbreviation": "MIL"},
  {"id": "1610612750", "full_name": "Minnesota Timberwolves", "abbreviation": "MIN"},
  {"id": "1610612740", "full_name": "New Orleans Pelicans", "abbreviation": "NOP"},
  {"id": "1610612752", "full_name": "New York Knicks", "abbreviation": "NYK"},
  {"id": "1610612760", "full_name": "Oklahoma City Thunder", "abbreviation": "OKC"},
  {"id": "1610612753", "full_name": "Orlando Magic", "abbreviation": "ORL"},
  {"id": "1610612755", "full_name": "Philadelphia 76ers", "abbreviation": "PHI"},
  {"id": "1610612756", "full_name": "Phoenix Suns", "abbreviation": "PHX"},
  {"id": "1610612757", "full_name": "Portland Trail Blazers", "abbreviation": "POR"},
  {"id": "1610612758", "full_name": "Sacramento Kings", "abbreviation": "SAC"},
  {"id": "1610612759", "full_name": "San Antonio Spurs", "abbreviation": "SAS"},
  {"id": "1610612761", "full_name": "Toronto Raptors", "abbreviation": "TOR"},
  {"id": "1610612762", "full_name": "Utah Jazz", "abbreviation": "UTA"},
  {"id": "1610612764", "full_name": "Washington Wizards", "abbreviation": "WAS"}
];

// Elementos DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar formulario de filtros
    const statsFilterForm = document.getElementById('stats-filter-form');
    const lastGamesRadios = document.querySelectorAll('input[name="last-games"]');
    const seasonSelect = document.getElementById('season');
    const seasonTypeSelect = document.getElementById('season-type');
    const teamSelect = document.getElementById('team-select');
    const playerSelect = document.getElementById('player-select');
    const playersContainer = document.getElementById('players-container');
    
    // Cargar equipos al iniciar
    loadTeams();
    
    // Manejar cambios en los filtros
    lastGamesRadios.forEach(radio => {
        radio.addEventListener('change', updatePlayerStats);
    });
    
    seasonSelect.addEventListener('change', function() {
        updatePlayerStats();
        // Si hay un equipo seleccionado, actualizar la lista de jugadores
        if (teamSelect.value) {
            loadTeamPlayers(teamSelect.value);
        }
    });
    
    seasonTypeSelect.addEventListener('change', updatePlayerStats);
    
    // Manejar selección de equipo
    teamSelect.addEventListener('change', function() {
        const teamId = this.value;
        if (teamId) {
            loadTeamPlayers(teamId);
            playersContainer.style.display = 'block';
        } else {
            playersContainer.style.display = 'none';
            playerSelect.innerHTML = '<option value="">Seleccionar jugador</option>';
        }
    });
    
    // Manejar selección de jugador
    playerSelect.addEventListener('change', function() {
        const playerId = this.value;
        if (playerId) {
            selectPlayer(playerId);
        }
    });
});

// Función para cargar equipos (versión estática)
function loadTeams() {
    teamsData = NBA_TEAMS;
    const teamSelect = document.getElementById('team-select');
    
    // Limpiar opciones existentes
    teamSelect.innerHTML = '<option value="">Seleccionar equipo</option>';
    
    // Agregar equipos al selector
    teamsData.forEach(team => {
        const option = document.createElement('option');
        option.value = team.id;
        option.textContent = team.full_name;
        teamSelect.appendChild(option);
    });
}

// Función para cargar jugadores de un equipo (versión estática)
function loadTeamPlayers(teamId) {
    // Datos de ejemplo para demostración
    const TEAM_PLAYERS = {
        "1610612737": [ // Atlanta Hawks
            {"id": "1629631", "name": "De'Andre Hunter", "position": "F"},
            {"id": "1630175", "name": "Jalen Johnson", "position": "F"},
            {"id": "1629027", "name": "Trae Young", "position": "G"}
        ],
        "1610612738": [ // Boston Celtics
            {"id": "1628369", "name": "Jayson Tatum", "position": "F"},
            {"id": "1627759", "name": "Jaylen Brown", "position": "G-F"},
            {"id": "1629684", "name": "Payton Pritchard", "position": "G"}
        ],
        "1610612742": [ // Dallas Mavericks
            {"id": "1629029", "name": "Luka Dončić", "position": "F-G"},
            {"id": "202696", "name": "Kyrie Irving", "position": "G"},
            {"id": "1626153", "name": "P.J. Washington", "position": "F"}
        ],
        "1610612747": [ // Los Angeles Lakers
            {"id": "2544", "name": "LeBron James", "position": "F"},
            {"id": "203076", "name": "Anthony Davis", "position": "F-C"},
            {"id": "1628386", "name": "D'Angelo Russell", "position": "G"}
        ]
    };
    
    // Si no tenemos datos para este equipo, mostrar jugadores genéricos
    const players = TEAM_PLAYERS[teamId] || [
        {"id": "player1", "name": "Jugador 1", "position": "G"},
        {"id": "player2", "name": "Jugador 2", "position": "F"},
        {"id": "player3", "name": "Jugador 3", "position": "C"}
    ];
    
    const playerSelect = document.getElementById('player-select');
    
    // Limpiar opciones existentes
    playerSelect.innerHTML = '<option value="">Seleccionar jugador</option>';
    
    // Agregar jugadores al selector
    players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.id;
        option.textContent = `${player.name} (${player.position})`;
        playerSelect.appendChild(option);
    });
}

// Función para seleccionar un jugador (versión estática)
function selectPlayer(playerId) {
    selectedPlayerId = playerId;
    
    // Datos de ejemplo para demostración
    const playerInfo = {
        "DISPLAY_FIRST_LAST": "Jugador Ejemplo",
        "TEAM_NAME": "Equipo NBA",
        "POSITION": "G-F",
        "HEIGHT": "6'7\"",
        "WEIGHT": "215",
        "AGE": "26",
        "SEASON_EXP": "5",
        "PERSON_ID": playerId
    };
    
    // Datos específicos para jugadores conocidos
    if (playerId === "1629029") { // Luka Dončić
        playerInfo.DISPLAY_FIRST_LAST = "Luka Dončić";
        playerInfo.TEAM_NAME = "Dallas Mavericks";
        playerInfo.POSITION = "F-G";
        playerInfo.HEIGHT = "6'7\"";
        playerInfo.WEIGHT = "230";
        playerInfo.AGE = "25";
        playerInfo.SEASON_EXP = "6";
    } else if (playerId === "2544") { // LeBron James
        playerInfo.DISPLAY_FIRST_LAST = "LeBron James";
        playerInfo.TEAM_NAME = "Los Angeles Lakers";
        playerInfo.POSITION = "F";
        playerInfo.HEIGHT = "6'9\"";
        playerInfo.WEIGHT = "250";
        playerInfo.AGE = "39";
        playerInfo.SEASON_EXP = "21";
    } else if (playerId === "1628369") { // Jayson Tatum
        playerInfo.DISPLAY_FIRST_LAST = "Jayson Tatum";
        playerInfo.TEAM_NAME = "Boston Celtics";
        playerInfo.POSITION = "F";
        playerInfo.HEIGHT = "6'8\"";
        playerInfo.WEIGHT = "210";
        playerInfo.AGE = "26";
        playerInfo.SEASON_EXP = "7";
    }
    
    playerData = playerInfo;
    displayPlayerInfo(playerInfo);
    updatePlayerStats();
}

// Función para mostrar información del jugador
function displayPlayerInfo(playerInfo) {
    // Mostrar sección de información del jugador
    const playerInfoSection = document.getElementById('player-info');
    playerInfoSection.classList.remove('d-none');
    
    // Actualizar datos del jugador
    document.getElementById('player-full-name').textContent = playerInfo.DISPLAY_FIRST_LAST || '';
    document.getElementById('player-team').textContent = playerInfo.TEAM_NAME || '';
    document.getElementById('player-position').textContent = playerInfo.POSITION || '';
    document.getElementById('player-height').textContent = playerInfo.HEIGHT || '';
    document.getElementById('player-weight').textContent = playerInfo.WEIGHT ? `${playerInfo.WEIGHT} lbs` : '';
    document.getElementById('player-age').textContent = playerInfo.AGE || '';
    document.getElementById('player-experience').textContent = playerInfo.SEASON_EXP ? `${playerInfo.SEASON_EXP} años` : '';
    
    // Actualizar imagen del jugador (usando la API de NBA para imágenes)
    const playerImage = document.getElementById('player-image');
    playerImage.src = `https://cdn.nba.com/headshots/nba/latest/1040x760/${playerInfo.PERSON_ID}.png`;
    playerImage.onerror = function() {
        // Si la imagen no está disponible, usar una imagen de respaldo
        this.src = 'https://cdn.nba.com/headshots/nba/latest/1040x760/logoman.png';
    };
}

// Función para actualizar estadísticas del jugador (versión estática)
function updatePlayerStats() {
    if (!selectedPlayerId) return;
    
    // Obtener valores de filtros
    const lastGames = document.querySelector('input[name="last-games"]:checked').value;
    const season = document.getElementById('season').value;
    const seasonType = document.getElementById('season-type').value;
    
    // Mostrar indicador de carga
    const statsContainer = document.getElementById('stats-container');
    statsContainer.classList.remove('d-none');
    const statsTableBody = document.getElementById('stats-table-body');
    statsTableBody.innerHTML = '<tr><td colspan="12" class="text-center">Cargando estadísticas...</td></tr>';
    
    // Mostrar sección de promedios
    const averagesContainer = document.getElementById('averages-container');
    averagesContainer.classList.remove('d-none');
    
    // Generar datos de ejemplo para demostración
    setTimeout(() => {
        // Datos de estadísticas de ejemplo
        const gameStats = [];
        const teams = ["Lakers", "Celtics", "Bucks", "Heat", "Suns", "Clippers", "Nuggets", "76ers", "Nets", "Mavericks", "Warriors", "Raptors", "Hawks", "Grizzlies", "Knicks"];
        
        // Generar estadísticas para el número de partidos seleccionado
        for (let i = 0; i < parseInt(lastGames); i++) {
            const opponent = teams[Math.floor(Math.random() * teams.length)];
            const date = new Date();
            date.setDate(date.getDate() - (i * 2)); // Cada 2 días
            
            // Estadísticas aleatorias realistas
            const minutes = Math.floor(Math.random() * 15) + 25; // 25-40 minutos
            const points = Math.floor(Math.random() * 25) + 10; // 10-35 puntos
            const rebounds = Math.floor(Math.random() * 10) + 2; // 2-12 rebotes
            const assists = Math.floor(Math.random() * 8) + 2; // 2-10 asistencias
            const threesMade = Math.floor(Math.random() * 6); // 0-6 triples anotados
            const threesAttempted = threesMade + Math.floor(Math.random() * 4); // Intentos de triples
            const blocks = Math.floor(Math.random() * 3); // 0-3 bloqueos
            const steals = Math.floor(Math.random() * 4); // 0-4 robos
            const plusMinus = Math.floor(Math.random() * 30) - 15; // -15 a +15
            
            gameStats.push({
                GAME_DATE: date.toLocaleDateString(),
                MATCHUP: `vs. ${opponent}`,
                MIN: minutes,
                PTS: points,
                REB: rebounds,
                AST: assists,
                FG3M: threesMade,
                FG3A: threesAttempted,
                FG3_PCT: threesMade / threesAttempted,
                BLK: blocks,
                STL: steals,
                PLUS_MINUS: plusMinus
            });
        }
        
        // Calcular promedios
        const avgPoints = gameStats.reduce((sum, game) => sum + game.PTS, 0) / gameStats.length;
        const avgRebounds = gameStats.reduce((sum, game) => sum + game.REB, 0) / gameStats.length;
        const avgAssists = gameStats.reduce((sum, game) => sum + game.AST, 0) / gameStats.length;
        const avgThrees = gameStats.reduce((sum, game) => sum + game.FG3M, 0) / gameStats.length;
        
        // Actualizar promedios en la interfaz
        document.getElementById('avg-points').textContent = avgPoints.toFixed(1);
        document.getElementById('avg-rebounds').textContent = avgRebounds.toFixed(1);
        document.getElementById('avg-assists').textContent = avgAssists.toFixed(1);
        document.getElementById('avg-threes').textContent = avgThrees.toFixed(1);
        
        // Actualizar tabla de estadísticas
        statsTableBody.innerHTML = '';
        gameStats.forEach(game => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${game.GAME_DATE}</td>
                <td>${game.MATCHUP}</td>
                <td>${game.MIN}</td>
                <td>${game.PTS}</td>
                <td>${game.REB}</td>
                <td>${game.AST}</td>
                <td>${game.FG3M}</td>
                <td>${game.FG3A}</td>
                <td>${(game.FG3_PCT * 100).toFixed(1)}%</td>
                <td>${game.BLK}</td>
                <td>${game.STL}</td>
                <td>${game.PLUS_MINUS > 0 ? '+' + game.PLUS_MINUS : game.PLUS_MINUS}</td>
            `;
            statsTableBody.appendChild(row);
        });
    }, 1000); // Simular tiempo de carga
}
