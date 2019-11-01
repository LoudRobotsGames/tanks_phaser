Phaser.Weapon.prototype.setNextFireTime = function(time) {
    this._nextFire = time;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

Boot = function (game) { };

Boot.prototype = {
	preload: function () {
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.scale.updateLayout(true);

        game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.refresh();

		game.stage.backgroundColor = '#0';
		game.load.image('loading', 'assets/loading.png');
        game.load.image('loading2', 'assets/loading2.png');
        game.time.advancedTiming = true;
	},
	create: function() {
        this.game.plugins.add(Phaser.Plugin.TilemapPlus);
        this.game.plugins.add(PhaserNineSlice.Plugin);
		this.game.state.start('Load');
	}
};

Load = function (game) { };

Load.prototype = {
	preload: function () {
        var w = GAME_WIDTH;
        var h = GAME_HEIGHT;
	    label2 = game.add.text(Math.floor(w/2)+0.5, Math.floor(h/2)-15+0.5, 'loading...', { font: '30px Arial', fill: '#fff' });
		label2.anchor.setTo(0.5, 0.5);

		preloading2 = game.add.sprite(w/2, h/2+15, 'loading2');
		preloading2.x -= preloading2.width/2;
		preloading = game.add.sprite(w/2, h/2+19, 'loading');
		preloading.x -= preloading.width/2;
		game.load.setPreloadSprite(preloading);

        game.load.spritesheet('gamepad', 'assets/gamepad/gamepad_spritesheet.png', 100, 100);
        game.load.tilemap('level-all', 'assets/level-all.json', null, Phaser.Tilemap.TILED_JSON);

        for (var i = 0; i < 16; ++i) {
            var id = i.toString().padStart(2, '0');
            var key = 'template-' + id;
            var url = 'assets/templates/' + id + '.json';
            game.load.tilemap(key, url, null, Phaser.Tilemap.TILED_JSON);
        }

        game.load.atlasXML('sprites', 'assets/onlyObjects_rotated.png', 'assets/onlyObjects_rotated.xml');

        // TODO - Convert these to use 'sprites'
        game.load.image('tower_01', 'assets/towers/tower_01.png');
        game.load.image('tower_turret_01', 'assets/towers/tower_turret_01.png');
        game.load.image('tower_turret_02', 'assets/towers/tower_turret_02.png');
        game.load.image('repair_pickup_spot', 'assets/towers/towerDefense_tile016.png');
        game.load.image('weapon_pickup_spot', 'assets/towers/towerDefense_tile018.png');

        game.load.image('stain01', 'assets/exp_stain01.png');
        game.load.image('stain02', 'assets/exp_stain02.png');
        game.load.image('stain03', 'assets/exp_stain03.png');
        game.load.image('Terrain', 'assets/terrainTiles_default.png');
        
        game.load.image('exp', 'assets/exp.png');
        game.load.image('spot', 'assets/spot.png');
        game.load.image('silver_bullet', 'assets/bulletSilverSilver_outline.png');
        game.load.image('blue_bullet', 'assets/bulletBlueSilver_outline.png');
        game.load.image('red_bullet', 'assets/bulletRedSilver_outline.png');
        game.load.image('empty_bullet', 'assets/bulletSilver_outline.png');
        game.load.image('armor_icon', 'assets/powerupRed_shield.png');
        game.load.image('armor_pip', 'assets/powerupRed.png');
        game.load.image('armor_pip_empty', 'assets/powerupRed_empty.png');
        game.load.spritesheet('explosion', 'assets/explosion.png', 284, 284);
        game.load.spritesheet('small_explosion', 'assets/explosion_small.png', 126, 126);
        game.load.spritesheet('maze', 'assets/maze.png', 8, 8);
        game.load.spritesheet('numerals', 'assets/numerals.png', 19, 19);

        game.load.spritesheet('button', 'assets/flixel-button.png', 80, 20);

        game.load.audio('shot', 'assets/rumble1.ogg');
	},
	create: function () {
		game.state.start('Play');
	}
};

var mainState = {
    preload: function() {
    },
    create: function() {
        var w = GAME_WIDTH;
        var h = GAME_HEIGHT;
        game.stage.backgroundColor = "#3598db";
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.world.enableBody = true;

        this.level = new Level(this, game, 4, 4);

        this.game.world.setBounds(0, 0, this.level.widthInPixels, this.level.heightInPixels);

        this.cursor = game.input.keyboard.createCursorKeys();
        this.wasd = {
            up: game.input.keyboard.addKey(Phaser.Keyboard.W),
            down: game.input.keyboard.addKey(Phaser.Keyboard.S),
            left: game.input.keyboard.addKey(Phaser.Keyboard.A),
            right: game.input.keyboard.addKey(Phaser.Keyboard.D),
          };
        game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);

        // Spawn player
        this.player = new Player(this.game, 256, 800, this);
        this.level.setPlayer(this.player);
        this.level.createGameObjects();
        this.player.init();

        game.camera.onFadeComplete.add(this.onFadeComplete, this);
        game.camera.focusOn(this.player);
        game.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON);
        helper = Math.max(game.camera.width, game.camera.height) / 32;
        this.deadzone = new Phaser.Rectangle((game.camera.width - helper) / 2, (game.camera.height - helper) / 2, helper, helper);
        game.camera.fade(0, 1, true, 1);

        this.towers = []

        this.setupParticles();

        this.uiArmor = [];
        this.uiArmorEmpties = [];
        this.uiAmmoBullets = [];
        this.uiAmmoEmpties = [];
        icon = game.add.sprite(5, 5, 'armor_icon');
        icon.fixedToCamera = true;
        icon.scale.set(0.8);
        icon = game.add.sprite(5, 35, 'armor_pip');
        icon.fixedToCamera = true;
        icon.scale.set(0.8);
        icon = game.add.sprite(23, 40, 'empty_bullet');
        icon.fixedToCamera = true;
        icon.angle = 90;
        this.armorGroup = game.add.group(this.level.uiGroup);
        this.ammoGroup = game.add.group(this.level.uiGroup);
        for (var i = 0; i < MAX_UI_BULLETS; ++i)
        {
            var outline = this.ammoGroup.add(game.make.sprite(18 * i + 48, 40, 'empty_bullet'));
            outline.fixedToCamera = true;
            outline.visible = false;
            outline.angle = 90;
            this.uiAmmoEmpties.push(outline);
            var bullet = this.ammoGroup.add(game.make.sprite(18 * i + 48, 40, 'red_bullet'));
            bullet.fixedToCamera = true;
            bullet.visible = false;
            bullet.angle = 90;
            this.uiAmmoBullets.push(bullet);

            outline = this.armorGroup.add(game.make.sprite(23 * i + 35, 5, 'armor_pip_empty'));
            outline.fixedToCamera = true;
            outline.visible = false;
            outline.scale.set(0.75);
            this.uiArmorEmpties.push(outline);
            var armor = this.armorGroup.add(game.make.sprite(23 * i + 35, 5, 'armor_pip'));
            armor.fixedToCamera = true;
            armor.visible = false;
            armor.scale.set(0.75);
            this.uiArmor.push(armor);
        }

        this.dot = game.make.sprite(11, 51, 'spot');
        this.dot.fixedToCamera = true;
        this.dot.scale.set(2);
        this.dot.anchor.set(0.5);
        this.level.uiGroup.add(this.dot);
        // We start with 'full' bullets
        this.resetUIBullets(this.player.gun.fireLimit);
        this.resetUIArmor(5, 5);
        if (!game.device.desktop) {
            this.player.createMobileControls(this.level.uiGroup);
        }

        this.pause = game.add.group();
        this.pause.fixedToCamera = true;
        pauseButton = game.add.button(w - 100, 20, 'button', this.onPauseClick, this, 0, 1, 2);
        pauseButton.scale.setTo(2, 2);
        pauseButton.anchor.setTo(0.5, 0.5);
        
        pauseLabel = game.add.text(w - 100, 22.5, 'PAUSE', { font: '12px Arial', fill: '#fff'});
        pauseLabel.anchor.setTo(0.5, 0.5);

        this.pause.addChild(pauseButton);
        this.pause.addChild(pauseLabel);

        game.input.onDown.add(this.onUnPause, this);
    },
    onPauseClick: function() {
        console.log("paused");

        this.pause.visible = false;
        this.pauseTime = 0;
        var tween = this.game.add.tween(this).to({pauseTime: 1}, 0.01).start();
        tween.onComplete.add(this.finishPause, this);
    },
    finishPause: function() {
        var w = GAME_WIDTH;
        var h = GAME_HEIGHT;
        menu = game.add.group();
        menu.fixedToCamera = true;

        choiceLabel = game.add.text(w/2, h-150, 'Click outside menu to continue', {font: '24px Arial', fill: '#fff'});
        choiceLabel.anchor.setTo(0.5, 0.5);
        menu.addChild(choiceLabel);

        game.paused = true;
        this.menu = menu;
    },
    onUnPause: function() {
        if (game.paused) {
            game.paused = false;
            this.pause.visible = true;
            this.menu.destroy();
        }
    },
    update: function() {
        this.level.update();

        this.level.collideWith(this.player);
        this.level.processObjectCollisions();

        this.dot.cameraOffset.x = 10 + (this.player.world.x / 128);
        this.dot.cameraOffset.y = MINIMAP_Y + (this.player.world.y / 128);
    },

    cleanupThis: function() {
        this.destroy();
    },

    removeUIBullet: function(count = 1) {
        for (var x = 0; x < count; ++x) {
            for (var i = this.uiAmmoBullets.length - 1; i >= 0; --i)
            {
                if (this.uiAmmoBullets[i].visible) {
                    this.uiAmmoBullets[i].visible = false;
                    break;
                }
            }
        }
    },
    resetUIBullets: function(count, max) {
        for (var i = 0; i < this.uiAmmoBullets.length; ++i)
        {
            if (i < count) {
                this.uiAmmoBullets[i].visible = true;
            } else {
                this.uiAmmoBullets[i].visible = false;
            }
        }
        if (max == undefined) max = count;
        for (var i = 0; i < this.uiAmmoEmpties.length; ++i)
        {
            if (i < max) {
                this.uiAmmoEmpties[i].visible = true;
            }
            else {
                this.uiAmmoEmpties[i].visible = false;
            }
        }
    },
    removeUIArmor: function(count) {
        for (var x = 0; x < count; ++x) {
            for (var i = this.uiArmor.length - 1; i >= 0; --i)
            {
                if (this.uiArmor[i].visible) {
                    this.uiArmor[i].visible = false;
                    break;
                }
            }
        }
    },
    resetUIArmor: function(count, max, shake) {
        for (var i = 0; i < this.uiArmor.length; ++i)
        {
            if (i < count) {
                this.uiArmor[i].visible = true;
            } else {
                this.uiArmor[i].visible = false;
            }
        }
        if (max == undefined) max = count;
        for (var i = 0; i < this.uiArmorEmpties.length; ++i)
        {
            if (i < max) {
                this.uiArmorEmpties[i].visible = true;
            } else {
                this.uiArmorEmpties[i].visible = false;
            }
        }
        if (shake) {
            this.shakeEffect(this.armorGroup);
        }
    },

    onFadeComplete: function() {
        game.camera.flash(0x000000, 1000, true, 1);
    },

    render: function() {
        this.player.render();
        this.level.render();
        for (var i = 0; i < this.towers.length; i++)
        {
            if (this.towers[i].alive)
            {
                this.towers[i].render();
            }
        }
        var fps = game.time.fps;
        var color = '#000000';
        if (fps >= 55) {
            color = '#00ff00';
        } else if (fps >= 30) {
            color = '#ffff00';
        }
        else {
            color = '#ff0000';
        }
        game.debug.text(fps, GAME_WIDTH - 30, 14, color);
    },
    setupParticles: function() {
        this.muzzleFlashlosions = game.add.group();
        this.muzzleFlashlosions.classType = Phaser.Particles.Arcade.Emitter;
        for (var i = 0; i < 10; ++i)
        {
            var ex = game.add.emitter(0, 0, 20);
            this.muzzleFlashlosions.add(ex);
            ex.makeParticles('exp');
            ex.setYSpeed(-150, 150);
            ex.setXSpeed(-150, 150);
            ex.forEach(function(particle) { particle.tint = 0xCD463A;});
        }
    },
    shakeEffect: function(g) {
        var move = game.rnd.between(1, 3);
        var time = game.rnd.between(10, 20);
        game.add.tween(g)
        .to({y:"-"+move}, time).to({y:"+"+move*2}, time*2).to({y:"-"+move}, time)
        .to({y:"-"+move}, time).to({y:"+"+move*2}, time*2).to({y:"-"+move}, time)
        .to({y:"-"+move/2}, time).to({y:"+"+move}, time*2).to({y:"-"+move/2}, time)
        .start();

        game.add.tween(g)
        .to({x:"-"+move}, time).to({x:"+"+move*2}, time*2).to({x:"-"+move}, time)
        .to({x:"-"+move}, time).to({x:"+"+move*2}, time*2).to({x:"-"+move}, time)
        .to({x:"-"+move/2}, time).to({x:"+"+move}, time*2).to({x:"-"+move/2}, time)
        .start();
    },
};

const DEBUG_COLLISIONS = false;
const DEBUG_WEAPON = false;
const ROAD_TILES = [2, 3, 4, 5, 6, 7, 10, 
                    12, 13, 14, 15, 16, 17, 20,
                    22, 23, 24, 25, 26, 27, 28, 29, 30,
                    32, 33, 34, 35, 36, 37, 38, 39, 40,
                    57, 58, 65, 67, 68 
                    ];
const STAINS = ['stain01', 'stain02', 'stain03'];
const halfPi = (Math.PI / 2);
const ACCEL = 120000;
const RECOIL_TIME = 30;
const RECOIL_STRENGTH = 5;
const TURN_RATE = Math.PI;
const LEVEL_LAYER = 'Foreground';
const BACKGROUND_LAYER = 'Background';
const MAX_UI_BULLETS = 20;
const MINIMAP_Y = 65;

var game = new Phaser.Game(GAME_WIDTH, GAME_HEIGHT);
game.state.add('Play', mainState);
game.state.add('Boot', Boot);
game.state.add('Load', Load);
game.state.start('Boot');