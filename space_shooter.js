var imageRepository = new function() {
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
		
		if (this.y &gt;= this.canvasHeight)
			this.y = 0;
	};
}
Background.prototype = new Drawable();