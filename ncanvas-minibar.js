/* NProgressBar */

function NProgressBar() {
	this.type = NProgressBar.FROM_LEFT;
	this.value = 0.1;
	this.animated = true;
	this.animValue = 0.1;
	
	NRect .call(this, arguments[0]);
	this.draw = function(ctx) {
		ctx.fillStyle = this.style.color;
		ctx. strokeStyle = ctx.fillStyle = this.style.color;
		ctx.globalAlpha = this.style.opacity;
		var current_value = this.animValue = this.animated ? this.animValue + (this.value - this.animValue)*0.1 : this.value;
		
		if( this.type == NProgressBar.FROM_LEFT ) {
			if( current_value < 0.95 ) {
				ctx.strokeRect(this.x - 0.5, this.y - 0.5, this.width + 1, this.height + 1);
				ctx.globalAlpha = Math.max(this.style.opacity-0.2, 0);
				ctx.fillRect(this.x, this.y, Math.min(this.width*current_value, this.width), this.height);
			} else {
				ctx.fillRect(this.x - 0.5, this.y - 0.5, this.width + 1, this.height + 1);
			}
		} else {
			// TODO: handle all progress types
		}
		
		return this;
	}
}
NProgressBar.prototype = new NRect(); 
NProgressBar.prototype.constructor = NProgressBar;
NProgressBar.FROM_RIGHT = 0;
NProgressBar.FROM_LEFT = 1;
NProgressBar.FROM_TOP = 2;
NProgressBar.FROM_BOTTOM = 3;

/* NMinibar */

function NMinibar() {
	this.speed = {min: 0, current: 0.5, max: 1};
	this.scoreMax = 0;
	this.creditLine = "Lorem Ipsum, dolor sit amet";
	this.textStyle = new NStyle({color: '#4da612', opacity: 0.8});
	this.widgetStyle = new NStyle({color: '#4da612', lineColor: '#4da612', opacity: 0.6});
	
	this.speedBar = null;
	this.speedText = null;
	this.scoreBar = null;
	this.scoreText = null;
	this.creditText = null;
	
	this.statScene = null;
	this.creditScene = null;
	
	NCanvas.call(this, arguments[0]);
	this.reset = function() {
		if( this.scoreMax < 1 ) {
			this.scoreBar.visible = this.scoreText.visible = false;
			this.speedBar.x = this.speedText.x = 7;
		} else {
			this.scoreBar.visible = this.scoreText.visible = true;
			this.speedBar.x = this.speedText.x = 125;
		}
		this.speedBar.value = this.speedBar.animValue = 0;
		this.scoreBar.value = this.scoreBar.animValue = 0;
		return this;
	}
	this.init = function () {
		this.statScene = new NScene({name: 'mbStats', fps: 15});
		this.creditScene = new NScene({name: 'mbCredits', fps: 1});
		
		this.scoreBar = new NProgressBar({width: 101, height: 7, x: 7, y: 25, style: this.widgetStyle});
		this.scoreBar.addTo(this.statScene);
		this.scoreText = new NText({text: "% best score", width: 10, height: 10, x: 7, y: 10, style: this.widgetStyle});
		this.scoreText.addTo(this.statScene);
		
		this.speedBar = new NProgressBar({width: 100, height: 7, x: 125, y: 25, style: this.widgetStyle});
		this.speedBar.addTo(this.statScene);
		this.speedText = new NText({text: "speed", width: 10, height: 10, x: 125, y: 10, style: this.widgetStyle});
		this.speedText.addTo(this.statScene);
		
		this.creditText = new NText({text: this.creditLine, width: 10, height: 10, style: this.textStyle});
		this.creditText.set({y: 10, x: this.width - this.creditText.textWidth() });
		this.creditText.addTo(this.creditScene, this.statScene);
		this.play(this.creditScene);
		
		return this;
	}
	this.showStats = function() {
		return this.play(this.statScene);
	}
	this.showCredits = function() {
		return this.play(this.creditScene);
	}
	this.update = function (speed, score) {
		if( speed ) {
			this.speed.current = speed;
			this.speedBar.value = (this.speed.current - this.speed.min)/(this.speed.max - this.speed.min);
		}
		if( score ) {
			this.scoreBar.value = score/this.scoreMax ;	
		}
	}
}
NMinibar.prototype = new NCanvas(); 
NMinibar.prototype.constructor = NMinibar;

HTMLCanvasElement.prototype.getNMinibar = function() {
	var ctx = new NMinibar();
	ctx.node = this.getContext('2d');
	ctx.width = this.width;
	ctx.height = this.height;
	return ctx;
}


