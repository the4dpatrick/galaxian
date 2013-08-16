var game = new Game();

function init() {
	if(game.init())
		game.start();
}

var imageRepository = new function() {
	
	this.background = new Image();
	this.spider = new Image();
	this.bullet = new Image();
	
	var numImages = 3;
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
	
	this.background.src = "imgs/bg.png";
	this.spider.src = "imgs/spider.png";
	this.bullet.src = "imgs/bullet.png";
	
}

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
	
	this.draw = function() {
	};
	this.move = function() {
	};
}

function Background() {
	this.speed = 1;
	
	this.draw = function() {
		this.y += this.speed;
		this.context.drawImage(imageRepository.background, this.x, this.y);
		
		this.context.drawImage(imageRepository.background, this.x, this.y - this.canvasHeight);
		
		if (this.y >= this.canvasHeight)
			this.y = 0;
	};
}
Background.prototype = new Drawable();


function Bullet() {
	this.alive = false;
	
	this.spawn = function(x, y, speed) {
		this.x = x;
		this.y = y;
		this.speed = speed;
		this.alive = true;
	};
	
	this.draw = function() {
		this.context.clearRect(this.x, this.y, this.width, this.height);
		this.y -= this.speed; //subtract the speed in pixels from the y value. Making it go up
		if (this.y <= 0 - this.height) { //when the top of the Cleared Rectangle surpasses the top of the canvas
			return true; 
			// return true so the bullet can be animated and cleared
		} 
		else {
			this.context.drawImage(imageRepository.bullet, this.x, this.y);
			//draw bullet if within the screen
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

function Pool(maxSize) {
	var size = maxSize;
	var pool = [];
	
	this.init = function() {
		for (var i = 0; i < size; i++) {
			var bullet = new Bullet();
			bullet.init(0,0, imageRepository.bullet.width, 
							imageRepository.bullet.height);
			pool[i] = bullet;
		}
	};
	
	this.get = function(x, y, speed) {
		if(!pool[size - 1].alive) {
			pool[size - 1].spawn(x, y, speed);
			pool.unshift(pool.pop());//unshift() is like push() but adds items to the front of the array instead of the back
		}
	};
	
	this.getTwo = function(x1, y1, speed1, x2, y2, speed2) {
		if(!pool[size - 1].alive &&
			!pool[size - 2].alive) {
				this.get(x1, y1, speed1);
				this.get(x2, y2, speed2);
			}
	};
	
	this.animate = function() {
		for (var i = 0; i < size; i++) {
			if (pool[i].alive) {
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

function Spider() {
	this.speed = 3;
	this.bulletPool = new Pool(30);
	this.bulletPool.init();
	
	var fireRate = 15;
	var counter = 0;
	
	this.draw = function() {
		this.context.drawImage(imageRepository.spider, this.x, this.y);
	};
	this.move = function() {
		counter++;
		if (KEY_STATUS.left || KEY_STATUS.right ||
			KEY_STATUS.down || KEY_STATUS.up) {
			
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
			
			this.draw();
		}
		
		if (KEY_STATUS.space && counter >= fireRate) {
			this.fire();
			counter = 0;
		}
	};
	
	this.fire = function() {
		this.bulletPool.getTwo(this.x+28, this.y+15, 3,
							   this.x+43, this.y+15, 3);
	};
}
Spider.prototype = new Drawable();

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
		
			this.background = new Background();
			this.background.init(0,0);
		
			this.spider = new Spider();
			var spiderStartX = this.spiderCanvas.width/2 - imageRepository.spider.width;
		    var spiderStartY = this.spiderCanvas.height - imageRepository.spider.height;
		    this.spider.init(spiderStartX, spiderStartY, imageRepository.spider.width,
		                     imageRepository.spider.height);

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

function animate() {
  requestAnimFrame( animate );
  game.background.draw();
  game.spider.move();
  game.spider.bulletPool.animate();
}

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

