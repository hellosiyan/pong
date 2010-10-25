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

/* NDrawable */
function NDrawable() {
	this.x = 0;
	this.y = 0;
	this.width = 1;
	this.height = 1;
	this.opacity = 1;
	this.visible = true;
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
}
NDrawable.prototype = new NEventDispatcher(); 
NDrawable.prototype.constructor = NDrawable;



/* NBounce */
function NBounce (ndrawable) {
	ndrawable.addListener('onEnterFrame', function(e) {
		if ( this.x + this.width + this.accX > e.canvas.stage.width ) {
			this.x -= this.accX - (e.canvas.stage.width - this.x - this.width)
			this.accX *= -1
		} else if(this.x + this.accX < 0) {
			this.x -= this.x + this.accX;
			this.accX *= -1;
		} else {
			this.x += this.accX;
		}
		
		if ( this.y + this.width + this.accY > e.canvas.stage.height ) {
			this.y -= this.accY - (e.canvas.stage.height - this.y - this.height)
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
		ndrawable.opacity -= 0.1;
		if ( this.opacity < 0 ) {
			this.opacity = 1;
			this.visible = false;
			ndrawable.removeListener('onEnterFrame', fadeOut);
		}
	}
	ndrawable.addListener('onEnterFrame', fadeOut);
	return ndrawable;
}

/* NRect */
function NRect() {
	this.fillColor = '#fff';
	NDrawable.call(this, arguments[0])
	this.draw = function(ctx) {
		ctx.fillStyle = this.fillColor;
		ctx.globalAlpha = this.opacity;
		ctx.fillRect(this.x, this.y, this.width, this.height);
		return this;
	}
}
NRect.prototype = new NDrawable(); 
NRect.prototype.constructor = NRect;

/* NCircle */
function NCircle() {
	this.fillColor = '#fff';
	this.radius = 10;
	NDrawable.call(this, arguments[0])
	this.draw = function(ctx) {
		ctx.fillStyle = this.fillColor;
		ctx.globalAlpha = this.opacity;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, true);
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

/* NFrame */
function NFrame() {
	this.name = '0';
	NEventDispatcher.call(this, arguments[0]);
}
NFrame.prototype = new NEventDispatcher();
NFrame.prototype.constructor = NFrame;


/* NCanvas */
function NCanvas() {
	var interval = null;
	this.fps = 60;
	this.cb = function(){};
	this.frames = {};
	this.currentFrame = '0';
	this.stage = new NContainer();
	this.node = null;
	this.loop = function(fps, cb) {
		this.fps = fps;
		this.cb = cb;
		
		// Create frame if one doesn't already exist
		if( propertyCount(this.frames) == 0 ) {
			this.frames[this.currentFrame] = new NFrame({name: this.currentFrame});
		}
		
		var _this = this;
		
		interval = setInterval(function(){
			cb.call(_this);
			
			_this.frames[_this.currentFrame].triggerEvent(new NEvent({type: 'onEnterFrame', canvas: _this}));
			
			for( child_index in _this.stage.children ) {
				_this.stage.children[child_index].triggerEvent(new NEvent({type: 'onEnterFrame', canvas: _this}));
				if (_this.stage.children[child_index].visible) {
					_this.node.save();
					_this.stage.children[child_index].draw(_this.node);
					_this.node.restore();
				}
			}
		}, 1000/fps);
	};
	this.stop = function() {
		clearInterval(interval);
	};
	this.clear = function() {
		this.node.clearRect(0, 0, this.node.canvas.width, this.node.canvas.height);
	};
	this.goto = function(frame_name) {
		if( typeof(frame_name) == 'object') frame_name = frame_name.name;
	
		if( typeof(this.frames[frame_name]) == 'undefined' ) return false;
		
		this.currentFrame = frame_name;
		return true;
	};
	this.addFrame = function(frame) {
		if( typeof(this.frames[frame.name]) != 'undefined' ) return;
		this.frames[frame.name] = frame;
		
		if(propertyCount(this.frames) == 1) this.currentFrame = frame.name;
		
		return this;
	}
}

HTMLCanvasElement.prototype.getNCanvas = function() {
	var ctx = new NCanvas();
	ctx.node = this.getContext('2d');
	ctx.stage.width = this.width;
	ctx.stage.height = this.height;
	return ctx;
}
