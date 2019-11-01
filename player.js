Player = function (game, x, y, main) {
    Phaser.Sprite.call(this, game, x, y);
    this.health = 5;
    this.maxHealth = 5;
    this.speed = 12000;
    this.maxspeed = 150;
    this.alive = true;
    this.recoilTime = 0;
    this.main = main;
    this.level = main.level;
    this.travel = 10;
    this.range = 260;
}

Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;

Player.prototype.init = function() {
    this.cursor = this.game.input.keyboard.createCursorKeys();
    this.wasd = {
        up: this.game.input.keyboard.addKey(Phaser.Keyboard.W),
        down: this.game.input.keyboard.addKey(Phaser.Keyboard.S),
        left: this.game.input.keyboard.addKey(Phaser.Keyboard.A),
        right: this.game.input.keyboard.addKey(Phaser.Keyboard.D),
    };
    this.game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);

    this.tank = this.addChild(this.game.make.sprite(0, 0, 'sprites', 'tankBody_dark_outline.png'));
    this.gun = this.addChild(new Turret(this.game, this.level, 1));
    this.gun.setFireLimitCallback(this.startReload, this);
    this.level.bulletGroup.add(this.gun.weapon.bullets);

    this.tank.anchor.setTo(0.5, 0.5);

    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.collideWorldBounds = true;
    this.body.gravity.y = 0;
    this.body.gravity.x = 0;
    this.body.drag.set(500);
    this.body.maxVelocity.set(this.maxspeed);
    this.body.setSize(40, 40, -20, -20);
    this.body.bounce.setTo(0.75, 0.75);

    this.tracks = this.game.make.sprite(0, 0, 'sprites', 'tracksSmall.png');
    this.tracks.anchor.setTo(0.5, 0.5);
}

Player.prototype.flash = function() {
    this.tank.tint = 0xfefefe;
    this.gun.tint = 0xfefefe;
    this.game.add.tween(this.gun).to({tint:0xffffff}, 250).start();
    this.game.add.tween(this.tank).to({tint:0xffffff}, 250).start();
}

Player.prototype.update = function() {
    if (!this.alive) {
        return;
    }
    var now = this.game.time.now;
    var world = this.tank.world;
    /*var tilex = Math.floor((world.x) / this.map.tileWidth);
    var tiley = Math.ceil((world.y) / this.map.tileHeight);
    var tile = this.map.getTile(tilex, tiley - 1, LEVEL_LAYER);
    if (tile != null && !ROAD_TILES.includes(tile.index)) {
        this.offRoad = true;
    } else {
        this.offRoad = false;
    }*/
    
    if (this.game.input.keyboard.justPressed(Phaser.Keyboard.R))
    {
        this.startReload();
    }

    this.handleMovement(now);
    this.handleAiming();

    if (this.recoilTime < now && this.body.velocity.getMagnitudeSq() > 0)
    {
        this.tank.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x); 
        this.body.rotation = this.tank.rotation;
    }

    this.gun.update();
}

Player.prototype.createMobileControls = function(uiGroup) {
    this.useMobileControls = true;
    this.directionPad = this.game.plugins.add(Phaser.Plugin.VirtualGamepad);
    this.leftJoystick = uiGroup.add(this.directionPad.addJoystick(100, GAME_HEIGHT-100, 1.2, 'gamepad'));
    //this.button = uiGroup.add(this.directionPad.addButton(GAME_WIDTH-100, GAME_HEIGHT-80, 1.0, 'gamepad'));
    this.aimingPad = this.game.plugins.add(Phaser.Plugin.VirtualGamepad);
    this.rightJoystick = uiGroup.add(this.aimingPad.addJoystick(GAME_WIDTH - 100, GAME_HEIGHT-100, 1.2, 'gamepad'));
}

Player.prototype.handleAiming = function() {
    if (this.useMobileControls) {
        if (this.rightJoystick.properties.inUse) {
            this.fireDelay--;
            this.gun.rotation = Phaser.Math.degToRad(this.rightJoystick.properties.angle);
            if ( this.rightJoystick.properties.distance > 50) {
                this.fireBullet();
            }
        } else {
            this.fireDelay = 10;
        }
    } else {
        this.gun.rotation = this.game.physics.arcade.angleToPointer(this);

        if (this.game.input.activePointer.isDown)
        {
            this.fireDelay--;
            this.fireBullet();
        }else {
            this.fireDelay = 10;
        }
    }
}

Player.prototype.handleMovement = function(now) {
    if (this.useMobileControls) {
        x = y = 0;
        if (this.leftJoystick.properties.inUse) {
            if (Math.abs(this.leftJoystick.properties.x) > 25) {
                x = Phaser.Math.clamp(this.leftJoystick.properties.x / 75, -1.0, 1.0);
            }
            if (Math.abs(this.leftJoystick.properties.y) > 25) {
                y = Phaser.Math.clamp(this.leftJoystick.properties.y / 75, -1.0, 1.0);
            }
        }
        this.body.acceleration.x = x * this.speed * this.game.time.physicsElapsed;
        this.body.acceleration.y = y * this.speed * this.game.time.physicsElapsed;
    } else {
        if (this.wasd.up.isDown) {
            this.body.acceleration.y = -this.speed * this.game.time.physicsElapsed;
        } else if (this.wasd.down.isDown) {
            this.body.acceleration.y = this.speed * this.game.time.physicsElapsed;
        }
        else {
            this.body.acceleration.y = 0;
        }
        if (this.wasd.left.isDown) {
            this.body.acceleration.x = -this.speed * this.game.time.physicsElapsed;
        }
        else if (this.wasd.right.isDown) {
            this.body.acceleration.x = +this.speed * this.game.time.physicsElapsed;
        }
        else {
            this.body.acceleration.x = 0;
        }
    }
    if (this.recoilTime < now && (this.body.acceleration.x != 0 || this.body.acceleration.y != 0)) {
        this.game.camera.shake(0.001, 20);
    }

    if (this.offRoad) {
        this.body.maxVelocity.set(this.maxspeed * 0.6);
    } else {
        this.body.maxVelocity.set(this.maxspeed);
    }
    var point = new Phaser.Point(this.body.deltaAbsX(), this.body.deltaAbsY());
    this.travel += point.getMagnitude();
    if (this.travel > 14) {
        this.tracks.rotation = this.tank.rotation;
        var world = this.body.center;
        this.level.drawTracks(this.tracks, world.x, world.y);
        this.travel = 0;
    }
}

Player.prototype.fireBullet = function() {
    if (this.fireDelay > 0)
    {
        return;
    }

    var elapsed = this.game.time.physicsElapsed;
    var bullet = this.gun.fire();
    if (bullet != null) 
    {
        var recoilStrength = RECOIL_STRENGTH;
        if (this.offRoad) {
            recoilStrength *= 0.75;
        }
        var vel = bullet.body.velocity;
        this.body.velocity.x -= vel.x * recoilStrength * elapsed;
        this.body.velocity.y -= vel.y * recoilStrength * elapsed;
        this.recoilTime = game.time.now + RECOIL_TIME;

        this.game.camera.shake(0.01, 30);
        this.main.removeUIBullet();
    }
}

Player.prototype.startReload = function() {
    this.main.removeUIBullet(99);
    this.gun.empty();
    var tween = this.game.add.tween(this).to({reload: 1}, this.gun.reloadTime).start();
    tween.onComplete.add(this.finishReload, this);
}

Player.prototype.finishReload = function() {
    this.reload = 0;
    this.gun.reload();
    this.main.resetUIBullets(this.gun.fireLimit, this.gun.fireLimit);
}

Player.prototype.damage = function(amount) {
    if (this.alive) {
        this.health -= amount;

        if (this.health <= 0)
        {
            var world = this.world;
            this.weapon.destroy();

            this.level.drawRandomStainFX(2, world.x, world.y, 1);
            this.level.addLargeExplosion(world.x, world.y);
            this.kill();
        }
    }

    this.main.resetUIArmor(this.health, this.maxHealth, true);
    return this;
}

Player.prototype.heal = function(amount) {
    if (this.alive) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        this.main.resetUIArmor(this.health, this.maxHealth);
    }
}

Player.prototype.upgradeWeapon = function(amount) {
    this.gun.init(this.gun.type + amount);
    this.startReload();
    this.level.bulletGroup.add(this.gun.weapon.bullets);
}

Player.prototype.upgradeArmor = function(amount) {

}

Player.prototype.render = function() {
    if (DEBUG_WEAPON) {
        this.gun.weapon.debug();
    }
    if (DEBUG_COLLISIONS) {
        this.game.debug.body(this);
    }
}