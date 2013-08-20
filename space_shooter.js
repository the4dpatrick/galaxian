var game = new Game();

function init() {
    game.init();

}

/********************************************************
imageRepository 
********************************************************/
var imageRepository = new function () {

        this.background = new Image();
        this.spider = new Image();
        this.bullet = new Image();
        this.enemy = new Image();
        this.enemyBullet = new Image();

        //Ensure all 5 images have loaded before initializing the window
        var numImages = 5;
        var numLoaded = 0;

        function imageLoaded() {
            numLoaded++;
            if (numLoaded === numImages) {
                window.init();
            }
        }
        this.background.onload = function () {
            imageLoaded();
        };
        this.spider.onload = function () {
            imageLoaded();
        };
        this.bullet.onload = function () {
            imageLoaded();
        };
        this.enemy.onload = function () {
            imageLoaded();
        };
        this.enemyBullet.onload = function () {
            imageLoaded();
        };

        this.background.src = "imgs/bg.png";
        this.spider.src = "imgs/spider.png"; //http://img560.imageshack.us/img560/3915/sprboss2strip4.png
        this.bullet.src = "imgs/bullet.png";
        this.enemy.src = "imgs/enemy.png";
        this.enemyBullet.src = "imgs/bullet_enemy.png";
    };
/********************************************************
Drawable abstract object
********************************************************/

function Drawable() {
    this.init = function (x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    this.speed = 0;
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.collidableWith = "";
    this.isColliding = false;
    this.type = "";

    // abstract or placeholder functions are defined because they will be redefined in other functions
    this.draw = function () {};
    this.move = function () {};
    this.isCollidableWith = function (object) {
        return (this.collidableWith === object.type);
    };
}

/********************************************************
Background
********************************************************/

function Background() {
    this.speed = 1;

    this.draw = function() {
        this.y += this.speed;
        this.context.drawImage(imageRepository.background, this.x, this.y);

        this.context.drawImage(imageRepository.background, this.x, this.y - this.canvasHeight);
        // Creates a second image to create the illusion of an endless background
        // Resets loop once bottom of canvas is reached
        if (this.y >= this.canvasHeight) {
            this.y = 0;
        }
    };
}
Background.prototype = new Drawable();

/********************************************************
Bullet
********************************************************/

function Bullet(object) {
    this.alive = false;
    var self = object; //argument is passed in for either a bullet or an enemyBullet

    this.spawn = function (x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.alive = true;
    };

    this.draw = function() {
        this.context.clearRect(this.x - 1, this.y - 1, this.width + 1, this.height + 1);
        this.y -= this.speed; //subtract the speed in pixels from the y value. Making it go up

        if (this.isColliding) {
            return true;
        } else if (self === "bullet" && this.y <= 0 - this.height) {
            return true;
        } else if (self === "enemyBullet" && this.y >= this.canvasHeight) {
            return true;
        } else {
            if (self === "bullet") {
                this.context.drawImage(imageRepository.bullet, this.x, this.y);
            } else if (self === "enemyBullet") {
                this.context.drawImage(imageRepository.enemyBullet, this.x, this.y);
            }

            return false;
        }
    };

    this.clear = function() {
        this.x = 0;
        this.y = 0;
        this.speed = 0;
        this.alive = false;
        this.isColliding = false;
    };
}
Bullet.prototype = new Drawable();

/**
 * QuadTree object.
 *
 * The quadrant indexes are numbered as below:
 *     |
 *  1  |  0
 * ----+----
 *  2  |  3
 *     |
 * Copied
 */

function QuadTree(boundBox, lvl) {
    var maxObjects = 10;
    this.bounds = boundBox || {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };
    var objects = [];
    this.nodes = [];
    var level = lvl || 0;
    var maxLevels = 5;

    /*
     * Clears the quadTree and all nodes of objects
     */
    this.clear = function () {
        objects = [];

        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].clear();
        }

        this.nodes = [];
    };

    /*
     * Get all objects in the quadTree
     */
    this.getAllObjects = function (returnedObjects) {
        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].getAllObjects(returnedObjects);
        }

        for (var i = 0, len = objects.length; i < len; i++) {
            returnedObjects.push(objects[i]);
        }

        return returnedObjects;
    };

    /*
     * Return all objects that the object could collide with
     */
    this.findObjects = function (returnedObjects, obj) {
        if (typeof obj === "undefined") {
            console.log("UNDEFINED OBJECT");
            return;
        }

        var index = this.getIndex(obj);
        if (index != -1 && this.nodes.length) {
            this.nodes[index].findObjects(returnedObjects, obj);
        }

        for (var i = 0, len = objects.length; i < len; i++) {
            returnedObjects.push(objects[i]);
        }

        return returnedObjects;
    };

    /*
     * Insert the object into the quadTree. If the tree
     * excedes the capacity, it will split and add all
     * objects to their corresponding nodes.
     */
    this.insert = function (obj) {
        if (typeof obj === "undefined") {
            return;
        }

        if (obj instanceof Array) {
            for (var i = 0, len = obj.length; i < len; i++) {
                this.insert(obj[i]);
            }

            return;
        }

        if (this.nodes.length) {
            var index = this.getIndex(obj);
            // Only add the object to a subnode if it can fit completely 
            // within one
            if (index !== -1) {
                this.nodes[index].insert(obj);

                return;
            }
        }

        objects.push(obj);

        // Prevent infinite splitting
        if (objects.length > maxObjects && level < maxLevels) {
            if (this.nodes[0] === null) {
                this.split();
            }

            var i = 0;
            while (i < objects.length) {

                var index = this.getIndex(objects[i]);
                if (index !== -1) {
                    this.nodes[index].insert((objects.splice(i, 1))[0]);
                } else {
                    i++;
                }
            }
        }
    };

    /*
     * Determine which node the object belongs to. -1 means
     * object cannot completely fit within a node and is part
     * of the current node
     */
    this.getIndex = function (obj) {

        var index = -1;
        var verticalMidpoint = this.bounds.x + this.bounds.width / 2;
        var horizontalMidpoint = this.bounds.y + this.bounds.height / 2;

        // Object can fit completely within the top quadrant
        var topQuadrant = (obj.y < horizontalMidpoint && obj.y + obj.height < horizontalMidpoint);
        // Object can fit completely within the bottom quandrant
        var bottomQuadrant = (obj.y > horizontalMidpoint);

        // Object can fit completely within the left quadrants
        if (obj.x < verticalMidpoint &&
            obj.x + obj.width < verticalMidpoint) {
            if (topQuadrant) {
                index = 1;
            } else if (bottomQuadrant) {
                index = 2;
            }
        }
        // Object can fix completely within the right quandrants
        else if (obj.x > verticalMidpoint) {
            if (topQuadrant) {
                index = 0;
            } else if (bottomQuadrant) {
                index = 3;
            }
        }

        return index;
    };

    /* 
     * Splits the node into 4 subnodes
     */
    this.split = function () {
        // Bitwise or [html5rocks]
        var subWidth = (this.bounds.width / 2) | 0;
        var subHeight = (this.bounds.height / 2) | 0;

        this.nodes[0] = new QuadTree({
            x: this.bounds.x + subWidth,
            y: this.bounds.y,
            width: subWidth,
            height: subHeight
        }, level + 1);
        this.nodes[1] = new QuadTree({
            x: this.bounds.x,
            y: this.bounds.y,
            width: subWidth,
            height: subHeight
        }, level + 1);
        this.nodes[2] = new QuadTree({
            x: this.bounds.x,
            y: this.bounds.y + subHeight,
            width: subWidth,
            height: subHeight
        }, level + 1);
        this.nodes[3] = new QuadTree({
            x: this.bounds.x + subWidth,
            y: this.bounds.y + subHeight,
            width: subWidth,
            height: subHeight
        }, level + 1);
    };
}

/********************************************************
Pool
********************************************************/

function Pool(maxSize) {
    var size = maxSize;
    var pool = [];

	this.getPool = function () {
        var obj = [];
        for (var i = 0; i < size; i++) {
            if (pool[i].alive) {
                obj.push(pool[i]);
            }
        }
        return obj;
    }

    this.init = function (object) {
        if (object == "bullet") {
            for (var i = 0; i < size; i++) {
                var bullet = new Bullet("bullet");
                bullet.init(0, 0, imageRepository.bullet.width, imageRepository.bullet.height);
                bullet.collidableWith = "enemy";
                bullet.type = "bullet";
                pool[i] = bullet;
            }
        } 
		else if (object == "enemy") {
            for (var i = 0; i < size; i++) {
                var enemy = new Enemy();
                enemy.init(0, 0, imageRepository.enemy.width, imageRepository.enemy.height);
                pool[i] = enemy;
            }
        } 
		else if (object == "enemyBullet") {
            for (var i = 0; i < size; i++) {
                var bullet = new Bullet("enemyBullet");
                bullet.init(0, 0, imageRepository.enemyBullet.width, imageRepository.enemyBullet.height);
                bullet.collidableWith = "spider";
                bullet.type = "enemyBullet";
                pool[i] = bullet;
            }
        }
    };


    this.get = function (x, y, speed) {
        if (!pool[size - 1].alive) {
            pool[size - 1].spawn(x, y, speed);
            pool.unshift(pool.pop()); //unshift() is like push() but adds items to the front of the array instead of the back
        }
    };

    this.getTwo = function (x1, y1, speed1, x2, y2, speed2) {
        //Checks that the last two bullets in the pool are not alive
        if (!pool[size - 1].alive && !pool[size - 2].alive) {
            this.get(x1, y1, speed1);
            this.get(x2, y2, speed2);
        }
    };

    this.animate = function () {
        for (var i = 0; i < size; i++) {
            if (pool[i].alive) { //True if at the end of the canvas
                if (pool[i].draw()) {
                    pool[i].clear(); //reset x, y, speed, alive values
                    pool.push((pool.splice(i, 1))[0]);
                }
            } 
			else
                break;
        }
    };
}

/********************************************************
Spider
********************************************************/

function Spider() {
    this.speed = 3;
    this.bulletPool = new Pool(30);
    var fireRate = 15;
    var counter = 0;
    this.collidableWith = "enemyBullet";
    this.type = "spider";

    this.draw = function () {
        this.context.drawImage(imageRepository.spider, this.x, this.y);
    };
    this.move = function () {
        counter++; // increment counter per frame
        if (KEY_STATUS.left || KEY_STATUS.right ||
            KEY_STATUS.down || KEY_STATUS.up) {

            //clear current image
            this.context.clearRect(this.x, this.y, this.width, this.height);

            if (KEY_STATUS.left) {
                this.x -= this.speed;
                if (this.x <= 0)
                    this.x = 0;
            } else if (KEY_STATUS.right) {
                this.x += this.speed;
                if (this.x >= this.canvasWidth - this.width)
                    this.x = this.canvasWidth - this.width;
            } else if (KEY_STATUS.up) {
                this.y -= this.speed;
                if (this.y <= this.canvasHeight / 4 * 3)
                    this.y = this.canvasHeight / 4 * 3;
            } else if (KEY_STATUS.down) {
                this.y += this.speed;
                if (this.y >= this.canvasHeight - this.height)
                    this.y = this.canvasHeight - this.height;
            }
		}

		if (!this.isColliding) {
		    this.draw(); //redraw
		} 
		else {
		    this.alive = false;
		    game.gameOver();
		}

		// fire() when spacebar is clicked and counter is greater or equal to fireRate
		// Limits the amount of bullets fired based on fireRate
		if (KEY_STATUS.space && counter >= fireRate) {
		    this.fire();
		    counter = 0; // Reset counter to 0 until 15 frames or more has passed
		}
	};

    this.fire = function () {
        this.bulletPool.getTwo(this.x + 28, this.y + 15, 3,
            this.x + 43, this.y + 15, 3);
        game.laser.get();
    };
}

Spider.prototype = new Drawable();

/********************************************************
Enemy 
********************************************************/

function Enemy() {
    var percentFire = .01;
    var chance = 0;
    this.alive = false;
    this.collidableWith = "bullet";
    this.type = "enemy";

    this.spawn = function (x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.speedX = 0;
        this.speedY = speed;
        this.alive = true;
        this.leftEdge = this.x - 90;
        this.rightEdge = this.x + 90;
        this.bottomEdge = this.y + 140;
    };

    this.draw = function () {
        this.context.clearRect(this.x - 1, this.y, this.width + 1, this.height);
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x <= this.leftEdge) {
            this.speedX = this.speed;
        } 
		else if (this.x >= this.rightEdge + this.width) {
            this.speedX = -this.speed; //Reverse direction
        } 
		else if (this.y >= this.bottomEdge) {
            this.speed = 1.5;
            this.speedY = 0;
            this.y -= 5;
            this.speedX = -this.speed;
        }

        if (!this.isColliding) {
            this.context.drawImage(imageRepository.enemy, this.x, this.y);

            chance = Math.floor(Math.random() * 101);
            if (chance / 100 < percentFire) {
                this.fire();
            }

            return false;
        } 
		else {
            game.playerScore += 10;
            game.explosion.get();
            return true;
        }
    };

    this.fire = function () {
        game.enemyBulletPool.get(this.x + this.width / 2, this.y + this.height, -2, 5);
    };

    this.clear = function () {
        this.x = 0;
        this.y = 0;
        this.speed = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.alive = false;
        this.isColliding = false;
    };
}
Enemy.prototype = new Drawable();

/********************************************************
Game
********************************************************/

function Game() {

    this.init = function() {

        this.bgCanvas = document.getElementById('background');
        this.spiderCanvas = document.getElementById('spider');
        this.mainCanvas = document.getElementById('main');

        if (this.bgCanvas.getContext) {
            this.bgContext = this.bgCanvas.getContext('2d');
            this.spiderContext = this.spiderCanvas.getContext('2d');
            this.mainContext = this.mainCanvas.getContext('2d');

            Background.prototype.context = this.bgContext;
            Background.prototype.canvasWidth = this.bgCanvas.width;
            Background.prototype.canvasHeight = this.bgCanvas.height;

            Spider.prototype.context = this.spiderContext;
            Spider.prototype.canvasWidth = this.spiderCanvas.width;
            Spider.prototype.canvasHeight = this.spiderCanvas.height;

            Bullet.prototype.context = this.mainContext;
            Bullet.prototype.canvasWidth = this.mainCanvas.width;
            Bullet.prototype.canvasHeight = this.mainCanvas.height;

            Enemy.prototype.context = this.mainContext;
            Enemy.prototype.canvasWidth = this.mainCanvas.width;
            Enemy.prototype.canvasHeight = this.mainCanvas.height;

            //init background object
            this.background = new Background();
            this.background.init(0, 0);

            //init spider object
            this.spider = new Spider();

            spiderStartX = this.spiderCanvas.width / 2 - imageRepository.spider.width;
            spiderStartY = this.spiderCanvas.height - imageRepository.spider.height;
            this.spider.init(spiderStartX, spiderStartY, imageRepository.spider.width, imageRepository.spider.height);

            //init enemy pool object
            this.enemyPool = new Pool(30);
            this.enemyPool.init("enemy");
            this.spawnWave();

            this.enemyBulletPool = new Pool(50);
            this.enemyBulletPool.init("enemyBullet");

            this.quadTree = new QuadTree({
                x: 0,
                y: 0,
                width: this.mainCanvas.width,
                height: this.mainCanvas.height
            });

            this.playerScore = 0;

            this.laser = new SoundPool(10);
            this.laser.init("laser");

            this.explosion = new SoundPool(20);
            this.explosion.init("explosion");

            this.backgroundAudio = new Audio("sounds/kick_shock.wav");
            this.backgroundAudio.loop = true;
            this.backgroundAudio.volume = .25;
            this.backgroundAudio.load();

            this.gameOverAudio = new Audio("sounds/game_over.wav");
            this.gameOverAudio.loop = true;
            this.gameOverAudio.volume = .25;
            this.gameOverAudio.load();

            this.checkAudio = window.setInterval(function () {checkReadyState()}, 1000);
        }
    };

    this.spawnWave = function () {
        var height = imageRepository.enemy.height;
        var width = imageRepository.enemy.width;
        var x = 100;
        var y = -height; //start off screen
        var spacer = y * 1.5; // How far apart enemies will be from one another
        for (var i = 1; i <= 18; i++) {
            this.enemyPool.get(x, y, 2);
            x += width + 25;
            if (i % 6 == 0) { // Move down a row once 6 enemies have been spawned
                x = 100; // Reset to the left most spot
                y += spacer; // add space between rows
            }
        }
    }
    this.start = function () {
        this.spider.draw();
        this.backgroundAudio.play();
        animate();
    };

    this.restart = function () {
        this.gameOverAudio.pause();

        document.getElementById('game-over').style.display = 'none';
        this.bgContext.clearRest(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        this.spiderContext.clearRest(0, 0, this.spiderCanvas.width, this.spiderCanvas.height);
        this.mainContext.clearRest(0, 0, this.mainCanvas.width, this.mainCanvas.height);

        this.quadTree.clear();

        this.background.init(0, 0);
        this.spider.init(this.spiderStartX, this.spiderStartY,
            imageRepository.spider.width, imageRepository.spider.height);

        this.enemyPool.init("enemy");
        this.spawnWave();
        this.enemyBulletPool.init("enemyBullet");

        this.playerScore = 0;

        this.backgroundAudio.currentTime = 0;
        this.backgroundAudio.play();

        this.start();
    };

    this.gameOver = function () {
        this.backgroundAudio.pause();
        this.gameOverAudio.currentTime = 0;
        this.gameOverAudio.play();
        document.getElementById('game-over').style.display = "block";
    };
}
/********************************************************
check Ready State
********************************************************/

function checkReadyState() {
    if (game.gameOverAudio.readyState === 4 && game.backgroundAudio.readyState === 4) {
        window.clearInterval(game.checkAudio);
        document.getElementById('loading').style.display = "none";
        game.start();
    }
}

/********************************************************
SoundPool
********************************************************/

function SoundPool(maxSize) {
    var size = maxSize;
    var pool = [];
    this.pool = pool;
    var currSound = 0;

    this.init = function (object) {
        if (object == "laser") {
            for (var i = 0; i < size; i++) {
                laser = new Audio("sounds/laser.wav");
                laser.volume = .12;
                laser.load();
                pool[i] = laser;
            }
        } else if (object == "explosion") {
            for (var i = 0; i < size; i++) {
                var explosion = new Audio("sounds/explosion.wav");
                explosion.volume = .1;
                explosion.load();
                pool[i] = explosion;
            }
        }
    };

    this.get = function () {
        if (pool[currSound].currentTime == 0 || pool[currSound].ended) {
            pool[currSound].play();
        }
        currSound = (currSound + 1) % size;
    };

}
/********************************************************
Animate
********************************************************/

function animate() {
    document.getElementById('score').innerHTML = game.playerScore;

    game.quadTree.clear();
    game.quadTree.insert(game.spider);
    game.quadTree.insert(game.spider.bulletPool.getPool());
    game.quadTree.insert(game.enemyPool.getPool());
    game.quadTree.insert(game.enemyBulletPool.getPool());

    detectCollision();

    if (game.enemyPool.getPool().length === 0) {
        game.spawnWave();
    }

    if (game.spider.alive) {
        requestAnimFrame(animate);

        game.background.draw();
        game.spider.move();
        game.spider.bulletPool.animate();
        game.enemyPool.animate();
        game.enemyBulletPool.animate();
    }
}

/********************************************************
detectCollision
********************************************************/

function detectCollision() {
    var objects = [];
    game.quadTree.getAllObjects(objects);

    for (var x = 0, len = objects.length; x < len; x++) {
        game.quadTree.findObjects(obj = [], objects[x]);

        for (y = 0, length = obj.length; y < length; y++) {

            // DETECT COLLISION ALGORITHM
            if (objects[x].collidableWith === obj[y].type &&
                (objects[x].x < obj[y].x + obj[y].width &&
                    objects[x].x + objects[x].width > obj[y].x &&
                    objects[x].y < obj[y].y + obj[y].height &&
                    objects[x].y + objects[x].height > obj[y].y)) {
                objects[x].isColliding = true;
                obj[y].isColliding = true;
            }
        }
    }
};
/********************************************************
Keystrokes
********************************************************/
KEY_CODES = {
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
}

KEY_STATUS = {};
for (code in KEY_CODES) {
    KEY_STATUS[KEY_CODES[code]] = false;
}
document.onkeydown = function (e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
        e.preventDefault();
        KEY_STATUS[KEY_CODES[keyCode]] = true;
    }
}
document.onkeyup = function (e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
        e.preventDefault();
        KEY_STATUS[KEY_CODES[keyCode]] = false;
    }
}

/**	
 * requestAnim shim layer by Paul Irish
 * Finds the first API that works to optimize the animation loop,
 * otherwise defaults to setTimeout().
 */
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback, element) {
            window.setTimeout(callback, 1000 / 60); //60 frames per second.
    }
})
();