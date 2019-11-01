const N = 1;
const E = 2;
const S = 4;
const W = 8;

var cell_walls = {
    2: new Phaser.Point(1, 0), 8: new Phaser.Point(-1, 0),
    4: new Phaser.Point(0, 1), 1: new Phaser.Point(0, -1)
}

function getDir(x, y) {
    var dir = 0;
    if (y > 0) {
        dir += S;
    } else if (y < 0)
    {
        dir += N;
    }
    if (x > 0) {
        dir += E;
    } else if (x < 0)
    {
        dir += W;
    }
    return dir;
}

Level = function(main, game, width, height) {
    this.main = main;
    this.game = game;
    this.width = width;
    this.height = height;
    this.chunks = [];
    this.widthInPixels = 1024 * width;
    this.heightInPixels = 1024 * height;
    this.nextEnemyIndex = 0;

    this.createGroups();
    
    this.map = game.add.tilemap('level-all');
    this.map.addTilesetImage('Terrain', 'Terrain');
    
    this.generator = new LevelGenerator(width, height);
    this.generator.generate();

    this.templates = [];
    for (var i = 0; i < 16; ++i) 
    {
        var template = game.add.tilemap('template-'+i.toString().padStart(2, '0'));
        this.templates.push(template);
    }
    for (var y = 0; y < height; ++y) {
        var row = [];
        for (var x = 0; x < width; ++x) {
            var index = this.generator.blocks[y][x].walls;
            var template = this.templates[index];
            this.updateMapFromTemplate(x, y, template);
            row.push(new Chunk(this, game, template, x, y));

            // Add to minimap
            var tile = this.game.make.sprite(10 + 8 * x, MINIMAP_Y + 8 * y, 'maze', index);
            tile.fixedToCamera = true;
            this.uiGroup.add(tile);
        }
        this.chunks.push(row);
    }

    this.background = this.map.createLayer(BACKGROUND_LAYER, undefined, undefined, this.bgGroup);
    this.ground = this.map.createLayer(LEVEL_LAYER, undefined, undefined, this.levelGroup);
}

Level.prototype.createGroups = function() {
    // The layers are created in a specific order to allow 
    // groups to be interleaved with the level
    this.bgGroup = game.add.group();
    this.levelGroup = game.add.group();
    this.fxGroup = game.add.group();
    this.playerGroup = game.add.group();
    this.enemyGroup = game.add.group();
    this.towerGroup = game.add.group();
    this.bulletGroup = game.add.group();
    this.foreGroup = game.add.group();
    this.obstacles = game.add.group();
    // Last is UI
    this.uiGroup = game.add.group();
}

Level.prototype.setPlayer = function(player) {
    this.player = player;
    this.playerGroup.add(player);
}

Level.prototype.createGameObjects = function() {
    for (var y = 0; y < this.height; ++y) {
        for (var x = 0; x < this.width; ++x) {
            var chunk = this.chunks[y][x];
            chunk.createEnemies();
            chunk.createTowers();
            chunk.createPickUps();
        }
    }
}

Level.prototype.updateMapFromTemplate = function(x, y, template) {
    var layer = this.map.layers[this.map.getLayer(LEVEL_LAYER)];
    var background = this.map.layers[this.map.getLayer(BACKGROUND_LAYER)];
    var chunkLayer = template.layers[this.map.getLayer(LEVEL_LAYER)];
    var chunkBg = template.layers[this.map.getLayer(BACKGROUND_LAYER)];

    var xOffset = x * 16;
    var yOffset = y * 16;
    for (var i = 0; i < chunkLayer.data.length; ++i)
    {
        var row = chunkLayer.data[i];
        var bgrow = chunkBg.data[i];
        for (var c = 0; c < row.length; ++c)
        {
            var tile = row[c];
            var bg = bgrow[c];
            layer.data[i + yOffset][c + xOffset].index = tile.index;
            background.data[i + yOffset][c + xOffset].index = bg.index;
        }
    }
}

Level.prototype.update = function() {
    for (var y = 0; y < this.height; ++y) {
        for (var x = 0; x < this.width; ++x) {
            var chunk = this.chunks[y][x];
            if (chunk.overlapsChunk(this.player, this.player.x, this.player.y, GAME_WIDTH / 2))
            {
                chunk.setActive(true);
            } else {
                chunk.setActive(false);
            }
        }
    }
}

Level.prototype.collideWith = function(sprite) {
    for (var y = 0; y < this.height; ++y) {
        for (var x = 0; x < this.width; ++x) {
            var chunk = this.chunks[y][x];
            if (chunk.active) {
                chunk.collideWith(sprite);
            }
        }
    }
}

Level.prototype.processObjectCollisions = function() {
    for (var y = 0; y < this.height; ++y) {
        for (var x = 0; x < this.width; ++x) {
            var chunk = this.chunks[y][x];
            if (chunk.active) {
                chunk.processObjectCollisions(this.player, this.bulletHitPlayer, this.bulletHitEnemy, this.bulletsCollide, this);
            }
        }
    }
}

Level.prototype.bulletsCollide = function(playerBullet, enemyBullet) {
    this.bulletExplode(playerBullet);
    enemyBullet.kill();
}

Level.prototype.bulletHitPlayer = function(player, bullet) {
    if (!bullet.hitPlayer)
    {
        bullet.hitPlayer = true;
        player.flash();
        this.game.time.events.add(Phaser.Timer.SECOND * bullet.reflectTime, bullet.kill, bullet);
        this.player.damage(bullet.damage);
    }
}

Level.prototype.bulletHitEnemy = function(bullet, enemy) {
    var destroyed = enemy.damage(bullet);
    var world = enemy.getWorldPos();
    if (destroyed)
    {
    }
    bullet.kill();
}

Level.prototype.bulletExplode = function(bullet, kill = true) {
    if (!bullet || !bullet.data.bulletManager) {
        return;
    }
    var x = bullet.x;
    var y = bullet.y;
    var expl = this.game.add.sprite(x, y, 'small_explosion');
    expl.animations.add('explode', [0, 1, 2, 3, 4], 10, false);
    expl.anchor.setTo(0.5, 0.5);
    expl.scale.setTo(0.5, 0.5);
    expl.animations.play('explode');
    game.time.events.add(Phaser.Timer.SECOND * 0.6, this.cleanupThis, expl);
    
    this.drawRandomStainFX(1, x, y);
    bullet.hitPlayer = false;
    if (kill) {
        bullet.kill();
    }
}

Level.prototype.addLargeExplosion = function(x, y) {
    explosion = game.add.sprite(x, y, 'explosion');
    explosion.animations.add('explode', [0, 1, 2, 3, 4, 5, 6, 7, 8], 18, false);
    explosion.anchor.setTo(0.5, 0.5);
    explosion.animations.play('explode');
    this.game.time.events.add(Phaser.Timer.SECOND * 0.6, this.cleanupThis, explosion);
}

Level.prototype.drawRandomStainFX = function(scale, x, y, alpha) {
    if (alpha == undefined) { alpha = 0.65; }
    var stain = this.game.make.sprite(0, 0, Phaser.ArrayUtils.getRandomItem(STAINS, 0, STAINS.length));
    stain.anchor.setTo(0.5, 0.5);
    if (scale != 1) {
        stain.scale.setTo(scale, scale);
    }
    this.drawFX(stain, x, y, alpha);
}

Level.prototype.drawTracks = function(track, x, y) {
    this.drawFX(track, x, y);
}

Level.prototype.drawFX = function(sprite, inx, iny, alpha) {
    for (var y = 0; y < this.height; ++y) {
        for (var x = 0; x < this.width; ++x) {
            var chunk = this.chunks[y][x];
            if (chunk.active) {
                chunk.draw(sprite, inx, iny, alpha);
            }
        }
    }
}

Level.prototype.cleanupThis = function() {
    this.destroy();
}

Level.prototype.render = function() {
    for (var y = 0; y < this.height; ++y) {
        for (var x = 0; x < this.width; ++x) {
            var chunk = this.chunks[y][x];
            chunk.render();
        }
    }
}


Block = function(level, x, y) {
    this.x = x;
    this.y = y;
    this.level = level;

    this.visited = false;
    this.walls = N | E | S | W;
}

Block.prototype.randomAvailableNeighbour = function(rnd) {
    neighbours = this.availableNeigbours();
    return neighbours[rnd.integerInRange(0, neighbours.length - 1)];
}

Block.prototype.neighbours = function() {
    if (this._neighbours) {
        return this._neighbours;
    }

    this._neighbours = [];
    if (this.x > 0) {
        this._neighbours.push(this.neighbour(-1, 0));
    }
    if (this.x < this.level.hBlocks - 1) {
        this._neighbours.push(this.neighbour(1, 0));
    }
    
    if (this.y > 0) {
        this._neighbours.push(this.neighbour(0, -1));
    }
    
    if (this.y < this.level.vBlocks - 1) {
        this._neighbours.push(this.neighbour(0, 1));
    }
    
    return this._neighbours;
}

Block.prototype.availableNeigbours = function() {
    var neighbours = this.neighbours();
    return neighbours.filter(function(n) {return !n.visited;});
}

Block.prototype.neighbour = function(relX, relY) {
    var x = this.x + relX;
    var y = this.y + relY;
    if (x >= 0 && x < this.level.hBlocks && y >= 0 && y < this.level.vBlocks) {
        return this.level.blocks[y][x];
    }
}

Block.prototype.oppositeDir = function(dir) {
    if (dir == N) return S;
    if (dir == S) return N;
    if (dir == E) return W;
    if (dir == W) return E;
}

Block.prototype.connectTo = function(dir) {
    var offset = cell_walls[dir];
    var block = this.neighbour(offset.x, offset.y);
    block.walls &= ~this.oppositeDir(dir);
    this.walls &= ~dir;
}

Block.prototype.connectedTo = function(dir) {
    var connected = (this.walls & dir) == 0;
    return connected;
}

LevelGenerator = function (hBlocks, vBlocks) {
    //var seed = (Date.now() * Math.random()).toString();
    var seed = '272661291738.15836';
    console.log("Seed = " + seed);
    this.rnd = new Phaser.RandomDataGenerator([ seed ]);

    this.hBlocks = hBlocks;
    this.vBlocks = vBlocks;
    this.finished = false;
    this.blocks = [];
    this.history = [];
    this.currentBlock = undefined;
    this.initBlocks();
}

LevelGenerator.prototype.initBlocks = function () {
    for (var y = 0; y < this.vBlocks; ++y) {
        var row = [];
        for (var x = 0; x < this.hBlocks; ++x) {
            row.push(new Block(this, x, y));
        }
        this.blocks.push(row);
    }
}

LevelGenerator.prototype.generate = function () {
    while (!this.finished) {
        this.step();
    }
}

LevelGenerator.prototype.step = function () {
    var oldBlock = this.currentBlock;
    var currentBlock = this.currentBlock = this.chooseBlock();

    if (!currentBlock) {
        this.finished = true;
        return;
    }

    currentBlock.visited = true;
    if (!currentBlock.inHistory) {
        this.history.push(currentBlock);
        currentBlock.inHistory = true;
    }

    if (oldBlock) {
        var x = currentBlock.x - oldBlock.x;
        var y = currentBlock.y - oldBlock.y;
        var dir = getDir(x, y);
        oldBlock.connectTo(dir);
    }
}

LevelGenerator.prototype.chooseBlock = function () {
    if (this.currentBlock) {
        var n = this.currentBlock.randomAvailableNeighbour(this.rnd);
        if (n) {
            return n;
        } else {
            var b = this.history.pop();
            b && (b.inHistory = false);
            b = this.history.pop();
            b && (b.inHistory = false);
            return b;
        }
    } else {
        var x = this.rnd.integerInRange(0, this.hBlocks - 1);
        var y = this.rnd.integerInRange(0, this.vBlocks - 1);
        return this.blocks[y][x];
    }
}
