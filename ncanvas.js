propertyCount = function(object) {
	var count = 0;
	
	for (var key in object) {
		if (object.hasOwnProperty(key)) {
			count ++;
		}
	}
	return count;
}

nTranslate3d = function (x, y, z, vz) {
	if( vz <= z ) {
		return {x: x, y: y, z: z};
	}
	var delta = vz/(vz-t.z)
	return {x: x*delta, y: y*delta, z: z};
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

/* NPoint*/
function NPoint () {
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.color = '#ffffff'
	this.lineColor = '#ffffff'
	this.radius = 4
	this.visible = true;
	NObject.call(this, arguments[0]);
	
	this.rotateX = function(theta, rc) {
		var d = {x: this.x - rc.x, y: this.y - rc.y, z: this.z - rc.z};
		var sint = Math.sin(theta);
		var cost = Math.cos(theta);
		this.x = rc.x + d.x; 
		this.y = rc.y + d.y*cost - d.z*sint; 
		this.z = rc.z + d.y*sint + d.z*cost;
	}
	
	this.rotateY = function(theta, rc) {
		var d = {x: this.x - rc.x, y: this.y - rc.y, z: this.z - rc.z};
		var sint = Math.sin(theta);
		var cost = Math.cos(theta);
		this.x = rc.x + d.x*cost + d.z*sint; 
		this.y = rc.y + d.y; 
		this.z = rc.z + d.x*sint + d.z*cost
	}
	
	this.rotateZ = function(theta, rc) {
		var d = {x: this.x - rc.x, y: this.y - rc.y, z: this.z - rc.z};
		var sint = Math.sin(theta);
		var cost = Math.cos(theta);
		this.x = rc.x + d.x*cost - d.y*sint
		this.y = rc.y + d.x*sint + d.y*cost;
		this.z = rc.z + d.z;
	}
	
	this.get2d = function (fc) {
//		return this;
		var delta = fc.z/(fc.z-this.z);
		if( fc.z < this.z ) {
			return false;
		}
		return {x: fc.x - (fc.x - this.x)*delta, y: fc.y - (fc.y - this.y)*delta, radius: this.radius*delta};
	}
	this.draw = function(ctx, fc) {
		var t2d = this.get2d(fc);
		if( !t2d ) {
			return;
		}
		
		ctx.beginPath();
		ctx.fillStyle = this.color;
		ctx.arc(t2d.x, t2d.y, t2d.radius, 0, Math.PI*2, true);
		ctx.closePath();
		ctx.fill();
	}
	this.lineTo = function(ctx, dest) {
		var t2d = this.get2d(this.center);
		var dest2d = dest.get2d(dest.center);
		if( !t2d || !dest2d ) {
			return;
		}
		
		ctx.beginPath();  
		ctx.strokeStyle = this.lineColor;
		ctx.lineWidth = (t2d.radius*2 + dest2d.radius*2)/2
		ctx.lineJoin = 'round'
		ctx.moveTo(t2d.x, t2d.y);  
		ctx.lineTo(dest2d.x, dest2d.y);
		ctx.closePath();
		ctx.stroke();
	}
}
NPoint.prototype = new NObject(); 
NPoint.prototype.constructor = NPoint;


/* NPolygon */
function NPolygon () {
	this.x = 0;
	this.y = 0;
	this.z = 0;
	
	this._rotationX = 0;
	this._rotationY = 0;
	this._rotationz = 0;
	
	this.points = [];
	this.visible = true;
	NObject.call(this, arguments[0]);
	
	this.setPoints = function (points) {
		this.points = points
		return this;
		/*
		for (index in points) {
			this.points[index] = new NPoint({x: this.x + points[index].x, y: this.y + points[index].y, z: this.z + points[index].z});
		}*/
	}
	
	this.rotateY = function(theta) {
		for (index in this.points) {
			this.points[index].rotateY(theta);
		}
	}
	
	this.__defineGetter__('rotationY', function(  ) {
		return this._rotationY;
	});
	
	this.__defineSetter__('rotationY', function( value ) {
		while( value > Math.PI*2 ) {
			value -= Math.PI*2;
		}
		this._rotationY = Math.ceil(value*1000)/1000;
	});
	
	
	this.draw = function(ctx, camera) {
		for (index in this.points) {
			var a = new NPoint({x: this.x + this.points[index].x, y: this.y + this.points[index].y, z: this.z + this.points[index].z});
			a.rotateY(this.rotationY,this);
			a.draw(ctx, camera);
			//this.points[index].draw(ctx, camera);
		}
	}
}
NPolygon.prototype = new NObject(); 
NPolygon.prototype.constructor = NPoint;

/* NDrawable */
function NDrawable() {
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.width = 1;
	this.height = 1;
	this.center = new NPoint();
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
		var t = {x: this.center.x - this.x, y: this.center.y - this.y, z: this.z, w: this.width, h: this.height};
		var vz = 50; // http://en.wikipedia.org/wiki/3D_projection BZ
		if( t.z >= vz ) {
			return this;
		}
		var dz = vz/(vz-t.z)
		console.log(dz);
		t.x *= dz;
		t.y *= dz;
		t.w *= dz;
		t.h *= dz;
		console.log(t.x);
		console.log('----');
		ctx.fillStyle = this.fillColor;
		ctx.globalAlpha = this.opacity;
		ctx.fillRect(this.center.x - t.x, this.center.y - t.y, t.w, t.h);
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

/* NScene */
function NScene() {
	this.name = 'scene0';
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
		this.fps = fps ? fps : this.fps;
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
