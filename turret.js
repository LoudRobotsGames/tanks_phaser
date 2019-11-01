Turret = function (game, level, type) {
    Phaser.Sprite.call(this, game, 0, 0);
    this.level = level;
    this.anchor.setTo(0.1, 0.5);
    this.parts = this.game.add.group(this);
    this.muzzleFlashes = this.game.add.group(this);

    this.shotSound = this.game.add.audio('shot', 0.05);

    this.particles = [];
    for (var i = 0; i < 2; ++i) {
        var emitter = this.game.add.emitter(0, 0, 10);
        emitter.makeParticles('exp');
        emitter.setYSpeed(-150, 150);
        emitter.setXSpeed(-150, 150);
        emitter.gravity = 0;
        this.particles.push(emitter);
    }

    this.init(type);
}

Turret.prototype = Object.create(Phaser.Sprite.prototype);
Turret.prototype.constructor = Turret;

Turret.prototype.init = function(type) {
    this.type = type;

    if (this.weapon) {
        this.weapon.destroy();
    }
    this.parts.removeAll(true);
    this.muzzleFlashes.removeAll(true);

    if (type == 2) {
        this.initDouble();
    } else if (type == 3) {
        this.initShotgun();
    } else {
        this.initSingle();
    }
}

Turret.prototype.initSingle = function() {
    this.range = 260;
    this.reloadTime = 1000;
    this.fireLimit = 3;
    this.bulletScale = 1;
    this.shotCount = 1;
    this.alternate = false;
    this.addPart(0, 0, 'tankDark_barrel2_outline.png');
    this.addMuzzle(0);
    
    this.weapon = this.game.add.weapon(10, 'red_bullet');
    this.weapon.bulletKillType = Phaser.Weapon.KILL_DISTANCE;
    this.weapon.bulletKillDistance = this.range;
    this.weapon.bulletSpeed = 600;
    this.weapon.trackSprite(this, this.width, 0, true);
    this.weapon.fireRate = 200;
    this.weapon.fireRateVariance = 50;
    this.weapon.bulletAngleVariance = 2;
    this.weapon.bulletRotateToVelocity = true;
    this.weapon.fireLimit = this.fireLimit;
    this.weapon.onKill.add(this.onKill, this);
    this.weapon.onFireLimit.add(this.onFireLimit, this);
}

Turret.prototype.initShotgun = function() {
    this.range = 150;
    this.reloadTime = 2000;
    this.fireLimit = 2;
    this.bulletScale = 0.6;
    this.shotCount = 5;
    this.alternate = false;
    this.addPart(0, 0, 'specialBarrel5_outline.png');
    this.addMuzzle(0);
    
    this.weapon = this.game.add.weapon(10, 'red_bullet');
    this.weapon.bulletKillType = Phaser.Weapon.KILL_DISTANCE;
    this.weapon.bulletKillDistance = this.range;
    this.weapon.bulletSpeed = 600;
    this.weapon.trackSprite(this, this.width, 0, true);
    this.weapon.fireRate = 200;
    this.weapon.fireRateVariance = 100;
    this.weapon.bulletAngleVariance = 17;
    this.weapon.bulletRotateToVelocity = true;
    this.weapon.fireLimit = this.fireLimit;
    this.weapon.multiFire = true;
    this.weapon.onKill.add(this.onKill, this);
    this.weapon.onFireLimit.add(this.onFireLimit, this);
}

Turret.prototype.initDouble = function() {
    this.range = 200;
    this.reloadTime = 1000;
    this.fireLimit = 10;
    this.bulletScale = 0.75;
    var offset = -8;
    this.shotCount = 1;
    this.alternate = true;
    this.addPart(-4, offset, 'specialBarrel4_outline.png');
    this.addMuzzle(offset);
    this.addPart(-4, -offset, 'specialBarrel4_outline.png', true);
    this.addMuzzle(-offset);

    this.weapon = this.game.add.weapon(10, 'red_bullet');
    this.weapon.bulletKillType = Phaser.Weapon.KILL_DISTANCE;
    this.weapon.bulletKillDistance = this.range;
    this.weapon.bulletSpeed = 600;
    this.weapon.trackSprite(this, this.width, 0, true);
    this.weapon.fireRate = 150;
    this.weapon.fireRateVariance = 20;
    this.weapon.bulletAngleVariance = 1;
    this.weapon.bulletRotateToVelocity = true;
    this.weapon.fireLimit = this.fireLimit;
    this.weapon.multiFire = true;
    this.weapon.onKill.add(this.onKill, this);
    this.weapon.onFireLimit.add(this.onFireLimit, this);
}

Turret.prototype.onFireLimit = function() {
    if (this.fireLimitCallback) {
        this.fireLimitCallback.call(this.fireLimitContext);
    }
}

Turret.prototype.onKill = function(bullet) {
    this.level.bulletExplode(bullet, false);
}

Turret.prototype.setFireLimitCallback = function(callback, context) {
    this.fireLimitCallback = callback;
    this.fireLimitContext = context;
}

Turret.prototype.addPart = function(offsetX, offsetY, frame, flipX, flipY) {
    var part = this.game.make.sprite(offsetX, offsetY, 'sprites', frame)
    part.anchor.setTo(0.1, 0.5);
    this.parts.add(part);
    if (flipX) {
        part.scale.y *= -1;
    }
    if (flipY) {
        part.scale.x *= -1;
    }
}

Turret.prototype.addMuzzle = function(offset) {
    var muzzle = this.addChild(this.game.make.sprite(this.width * 0.9, offset, 'sprites', 'shotLarge.png'));
    muzzle.anchor.setTo(0, 0.5);
    muzzle.alpha = 0;
    this.muzzleFlashes.add(muzzle);
}

Turret.prototype.update = function() {
    for (var i = 0; i < this.particles.length; ++i) {
        var emitter = this.particles[i];
        emitter.forEachAlive(function(p){
            p.alpha = game.math.clamp(p.lifespan / 100, 0, 1);
        }, this);
    }
}

Turret.prototype.maybeFireABullet = function() {
    var bullet = this.weapon.fire();
    if (bullet != null) {
        this.bullet = bullet;
        bullet.scale.setTo(this.bulletScale);
    }
    return bullet;
}

Turret.prototype.muzzleFlash = function(muzzle, index) {
    muzzle.alpha = 1;
    this.game.add.tween(muzzle).to({alpha:0}, 300).start();
    
    var muzzleWorld = muzzle.world;
    var emitter = this.particles[index];
    emitter.x = muzzleWorld.x;
    emitter.y = muzzleWorld.y;
    emitter.start(true, 150, null, 10);
}

Turret.prototype.fire = function() {
    this.bullet = null;
    var index = 0;
    if (this.alternate) {
        var muzzle = this.muzzleFlashes.cursor;
        this.weapon.trackSprite(this, this.width, muzzle.position.y, true);
        var bullet = this.maybeFireABullet();
        if (bullet != null) {
            this.muzzleFlash(muzzle, 0);
            this.muzzleFlashes.next();
        }
    } else {
        this.muzzleFlashes.forEachAlive(function(muzzle) {
            this.weapon.trackSprite(this, this.width, muzzle.position.y, true);
            var fired = false;
            for (var i = 0; i < this.shotCount; ++i) {
                var bullet = this.maybeFireABullet();
                if (bullet != null) {
                    fired = true;
                }
            }
            if (fired) {
                this.muzzleFlash(muzzle, index++);
            }
        }, this);
    }

    if (this.bullet != null) {
        this.shotSound.play();
    }
    return this.bullet;
}

Turret.prototype.empty = function() {
    this.weapon.shots = this.weapon.fireLimit;
}

Turret.prototype.reload = function() {
    this.weapon.resetShots(this.fireLimit);
}
