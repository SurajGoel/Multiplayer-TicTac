$(document).ready(function() {

    /**
     * Our online play object handler
     */
    var onlinePlayHandler = function() {
        console.log("Socket lIVEEEE");
        var socket = io.connect('wss://open-source-sgoel01.c9users.io');
        var myId = null;
        var oppositionName = null;
        var myMarker = null;
        var oppositionMarker = null;
        var firstPlayer = null;

        socket.on('register', function(data) {
            console.log('On Register ');
            console.log(data);
            data = JSON.parse(data);
            myId = data.clientId;
            oppositionName = data.oppositionName;
            firstPlayer = data.firstPlayer;
            myMarker = data.myMarker;
            oppositionMarker = data.oppositionMarker;
            $('#self-name').text('You: ' + $('#nameText').val() + ' (' + myMarker + ')');
            $('#opposition-name').text('Opponent: ' + oppositionName + ' (' +
                oppositionMarker + ')');
            $('#onlinePlayers').show();
            if (firstPlayer) {
                ticTac.setCurrentPlayer(myMarker);
                $('#self-name').css('font-weight', 'bold');
                $('#opposition-name').css('font-weight', '');
                $('#tictactoe-board td').click(onClick);
            }
            else {
                ticTac.setCurrentPlayer(oppositionMarker);
                $('#self-name').css('font-weight', '');
                $('#opposition-name').css('font-weight', 'bold');
            }
        });

        socket.on('play', function(data) {
            ticTac.setCurrentPlayer(myMarker);
            data = JSON.parse(data);
            console.log('On play');
            console.log(data);
            ticTac.selectCell(data.gridPosition);
            $('#tictactoe-board td').click(onClick);
        });

        socket.on('close', function(data) {
            ticTac.resetGame();
            $('#messageStack').text("Your online Opposition left the game");
            $('#tictactoe-board').hide();
            delete this;
        });

        socket.on('win', function(data) {
            data = JSON.parse(data);
            ticTac.selectCell(data.gridPosition);
            alert('You Loose');
            ticTac.resetGame();
        });

        this.playNext = function(gridPosition) {
            ticTac.setCurrentPlayer(oppositionMarker);
            $('#self-name').css('font-weight', '');
            $('#opposition-name').css('font-weight', 'bold');
            socket.emit('play', JSON.stringify({
                clientId: myId,
                data: gridPosition
            }))
        };

        this.sendWin = function(gridPosition) {
            alert('You Won !!!');
            socket.emit('win', JSON.stringify({
                clientId: myId,
                data: gridPosition
            }))
        };

        this.register = function(name) {
            $('#tictactoe-board').unbind('click');
            socket.emit('register', JSON.stringify({
                name: name
            }))
        };

        this.getOppositionName = function() {
            return oppositionName;
        }
    };

    /**
     * Our Game Object.
     */
    var game = function() {

        // Current Game Mode. Three possible : online, singleplayer, two-players.
        var gameMode = 'singlePlayer';
        const modes = {
            'singlePlayer': 'Single Player',
            'twoPlayers': 'Two Players',
            'online': 'Online'
        };

        var onlineHandler = null;

        // Current PLayer
        // Todo Model a better player and markings assignment.
        var currentPlayer = null;
        var myself = 'X';
        var other = 'O'; // Could be Computer, other player in online or twoPLayers game.

        // Win Patterns for the game.
        const WinPatterns = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [6, 4, 2]
        ];

        this.lastSelected = null;

        /**
         * Function for necessary changes to make if playing singlePlayer
         */
        this.playSinglePlayer = function() {
            if (currentPlayer === other) {
                currentPlayer = myself;
            }
            else {
                currentPlayer = other;
                this.computerPlayerMove();
            }
        };

        /**
         * Function for necessary changes to make if playing online.
         */
        this.playOnline = function() {
            onlineHandler.playNext(this.lastSelected);
        };

        /**
         * Function to make necessary changes if playing with another Person (twoPlayers).
         * Modelling myself as player 1 and other as player 2.
         */
        this.playTwoPlayers = function() {
            currentPlayer = (currentPlayer === myself) ? other : myself;
        };

        /**
         * Function to determine what is the next move based on selected gameMode.
         */
        this.nextMove = function() {
            if (gameMode === 'singlePlayer') this.playSinglePlayer();
            else if (gameMode === 'online') this.playOnline();
            else this.playTwoPlayers();
        };

        /**
         * Selects the "cell" on the actual game board. Returns true if success otherwise false.
         * @param cell
         * @returns boolean
         */
        this.selectCell = function(cell) {
            console.log('You Chose ' + cell);
            if ($(cell).attr('class') !== '') {
                console.log('Grid Already been selected');
                $('#messageStack').text('Grid Already Selected. Select Another');
                return false;
            }
            else {
                console.log("Adding Class");
                $(cell).addClass('selectedBy' + currentPlayer);
                $(cell).html(currentPlayer);
                this.lastSelected = cell;
                return true;
            }
        };

        this.winHandler = function(winner) {
            if (gameMode === 'singlePlayer' || gameMode === 'twoPlayers') return offlineWinHandler(winner);
            else onlineWinHandler();
        };

        function offlineWinHandler(winner) {
            alert('Player : ' + winner + ' Won !!');
        }

        function onlineWinHandler() {
            onlineHandler.sendWin(this.lastSelected);
        }

        /**
         * Returns whether game has a winner or not.
         * @returns {*}
         */
        this.isWinner = function() {
            if (this.checkWinner('X')) return 'X';
            if (this.checkWinner('O')) return 'O';
            if ($('#tictactoe-board td.selectedByX').length +
                $('#tictactoe-board td.selectedByO').length === 9) return 'draw';
            return -1;
        };

        /**
         * Tells whether player playing "marker" has won the game or not.
         * @param marker
         * @returns {boolean}
         */
        this.checkWinner = function(marker) {
            var classMarker = $('#tictactoe-board td.selectedBy' + marker);
            var selectedGrids = '';
            if (classMarker.length >= 3) {
                selectedGrids = classMarker.map(function() {
                    return $(this).attr('id').substring(5);
                }).get();
                return this.checkWinPatternMatch(selectedGrids);
            }
            else return false;
        };

        /**
         * Compares selectedGrids with the WinPatterns and returns boolean based on that.
         * @param selectedGrids
         * @returns {boolean}
         */
        this.checkWinPatternMatch = function(selectedGrids) {
            var winnerGridCount = 0;
            var result = false;
            $.each(WinPatterns, function(index, value) {
                $.each(value, function(index, pattern) {
                    if ($.inArray(pattern.toString(), selectedGrids) > -1) winnerGridCount++;
                });
                if (winnerGridCount === 3) result = true;
                winnerGridCount = 0;
            });
            return result;
        };

        /**
         * Computer Player Move when playing in Single Player Mode. Also Responsible
         * for Progressing the Game.
         */
        this.computerPlayerMove = function() {
            var unselectedGrids = $('#tictactoe-board td[class=""]').map(function() {
                return $(this).attr("id");
            }).get();
            var randomGrid = unselectedGrids[Math.floor(Math.random() * unselectedGrids.length)];
            this.selectCell($('#' + randomGrid));
            progressGame();
        };

        this.setOnline = function() {
            onlineHandler = new onlinePlayHandler();
            onlineHandler.register($('#nameText').val());
        };

        this.resetGame = function() {
            $('#menu').hide();
            $('#notification').hide();
            $('#tictactoe-board').show();
            $('#messageStack').hide();
            $('#exitButton').show();
            this.cleanUpGrid();
            this.setGameMode(gameMode);
        };

        this.cleanUpGrid = function() {
            $("#tictactoe-board td").html('');
            $("#tictactoe-board td").attr('class', '');
        };

        this.setGameMode = function(mode) {
            gameMode = mode;
            $('#gameMode').text('Selected Game Mode : ' + modes[mode]);
            $('#nameText').hide();
            if (gameMode === 'online') return this.setOnline();
            currentPlayer = myself;
        };

        this.setCurrentPlayer = function(marker) {
            currentPlayer = marker;
        }
    };

    /**
     * This Function will be called every time, after each move to handle the logic of the game.
     */
    function progressGame() {
        var result = ticTac.isWinner();
        console.log("Result : " + result);
        if (result === -1) {
            ticTac.nextMove();
            return;
        }
        else if (result === 'draw') alert('Game Drawn');
        else ticTac.winHandler(result);
        ticTac.resetGame();
    }

    var ticTac = null;

    /**
     * Click Event for Each cell on the board.
     */
    $('#tictactoe-board td').click(onClick);

    $('#singlePlayer').click(function(e) {
        ticTac = new game();
        ticTac.resetGame();
        ticTac.setGameMode('singlePlayer');
    });

    $('#twoPlayers').click(function(e) {
        ticTac = new game();
        ticTac.resetGame();
        ticTac.setGameMode('twoPlayers');
    });

    $('#online').click(function(e) {
        ticTac = new game();
        if (!checkName()) {
            $('#messageStack').show();
            return;
        }
        $('#messageStack').hide();
        ticTac.resetGame();
        ticTac.setGameMode('online');
    });

    $('#exitButton').click(function(e) {
        delete ticTac;
        $('#gameMode').text('Choose Your Game Mode');
        $('#menu').show();
        $('#notification').show();
        $('#tictactoe-board').hide();
        $('#exitButton').hide();
        $('#messageStack').hide();
        $('#nameText').show();
        $('#onlinePlayers').hide();
    });

    function onClick(e) {
        if (!ticTac.selectCell($(this))) return;
        progressGame();
    }

    function checkName() {
        if ($('#nameText').val() === '') return false;
        return true;
    }
});
