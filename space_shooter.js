var game = new Game();

function init() {
	if(game.init()) // if HTML5 canvas is supported
		game.start();
}

/********************************************************
imageRepository 
********************************************************/
var imageRepository = new function() {
	
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
	this.background.onload = function() {
		imageLoaded();
	}
	this.spider.onload = function() {
		imageLoaded();
	}
	this.bullet.onload = function() {
		imageLoaded();
	}
	this.enemy.onload = function() {
		imageLoaded();
	}
	this.enemyBullet.onload = function() {
		imageLoaded();
	}
	
	this.background.src = "imgs/bg.png";
	this.spider.src = "imgs/spider.png"; //http://img560.imageshack.us/img560/3915/sprboss2strip4.png
	this.bullet.src = "imgs/bullet.png";
	this.enemy.src = "imgs/enemy.png";
	this.enemyBullet.src = "imgs/bullet_enemy.png";
}

/********************************************************
Drawable abstract object
********************************************************/
function Drawable() {
	this.init = function(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
	
	this.speed = 0;
	this.canvasWidth = 0;
	this.canvasHeight = 0;
	
	// abstract or placeholder functions are defined because they will be redefined in other functions
	this.draw = function() {
	};
	this.move = function() {
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
	
	this.spawn = function(x, y, speed) {
		this.x = x;
		this.y = y;
		this.speed = speed;
		this.alive = true;
	};
	
	this.draw = function() {
		this.context.clearRect(this.x-1, this.y-1, this.width+1, this.height+1);
		this.y -= this.speed; //subtract the speed in pixels from the y value. Making it go up
		if (self === "bullet" && this.y <= 0 - this.height) {
			return true;
		}
		else if (self === "enemyBullet" && this.y >= this.canvasHeight) {
			return true;
		}
		else {
			if (self === "bullet") {
				this.context.drawImage(imageRepository.bullet, this.x, this.y);
			}
			else if (self === "enemyBullet") {
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
	};
}
Bullet.prototype = new Drawable();

/********************************************************
Pool
********************************************************/
function Pool(maxSize) {
	var size = maxSize;
	var pool = [];
	
	this.init = function(object) {
		if (object == "bullet") {
			for (var i = 0; i < size; i++) {
				var bullet = new Bullet("bullet");
				bullet.init(0,0, imageRepository.bullet.width, 
								imageRepository.bullet.height);
				pool[i] = bullet;
			}
		}
		else if (object == "enemy") {
			for (var i = 0; i < size; i++) {
				var enemy = new Enemy();
				enemy.init(0,0, imageRepository.enemy.width, imageRepository.enemy.height);
				pool[i] = enemy;
			}
		}
		else if (object == "enemyBullet") {
			for (var i = 0; i < size; i++) {
				var bullet = new Bullet("enemyBullet");
				bullet.init(0,0, imageRepository.enemyBullet.width, imageRepository.enemyBullet.height);
				pool[i] = bullet;
			}
		}
	};
	
	this.get = function(x, y, speed) {
		if(!pool[size - 1].alive) {
			pool[size - 1].spawn(x, y, speed);
			pool.unshift(pool.pop());//unshift() is like push() but adds items to the front of the array instead of the back
		}
	};
	
	this.getTwo = function(x1, y1, speed1, x2, y2, speed2) {
		//Checks that the last two bullets in the pool are not alive
		if(!pool[size - 1].alive &&	!pool[size - 2].alive) { 
				this.get(x1, y1, speed1);
				this.get(x2, y2, speed2);
			}
	};
	
	this.animate = function() {
		for (var i = 0; i < size; i++) {
			if (pool[i].alive) { //True if at the end of the canvas
				if (pool[i].draw()) {
					pool[i].clear(); //reset x, y, speed, alive values
					pool.push((pool.splice(i,1))[0]);
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
	this.bulletPool.init("bullet");
	var fireRate = 15;
	var counter = 0;
	
	this.draw = function() {
		this.context.drawImage(imageRepository.spider, this.x, this.y);
	};
	this.move = function() {
		counter++; // increment counter per frame
		if (KEY_STATUS.left || KEY_STATUS.right ||
			KEY_STATUS.down || KEY_STATUS.up) {
				
			//clear current image
			this.context.clearRect(this.x, this.y, this.width, this.height);
			
			if (KEY_STATUS.left) {
				this.x -= this.speed
				if (this.x <= 0)
					this.x = 0;
			} else if (KEY_STATUS.right) {
				this.x += this.speed
				if (this.x >= this.canvasWidth - this.width)
					this.x = this.canvasWidth - this.width;
			} else if (KEY_STATUS.up) {
				this.y -= this.speed
				if (this.y <= this.canvasHeight/4*3)
					this.y = this.canvasHeight/4*3;
			} else if (KEY_STATUS.down) {
				this.y += this.speed
				if (this.y >= this.canvasHeight - this.height)
					this.y = this.canvasHeight - this.height;
			}
			
			this.draw(); //redraw 
		}
		// fire() when spacebar is clicked and counter is greater or equal to fireRate
		// Limits the amount of bullets fired based on fireRate
		if (KEY_STATUS.space && counter >= fireRate) {
			this.fire();
			counter = 0; // Reset counter to 0 until 15 frames or more has passed
		}
	};
	
	this.fire = function() {
		this.bulletPool.getTwo(this.x+28, this.y+15, 3,
							   this.x+43, this.y+15, 3);
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
	
	this.spawn = function(x, y, speed) {
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
	
	this.draw = function() {
		this.context.clearRect(this.x-1, this.y, this.width+1, this.height);
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
		
		this.context.drawImage(imageRepository.enemy, this.x, this.y);
		
		chance = Math.floor(Math.random()*101);
		if (chance/100 < percentFire) {
			this.fire();
		}
	};
	
	this.fire = function() {
		game.enemyBulletPool.get(this.x+this.width/2, this.y+this.height, -2,5);
	}
	
	this.clear = function() {
		this.x = 0;
		this.y = 0;
		this.speed = 0;
		this.speedX = 0;
		this.speedY = 0;
		this.alive = false;
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
			this.background.init(0,0);
			
			//init spider object
			this.spider = new Spider();
			var spiderStartX = this.spiderCanvas.width/2 - imageRepository.spider.width;
		    var spiderStartY = this.spiderCanvas.height - imageRepository.spider.height;
		    this.spider.init(spiderStartX, spiderStartY, imageRepository.spider.width,
		                     imageRepository.spider.height);

			//init enemy pool object
			this.enemyPool = new Pool(30);
			this.enemyPool.init("enemy");
			var height = imageRepository.enemy.height;
			var width = imageRepository.enemy.width;
			var x = 100;
			var y = -height; //start off screen
			var spacer = y * 1.5; // How far apart enemies will be from one another
			for (var i = 1; i <= 18; i++) {
				this.enemyPool.get(x,y,2);
				x += width + 25;
				if (i % 6 == 0) { // Move down a row once 6 enemies have been spawned
					x = 100; // Reset to the left most spot
					y += spacer; // add space between rows
				}
			}
			
			this.enemyBulletPool = new Pool(50);
			this.enemyBulletPool.init("enemyBullet");
		
		    return true;
		  } else {
		    return false;
		  }
	};
	this.start = function() {
	  this.spider.draw();
	  animate();
	};
}

/********************************************************
Animate
********************************************************/
function animate() {
  requestAnimFrame( animate );
  game.background.draw();
  game.spider.move();
  game.spider.bulletPool.animate();
  game.enemyPool.animate();
  game.enemyBulletPool.animate();
}

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
  KEY_STATUS[ KEY_CODES[ code ]] = false;
}
document.onkeydown = function(e) {
  var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if (KEY_CODES[keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[keyCode]] = true;
  }
}
document.onkeyup = function(e) {
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
window.requestAnimFrame = (function(){
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function( callback, element){
			window.setTimeout(callback, 1000 / 60); //60 frames per second.
		};
})();

