GunTower = function (game, x, y) {
    Enemy.call(this, game, x, y);
    this.structureName = 'tower_01';
    this.turretName = 'tower_turret_01';
    this.structureFrame = undefined;
    this.turretFrame = undefined;
    this.bulletName = 'bulletRed1_outline.png'
    this.maxSpeed = 0;
    this.shotCount = 0;
    this.shotType = 'SINGLE';
}

GunTower.prototype = Object.create(Enemy.prototype);
GunTower.prototype.constructor = GunTower;

GunTower.prototype.init = function(index, level, player) {
    Enemy.prototype.init.call(this, index, level, player);
    this.turret.anchor.set(0.33, 0.5);
}

GunTower.prototype.setupBody = function() {
    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.immovable = true;
}

GunTower.prototype.setupWeapon = function() {
    Enemy.prototype.setupWeapon.call(this);
    
    muzzleSpace = this.turret.width / 1.75;
    muzzleOffset = this.turret.height / 9;

    this.weapon.bulletKillType = Phaser.Weapon.KILL_DISTANCE;
    this.weapon.bulletKillDistance = this.range * 1.2;
    this.weapon.bulletAngleOffset = 180;
    this.weapon.bulletSpeed = 400;
    this.weapon.autofire = true;
    this.weapon.bulletAngleVariance = 2;
    this.weapon.bulletRotateToVelocity = true;
    this.weapon.setNextFireTime(this.game.time.now + Phaser.Math.between(2000, 3000));
    
    if (this.shotType == 'DOUBLE') {
        this.weapon.fireRate = 75;
        this.weapon.fireRateVariance = 5;
        this.weapon.trackSprite(this.turret, this.turret.width, muzzleOffset, true);

        this.muzzle1 = this.turret.addChild(this.game.make.sprite(muzzleSpace, muzzleOffset, 'sprites', 'shotThin.png'));
        this.muzzle1.anchor.setTo(0, 0.5);
        this.muzzle1.alpha = 0;
        this.muzzle2 = this.turret.addChild(this.game.make.sprite(muzzleSpace, -muzzleOffset, 'sprites', 'shotThin.png'));
        this.muzzle2.anchor.setTo(0, 0.5);
        this.muzzle2.alpha = 0;
    } else if (this.shotType = 'SINGLE') {
        this.weapon.fireRate = 6000;
        this.weapon.fireRateVariance = 1000;
        this.weapon.trackSprite(this.turret, this.turret.width, 0, true);

        this.muzzle1 = this.turret.addChild(this.game.make.sprite(muzzleSpace, 0, 'sprites', 'shotThin.png'));
        this.muzzle1.anchor.setTo(0, 0.5);
        this.muzzle1.alpha = 0;
    }
}

GunTower.prototype.onFire = function(bullet) {
    bullet.reflectTime = 0.35;
    bullet.damage = 0.5;
    if (this.shotType == 'DOUBLE') {
        this.onFireDouble(bullet);
    } else if (this.shotType == 'SINGLE') {
        this.muzzle1.alpha = 1.25;
        this.game.add.tween(this.muzzle1).to({alpha:0}, 300).start();
    }
    this.shotSound.play();
}

GunTower.prototype.onFireDouble = function(bullet) {
    muzzleOffset = this.turret.height / 9;
    if (this.shotCount == 0) {
        this.shotCount = 1;
        this.weapon.fireRate = 6000;
        this.weapon.fireRateVariance = 1000;
        this.weapon.trackSprite(this.turret, this.turret.width, -muzzleOffset, true);
        
        this.muzzle1.alpha = 1.25;
        this.game.add.tween(this.muzzle1).to({alpha:0}, 300).start();
    } else {
        this.shotCount = 0;
        this.weapon.fireRate = 75;
        this.weapon.fireRateVariance = 5;
        this.weapon.trackSprite(this.turret, this.turret.width, muzzleOffset, true);
        
        this.muzzle2.alpha = 1.25;
        this.game.add.tween(this.muzzle2).to({alpha:0}, 300).start();
    }
}

GunTower.prototype.update = function() {
    Enemy.prototype.update.call(this);
    var now = game.time.now;
    
    if (this.player.alive && this.game.physics.arcade.distanceBetween(this, this.player) < this.range)
    {
        desiredRotation = this.game.physics.arcade.angleBetween(this, this.player);
        this.turret.rotation = Phaser.Math.rotateToAngle(this.turret.rotation, desiredRotation, 0.05);
        if (Math.abs(desiredRotation - this.turret.rotation) < Math.PI / 30) {
            this.weapon.autofire = true;
        }
    }
    else
    {
        this.weapon.autofire = false;
        this.turret.rotation += (Math.PI / 8) * this.game.time.physicsElapsed;
    }
}