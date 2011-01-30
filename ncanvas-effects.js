/* NBounce */

function NBounce (ndrawable) {
	ndrawable.addListener('onEnterFrame', function(e) {
		if ( this.x + this.width + this.accX > e.canvas.width ) {
			this.x -= this.accX - (e.canvas.width - this.x - this.width)
			this.accX *= -1
		} else if(this.x + this.accX < 0) {
			this.x -= this.x + this.accX;
			this.accX *= -1;
		} else {
			this.x += this.accX;
		}
		
		if ( this.y + this.width + this.accY > e.canvas.height ) {
			this.y -= this.accY - (e.canvas.height - this.y - this.height)
			this.accY *= -1
		} else if(this.y + this.accX < 0) {
			this.y -= this.y + this.accY;
			this.accY *= -1;
		} else {
			this.y += this.accY;
		}
	});
	return ndrawable;
}

/* NFadeOut */

function NFadeOut(ndrawable, speed) {
	function fadeOut(e) {
		ndrawable.style.opacity -= 0.1;
		if ( this.style.opacity < 0 ) {
			this.style.opacity = 1;
			this.visible = false;
			ndrawable.removeListener('onEnterFrame', fadeOut);
		}
	}
	ndrawable.addListener('onEnterFrame', fadeOut);
	return ndrawable;
}
