EnemyTank = function (game, x, y) {
    Enemy.call(this, game, x, y);
    this.acceleration = 10;
    this.drag = 250;
    this.maxSpeed = 50;
    this.recoilAmount = 300;
}

EnemyTank.prototype = Object.create(Enemy.prototype);
EnemyTank.prototype.constructor = EnemyTank;

EnemyTank.prototype.setupWeapon = function() {
    Enemy.prototype.setupWeapon.call(this);
    this.muzzle = this.turret.addChild(game.make.sprite(this.turret.width, 0, 'sprites', 'shotLarge.png'));
    this.muzzle.anchor.setTo(0, 0.5);
    this.muzzle.scale.setTo(1.5, 1.5);
    this.muzzle.alpha = 0;

    this.weapon.bulletKillType = Phaser.Weapon.KILL_DISTANCE;
    this.weapon.bulletKillDistance = this.range * 1.5;
    this.weapon.bulletAngleOffset = 180;
    this.weapon.bulletSpeed = 300;
    this.weapon.trackSprite(this.turret, this.turret.width, 0, true);
    this.weapon.fireRate = 3000;
    this.weapon.autofire = false;
    this.weapon.bulletAngleVariance = 10;
    this.weapon.fireRateVariance = 1600;
    this.weapon.bulletRotateToVelocity = true;
    this.weapon.setNextFireTime(game.time.now + Phaser.Math.between(1000, 2000));
}

EnemyTank.prototype.update = function() {
    Enemy.prototype.update.call(this);
    var now = game.time.now;
    desiredRotation = this.structure.rotation;
    if (this.player.alive && this.game.physics.arcade.distanceBetween(this, this.player) < this.range) {
        desiredRotation = this.game.physics.arcade.angleBetween(this, this.player);
        if (Math.abs(desiredRotation - this.turret.rotation) < Math.PI / 30) {
            this.weapon.autofire = true;
        }
    } else {
        this.weapon.autofire = false;
    }
    this.turret.rotation = Phaser.Math.rotateToAngle(this.turret.rotation, desiredRotation, 0.05);

    var distance = this.destination.distance(this.world);
    if (distance < 4) {
        this.atDestination();
    } else if (this.recoilTime < now) {
        var maxSpeed = Math.min(this.maxSpeed, distance * 2);
        this.moveTo(this.destination.x, this.destination.y, this.maxSpeed);
    }

    if (this.recoilTime < now && this.body.velocity.getMagnitudeSq() > 0)
    {
        var vel = Phaser.Point.normalize(this.body.velocity);
        this.structure.rotation = Math.atan2(vel.y, vel.x) + (-0.5 + Math.random()) * Math.PI * 0.025; 
    }
}

EnemyTank.prototype.moveTo = function(x, y, speed) {
    var direction = new Phaser.Point(x, y);
    direction.subtract(this.x, this.y);
    direction.normalize();
    direction.setMagnitude(speed);
    direction.subtract(this.body.velocity.x, this.body.velocity.y);
    direction.normalize();
    direction.setMagnitude(this.acceleration); 

    this.body.velocity.add(direction.x, direction.y);
    this.body.velocity.normalize();
    this.body.velocity.setMagnitude(speed);
}

var right = new Phaser.Point(1, 0);
EnemyTank.prototype.atDestination = function() {
    if (this.currentNode == -1) {
        this.destination.set(game.world.randomX, game.world.randomY);
    } else {
        if (this.pathType == "STOP") {
            return;
        }
        this.currentNode += this.pathDirection;
        if (this.currentNode < 0) {
            if (this.pathtype == "LOOP") {
                this.currentNode = this.pathNodes.length - 1;
            } else if (this.pathtype = "PINGPONG") {
                this.currentNode = 0;
                this.pathDirection = 1;
            }
        } else if (this.currentNode >= this.pathNodes.length) {
            if (this.pathtype == "LOOP") {
                this.currentNode = 0;
            } else if (this.pathtype == "PINGPONG") {
                this.currentNode = this.pathNodes.length - 1;
                this.pathDirection = -1;
            }
        }
        var node = this.pathNodes[this.currentNode];
        this.destination.set(node.x, node.y);
    }
}
