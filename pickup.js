Pickup = function(game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.type = 'RANDOM';
    this.amount = 2;
    this.pickupFrame = 'crateWood.png';
}

Pickup.prototype = Object.create(Phaser.Sprite.prototype);
Pickup.prototype.constructor = Pickup;

Pickup.prototype.init = function(level, player) {
    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.setSize(20, 20, 21, 21);

    this.level = level;
    this.player = player;
    this.collected = false;

    this.scale.set(1);
    this.crate = this.addChild(this.game.make.sprite(this.width / 2, -this.height / 2, 'sprites', this.pickupFrame));
    this.crate.anchor.set(0.5);

    game.add.tween(this.crate.scale).to({x:1.125, y:1.125}, 800, 
        Phaser.Easing.Quadratic.InOut, true, 0, -1, true).start();

    if (this.type == 'RANDOM') {
        this.type = TYPES[Math.random() * TYPES.length];
    }
}

Pickup.prototype.collect = function() {
    if (this.collected) {
        return;
    }
    if (this.type == 'REPAIR') {
        this.player.heal(this.amount);
    }
    if (this.type == 'WEAPONUP') {
        this.player.upgradeWeapon(this.amount);
    }
    if (this.type == 'ARMORUP') {
        this.player.upgradeArmor(this.amount);
    }
    this.crate.visible = false;
    this.collected = true;
    game.add.tween(this).to({alpha:0}, 1500, Phaser.Easing.Default, true, 1000);
}

Pickup.prototype.render = function() {
    //this.game.debug.body(this);
}

const TYPES = ['REPAIR', 'WEAPONUP', 'ARMORUP'];