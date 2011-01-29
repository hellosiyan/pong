propertyCount = function(object) {
	var count = 0;
	
	for (var key in object) {
		if (object.hasOwnProperty(key)) {
			count ++;
		}
	}
	return count;
}

/* NObject */
function NObject() {
	this.set = function(data) {
		for( ind in data ) {
			this[ind] = data[ind];
		}
		return this;
	}
	if( typeof arguments[0] == 'object') {
		this.set(arguments[0]);
	}	
}

/* NStyle */
function NStyle() {
	this.color = '#999'; // Polygons, Points
	this.lineColor = '#999'; // Polygons, Points
	this.fillType = 'stroke'; // Polygons, Points
	this.skeleton = false; // Polygons
	this.radius = 3; // Points
	this.opacity = 1; // Polygons, Points
	NObject.call(this, arguments[0]);
}
NStyle.prototype = new NObject();
NStyle.prototype.constructor = NStyle;

/* NEvent */
function NEvent() {
	this.canvas = null;
	this.type = 'generic';
	NObject.call(this, arguments[0]);
}
NEvent.prototype = new NObject();
NEvent.prototype.constructor = NEvent;

/* NEventDispatcher */
function NEventDispatcher() {
	this.events = [];
	NObject.call(this, arguments[0])
	this.addListener = function(event, cb) {
		if( typeof(this.events[event]) == 'undefined' ) {
			this.events[event] = [];
		}
		this.events[event].push(cb);
	}
	this.removeListener = function(event, cb) {
		if( typeof(this.events[event]) == 'underfined' ) {
			return false;
		}
		var ind = this.events[event].indexOf(cb);
		if (ind < 0) return false;
		this.events[event].splice(ind, 1);
		return true;
	}
	this.triggerEvent = function(event) {
		if( typeof(this.events[event.type]) == 'undefined' ) {
			return;
		}
		for( event_index in this.events[event.type] ) {
			this.events[event.type][event_index].call(this, event);
		}
		
	}
}
NEventDispatcher.prototype = new NObject();
NEventDispatcher.prototype.constructor = NEventDispatcher;

/* NPoint*/
function NPoint () {
	this.x = 0;
	this.y = 0;
	this.style = new NStyle();
	this.visible = true;
	NObject.call(this, arguments[0]);
	
	this.draw = function(ctx, fc) {
		ctx.beginPath();
		ctx.fillStyle = this.style.color;
		ctx.arc(this.x, this.y, this.style.radius, 0, Math.PI*2, true);
		ctx.closePath();
		ctx.fill();
	}
}
NPoint.prototype = new NObject(); 
NPoint.prototype.constructor = NPoint;


/* NDrawable */
function NDrawable() {
	this.x = 0;
	this.y = 0;
	this.width = 1;
	this.height = 1;
	this.visible = true;
	this.style = new NStyle();
	NEventDispatcher.call(this, arguments[0])
	this.draw = function(){};
	this.containsPoint = function(point) {
		if(point.x < this.x && point || point.y < this.y ) {
			return false;
		} else {
			return point.x <= this.x+this.height  && this.y <= this.y+this.height;
		}
	}
	this.intersects = function(target) {
		var minY = Math.min(this.y, this.y + this.height, target.y, target.y + target.height);
		var maxY = Math.max(this.y, this.y + this.height, target.y, target.y + target.height);
		
		// Check Y
		if ( this.height + target.height >= Math.abs(maxY - minY)) {
			// Check X
			var minX = Math.min(this.x, this.x + this.width, target.x, target.x + target.width);
			var maxX = Math.max(this.x, this.x + this.width, target.x, target.x + target.width);
			if( this.width + target.width >= Math.abs(maxX-minX) ) {
				return true;
			}
		}
		
		return false;
	}
	this.addTo = function() {
		for (i = arguments.length -1; i >= 0; i--) {
			if (NScene.prototype.isPrototypeOf(arguments[i])) {
				arguments[i].addChild(this);
			}
		}
	}
}
NDrawable.prototype = new NEventDispatcher(); 
NDrawable.prototype.constructor = NDrawable;



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

/* NRect */
function NRect() {
	NDrawable.call(this, arguments[0])
	this.draw = function(ctx) {
		ctx.fillStyle = this.style.color;
		ctx.globalAlpha = this.style.opacity;
		ctx.fillRect(this.x, this.y, this.width, this.height);
		return this;
	}
}
NRect.prototype = new NDrawable(); 
NRect.prototype.constructor = NRect;

/* NCircle */
function NCircle() {
	NDrawable.call(this, arguments[0])
	this.draw = function(ctx) {
		ctx.fillStyle = this.style.color;
		ctx.globalAlpha = this.style.opacity;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.style.radius, 0, Math.PI*2, true);
		ctx.closePath();
		ctx.fill();
		return this;
	}
}
NCircle.prototype = new NDrawable(); 
NCircle.prototype.constructor = NCircle;

/* NContainer */
function NContainer() {
	this.children = [];
	NEventDispatcher.call(this, arguments[0]);
	this.addChild = function(child) {
		if(this.children.indexOf(child) >= 0) return;
		this.children.push(child);
	}
	this.removeChild = function(child) {
		var ind = this.children.indexOf(child);
		if (ind < 0) return false;
		this.children.splice(ind, 1);
		return true;
	}
}
NContainer.prototype = new NRect();
NContainer.prototype.constructor = NContainer;

/* NScene */
function NScene() {
	this.name = 'scene0';
	this.fps = 20;
	NContainer.call(this, arguments[0]);
}
NScene.prototype = new NContainer();
NScene.prototype.constructor = NScene;


/* NCanvas */
function NCanvas() {
	var interval = null;
	this.fps = 60;
	this.width = 1;
	this.height = 1;
	this.autoClear = true;
	this.scene = null;
	this.node = null;
	NObject.call(this, arguments[0])
	this.iter = function() {
		if( this.autoClear ) this.clear();
		
		this.scene.triggerEvent(new NEvent({type: 'onEnterFrame', canvas: this}));
		
		for( index in this.scene.children ) {
			this.scene.children[index].triggerEvent(new NEvent({type: 'onEnterFrame', canvas: this}));
			if (this.scene.children[index].visible) {
				this.node.save();
				this.scene.children[index].draw(this.node);
				this.node.restore();
			}
		}
		
	}
	this.play = function(scene, fps) {
		this.scene = scene ? scene : this.scene;
		this.fps = fps ? fps : scene.fps;
		if ( interval != null) {
			this.stop();
		}
		
		var _this = this;
		
		interval = setInterval(function(){
			_this.iter();
		}, 1000/this.fps);
		this.iter();
	};
	this.stop = function() {
		clearInterval(interval);
		return this;
	};
}
NCanvas.prototype = new NObject();
NCanvas.prototype.constructor = NCanvas;
	NCanvas.prototype.clear = function() {
		this.node.clearRect(0, 0, this.node.canvas.width, this.node.canvas.height);
	};

HTMLCanvasElement.prototype.getNCanvas = function() {
	var ctx = new NCanvas();
	ctx.node = this.getContext('2d');
	ctx.width = this.width;
	ctx.height = this.height;
	return ctx;
}
