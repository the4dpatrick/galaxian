var game = new Game();

function init() {
	if(game.init())
		game.start();
}

var imageRepository = new function() {
	this.empty = null;
	this.background = new Image();
	
	this.background.src = "imgs/bg.png";
}

function Drawable() {
	this.init = function(x, y) {
		this.x = x;
		this.y = y;
	}
	
	this.speed = 0;
	this.canvasWidth = 0;
	this.canvasHeight = 0;
	
	this.draw = function() {
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

function Game() {
	this.init = function() {
		this.bgCanvas = document.getElementById('background');
		
		if (this.bgCanvas.getContext) {
			this.bgContext = this.bgCanvas.getContext('2d');
			
			Background.prototype.context = this.bgContext;
			Background.prototype.canvasWidth = this.bgCanvas.width;
			Background.prototype.canvasHeight = this.bgCanvas.height;
			
			this.background = new Background();
			this.background.init(0,0);
			return true;
		} else {
			return false;
		}
	};
	this.start = function() {
		animate();
	};
}

function animate() {
	requestAnimFrame( animate );
	game.background.draw();
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

