Enemy = function(game, x, y) {
    Phaser.Sprite.call(this, game, x, y);
    // Defaults to be overridden by tile properties
    this.maxSpeed = 75;
    this.acceleration = 200;
    this.drag = 5000;
    this.health = 2;
    this.range = 300;
    this.recoilAmount = 50;
    this.structureName = 'sprites';
    this.turretName = 'sprites';
    this.structureFrame = 'tankBody_red_outline.png';
    this.turretFrame = 'tankRed_barrel1_outline.png';
    this.bulletName = 'bulletRed2_outline.png';

    this.currentNode = -1;
    this.pathDirection = 1;
    this.pathNodes = [];

    // internal values
    this.recoilTime = 0;
}

Enemy.prototype = Object.create(Phaser.Sprite.prototype);
Enemy.prototype.constructor = Enemy;

Enemy.prototype.init = function(index, level, player) {
    this.scale.set(1);
    this.level = level;
    this.player = player;
    this.anchor.set(0.5);

    this.structure = this.addChild(this.game.make.sprite(0, 0, this.structureName, this.structureFrame));
    this.turret = this.addChild(this.game.make.sprite(0, 0, this.turretName, this.turretFrame));

    this.structure.anchor.set(0.5);
    this.turret.anchor.set(0.1, 0.5);

    this.name = index.toString().padStart(2, '0');
    this.index = index;
    this.setupBody();
    this.setupWeapon();
    this.shotSound = this.game.add.audio('shot', 0.03);

    this.destination = new Phaser.Point(game.world.randomX, game.world.randomY);
}

Enemy.prototype.setupBody = function() {
    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.immovable = false;
    this.body.collideWorldBounds = true;
    this.body.maxVelocity.set(this.maxSpeed);
    this.body.bounce.setTo(1, 1);
    this.body.drag.set(this.drag);
}

Enemy.prototype.setupWeapon = function() {
    this.weapon = game.add.weapon(10, 'sprites', this.bulletName);
    this.weapon.onFire.add(this.onFire, this);
    this.weapon.onKill.add(this.onKill, this);
}

Enemy.prototype.setupPath = function(nodes) {
    var distance = 9999999;
    var pathids = this.path.split(',');
    for (var i = 0; i < pathids.length; ++i) {
        var node = nodes[pathids[i]];
        if (node != undefined) {
            this.pathNodes.push(node);
            var d = Phaser.Point.distance(node, this);
            if (d < distance) {
                distance = d;
                this.currentNode = i;
            }
        }
    }
    if (this.currentNode != -1) {
        var node = this.pathNodes[this.currentNode];
        this.destination.set(node.x, node.y);
    }
}

Enemy.prototype.onKill = function(bullet) {
    this.level.bulletExplode(bullet, false);
}

Enemy.prototype.onFire = function(bullet) {
    bullet.reflectTime = 0.1;
    bullet.damage = 1;
    this.muzzle.alpha = 1.25;
    game.add.tween(this.muzzle).to({alpha:0}, 300).start();

    this.shotSound.play();
}

Enemy.prototype.damage = function(bullet) {
    if (!this.alive) {
        return;
    }

    this.health -= 1;
    if (this.health <= 0) {
        var world = this.world;
        this.alive = false;
        //this.structure.kill();
        //this.turret.kill();
        this.weapon.destroy();

        this.level.drawRandomStainFX(2, world.x, world.y, 1);
        this.level.addLargeExplosion(world.x, world.y);

        this.destroy();
        return true;
    } else  {
        this.flash();
    }
    if (this.maxSpeed > 0) {
        var vel = bullet.body.velocity;
        this.body.velocity.x += vel.x * 2;
        this.body.velocity.y += vel.y * 2;
        this.recoilTime = game.time.now + this.recoilAmount;
    }
    return false;
}

Enemy.prototype.flash = function() {
    this.structure.tint = 0xfefefe;
    this.turret.tint = 0xfefefe;
    this.game.add.tween(this.structure).to({tint:0xffffff}, 250).start();
    this.game.add.tween(this.turret).to({tint:0xffffff}, 250).start();
}

Enemy.prototype.update = function() {
    // Nothing yet
}

Enemy.prototype.getWorldPos = function() {
    return this.world;
}

Enemy.prototype.render = function() {
    //this.weapon.debug();
    if (DEBUG_COLLISIONS) {
        this.game.debug.body(this);
    }
    var color = '#ffffff';
    game.debug.text("Enemy " + this.name + ": " + this.exists.toString(), 10, GAME_HEIGHT - 10 - (this.index * 12), color);
}