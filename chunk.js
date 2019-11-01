Chunk = function(level, game, template, x, y) {
    this.level = level;
    this.game = game;
    this.level = level;
    this.x = x;
    this.y = y;
    this.template = template;
    this.active = true;
    
    this.widthInPixels = this.template.widthInPixels;
    this.heightInPixels = this.template.heightInPixels;

    offsetX = this.widthInPixels * x;
    offsetY = this.heightInPixels * y
    
    this.fxLayer = game.add.bitmapData(this.widthInPixels, this.heightInPixels);
    this.fxImage = this.fxLayer.addToWorld(offsetX, offsetY);
    this.level.fxGroup.add(this.fxImage);
    
    this.enemyGroup = game.add.group(level.enemyGroup);
    this.enemyGroup.updateOnlyExistingChildren = true;
    this.towerGroup = game.add.group(level.towerGroup);
    this.towerGroup.updateOnlyExistingChildren = true;
    this.obstacles = game.add.group(level.obstacles);
    this.obstacles.x = offsetX;
    this.obstacles.y = offsetY;
    this.pickupGroup = game.add.group(level.fxGroup);
    this.pickupGroup.x = offsetX;
    this.pickupGroup.y = offsetY;

    this.template.plus.physics.enableObjectLayer("Collision");
    
    this.template.createFromObjects('Objects', 162, 'sprites', 'treeGreen_large.png', true, false, this.obstacles);
    this.template.createFromObjects('Objects', 161, 'sprites', 'fenceYellow.png', true, false, this.obstacles);
    this.template.createFromObjects('Objects', 192, 'sprites', 'treeGreen_small.png', true, false, this.obstacles);
    this.template.createFromObjects('Objects', 181, 'sprites', 'sandbagBeige.png', true, false, this.obstacles);
    this.template.createFromObjects('Objects', 168, 'sprites', 'barrelRed_top.png', true, false, this.obstacles);
    this.template.createFromObjects('Objects', 167, 'sprites', 'barrelRed_side.png', true, false, this.obstacles);
    
    this.obstacles.forEachAlive(function(t) {
        t.anchor.setTo(0, 1);
        t.y += t.height;
    }, this);

    this.collectNodes();
}

Chunk.prototype.createEnemies = function() {
    offsetX = this.widthInPixels * this.x;
    offsetY = this.heightInPixels * this.y
    this.template.createFromObjects('Objects', 197, '', '', true, false, this.enemyGroup, EnemyTank);

    this.enemyGroup.forEachAlive(function(e) {
        e.init(this.level.nextEnemyIndex, this.level, this.level.player);
        if (e.path != undefined) {
            e.setupPath(this.nodes);
        }
        e.x += offsetX;
        e.y += offsetY;
        this.level.bulletGroup.add(e.weapon.bullets);
        this.level.nextEnemyIndex++;
    }, this);
}

Chunk.prototype.createTowers = function() {
    offsetX = this.widthInPixels * this.x;
    offsetY = this.widthInPixels * this.y;
    this.template.createFromObjects('Objects', 209, '', '', true, false, this.towerGroup, GunTower);

    this.towerGroup.forEachAlive(function(t) {
        t.init(0, this.level, this.level.player);
        t.x += offsetX + 32;
        t.y += offsetY + 32;
        this.level.bulletGroup.add(t.weapon.bullets);
    }, this);
}

Chunk.prototype.createPickUps = function() {
    offsetX = this.widthInPixels * this.x;
    offsetY = this.widthInPixels * this.y;
    this.template.createFromObjects('Objects', 199, 'repair_pickup_spot', '', true, false, this.pickupGroup, Pickup);
    this.template.createFromObjects('Objects', 198, 'weapon_pickup_spot', '', true, false, this.pickupGroup, Pickup);
    this.pickupGroup.forEachAlive(function(p) {
        p.anchor.setTo(0, 1);
        p.init(this.level, this.level.player);
        p.y += p.height;
    }, this);
}

Chunk.prototype.collectNodes = function() {
    offsetX = this.widthInPixels * this.x;
    offsetY = this.heightInPixels * this.y
    this.nodes = {};
    var group = this.template.objects['Objects'];
    for (var i = 0; i < group.length; i++)
    {
        var obj = group[i];
        if (obj.gid !== undefined && obj.gid === NODE_GID)
        {
            var node = new PathNode(obj.name,
                obj.x + offsetX + 32, 
                obj.y + offsetY - 32
            );
            this.nodes[obj.name] = node;
        }
    }
}

Chunk.prototype.overlapsChunk = function(sprite, x, y, buffer) {
    if (x == undefined) { x = sprite.x; }
    if (y == undefined) { y = sprite.y; }
    if (buffer == undefined) { buffer = 16; }
    var right = x + sprite.offsetX + buffer;
    if (right < this.fxImage.left) return false;
    var left = x - sprite.offsetX - buffer;
    if (left > this.fxImage.right) return false;
    var bottom = y + sprite.offsetY + buffer;
    if (bottom < this.fxImage.top) return false;
    var top = y - sprite.offsetY - buffer;
    if (top > this.fxImage.bottom) return false;
    return true;
}

Chunk.prototype.draw = function(sprite, x, y, alpha) {
    if (alpha == undefined) { alpha = 1; }
    if (this.overlapsChunk(sprite, x, y)) {
        offsetX = this.widthInPixels * this.x;
        offsetY = this.heightInPixels * this.y
        sprite.alpha = alpha;
        this.fxLayer.draw(sprite, x - offsetX, y - offsetY, null, null);
    }
}

Chunk.prototype.collideWith = function(sprite) {
    if (!this.overlapsChunk(sprite)) {
        return;
    }
    offsetX = this.widthInPixels * this.x;
    offsetY = this.heightInPixels * this.y
    sprite.body.x -= offsetX;
    sprite.body.y -= offsetY;
    sprite.body.prev.x -= offsetX;
    sprite.body.prev.y -= offsetY;
    this.template.plus.physics.collideWith(sprite);
    sprite.body.x += offsetX;
    sprite.body.y += offsetY;
    sprite.body.prev.x += offsetX;
    sprite.body.prev.y += offsetY;
}

Chunk.prototype.processObjectCollisions = function(sprite, bulletHitSprite, bulletHitEnemy, bulletsCollide, context) {
    this.enemyGroup.forEachAlive(function(e) {
        this.collideWith(e);
        this.game.physics.arcade.collide(sprite, e);
        this.game.physics.arcade.collide(sprite, e.weapon.bullets, bulletHitSprite, null, context);
        if (sprite.gun != undefined) {
            this.game.physics.arcade.overlap(sprite.gun.weapon.bullets, e.weapon.bullets, bulletsCollide, null, context);
        }
    }, this);
    this.towerGroup.forEachAlive(function(t) {
        this.game.physics.arcade.collide(sprite, t);
        this.game.physics.arcade.collide(sprite, t.weapon.bullets, bulletHitSprite, null, context);
        if (sprite.gun != undefined) {
            this.game.physics.arcade.overlap(sprite.gun.weapon.bullets, t.weapon.bullets, bulletsCollide, null, context);
        }
    }, this);
    if (sprite.gun != undefined) {
        this.game.physics.arcade.collide(sprite.gun.weapon.bullets, this.enemyGroup, bulletHitEnemy, null, context);
        this.game.physics.arcade.collide(sprite.gun.weapon.bullets, this.towerGroup, bulletHitEnemy, null, context);
    }
    this.game.physics.arcade.overlap(sprite, this.pickupGroup, this.collectPickup, null, this);
}

Chunk.prototype.collectPickup = function(player, pickup) {
    pickup.collect();
}

Chunk.prototype.setActive = function(active) {
    if (this.active != active) {
        this.active = active;

        this.enemyGroup.forEachAlive(function(e) {
            e.exists = active;
        }, this);
        this.enemyGroup.exists = active;
    }
}

Chunk.prototype.render = function() {
    this.enemyGroup.forEachAlive(function(e) {
        e.render();
    }, this);
    this.pickupGroup.forEachAlive(function(p) {
        p.render();
    }, this);
}

PathNode = function(name, x, y) {
    this.name = name;
    this.x = x;
    this.y = y;
}

const NODE_GID = 201;