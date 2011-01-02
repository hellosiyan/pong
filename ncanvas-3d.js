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

/* NStyle */
function NStyle() {
	this.color = '#999'; // Polygons, Points
	this.lineColor = '#999'; // Polygons, Points
	this.fillType = 'stroke'; // Polygons, Points
	this.skeleton = false; // Polygons
	this.radius = 3; // Points
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
	this.z = 0;
	this.style = new NStyle();
	this.visible = true;
	NObject.call(this, arguments[0]);
	
	this.rotateX = function(theta, rc) {
		if( theta == 0 ) {
			return;
		}
		
		var d = {x: this.x - rc.x, y: this.y - rc.y, z: this.z - rc.z};
		var sint = Math.sin(theta);
		var cost = Math.cos(theta);
		this.x = rc.x + d.x; 
		this.y = rc.y + d.y*cost - d.z*sint; 
		this.z = rc.z + d.y*sint + d.z*cost;
	}
	
	this.rotateY = function(theta, rc) {
		if( theta == 0 ) {
			return;
		}
		
		var d = {x: this.x - rc.x, y: this.y - rc.y, z: this.z - rc.z};
		var sint = Math.sin(theta);
		var cost = Math.cos(theta);
		this.x = rc.x + d.x*cost + d.z*sint; 
		this.y = rc.y + d.y; 
		this.z = rc.z - d.x*sint + d.z*cost
	}
	
	this.rotateZ = function(theta, rc) {
		if( theta == 0 ) {
			return;
		}
		
		var d = {x: this.x - rc.x, y: this.y - rc.y, z: this.z - rc.z};
		var sint = Math.sin(theta);
		var cost = Math.cos(theta);
		this.x = rc.x + d.x*cost - d.y*sint
		this.y = rc.y + d.x*sint + d.y*cost;
		this.z = rc.z + d.z;
	}
	
	this.get2d = function (fc) {
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
		ctx.fillStyle = this.style.color;
		ctx.arc(t2d.x, t2d.y, this.style.radius, 0, Math.PI*2, true);
		ctx.closePath();
		ctx.fill();
	}
	this.lineTo = function(ctx, dest, fc) {
		var t2d = this.get2d(fc);
		var dest2d = dest.get2d(fc);
		if( !t2d || !dest2d ) {
			return;
		}
		
		ctx.beginPath();  
		ctx.strokeStyle = this.style.lineColor;
		ctx.lineWidth = (this.style.radius*2 + dest.style.radius*2)/2
		ctx.lineJoin = 'round'
		ctx.moveTo(t2d.x, t2d.y);  
		ctx.lineTo(dest2d.x, dest2d.y);
		ctx.closePath();
		ctx.fill();
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
	this._rotationZ = 0;
	
	this.style = new NStyle();
	this.uuid = 0;
	this.connections = [];
	
	this.points = [];
	this.visible = true;
	NObject.call(this, arguments[0]);
	
	this.setPoints = function (points) {
		this.points = points
		return this;
	}
	
	this.__defineGetter__('rotationX', function(  ) {
		return this._rotationX;
	});
	
	this.__defineSetter__('rotationX', function( value ) {
		while( value > Math.PI*2 ) {
			value -= Math.PI*2;
		}
		this._rotationX = Math.ceil(value*1000)/1000;
	});
	
	this.__defineGetter__('rotationY', function(  ) {
		return this._rotationY;
	});
	
	this.__defineSetter__('rotationY', function( value ) {
		while( value > Math.PI*2 ) {
			value -= Math.PI*2;
		}
		this._rotationY = Math.ceil(value*1000)/1000;
	});
	
	this.__defineGetter__('rotationZ', function(  ) {
		return this._rotationZ;
	});
	
	this.__defineSetter__('rotationZ', function( value ) {
		while( value > Math.PI*2 ) {
			value -= Math.PI*2;
		}
		this._rotationZ = Math.ceil(value*1000)/1000;
	});
	
	this.connectRange = function(style, first, last){
		var connection = {style: style, id: this.uuid++, nodes: []};
		for	( var i = first; i <= last; i++ ) {
			connection.nodes.push(i);
		}
		
		this.connections.push(connection);
	};
	this.connect = function(style){
		if( arguments.length < 3 ) {
			return
		}
		var connection = {style: style, id: this.uuid++, nodes: []};
		for	( var i = 1; i <= arguments.length-1; i++ ) {
			connection.nodes.push(arguments[i]);
		}
		
		this.connections.push(connection);
	};
	
	this.draw = function(ctx, camera) {
		var p2 = []; // 2d point projections
		for (index in this.points) {
			p2[index] = new NPoint({x: this.x + this.points[index].x, y: this.y + this.points[index].y, z: this.z + this.points[index].z, style: this.points[index].style});
			p2[index].rotateX(this._rotationX, this);
			p2[index].rotateY(this._rotationY, this);
			p2[index].rotateZ(this._rotationZ, this);
			p2[index] = p2[index].get2d(camera);
			p2[index].style = this.points[index].style;
			p2[index].z = this.z + this.points[index].z;
			
			if( this.style.skeleton ) {
				ctx.beginPath();
				ctx.fillStyle = p2[index].style.color;
				ctx.arc(p2[index].x, p2[index].y, p2[index].style.radius, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fill();
			}
		}
		
		
		var min = [];
		var max = [];
		this.connections.sort(function(a, b) {
			if( typeof min[a.id] == 'undefined' ) {
				min[a.id] = {x: p2[a.nodes[0]].x, y: p2[a.nodes[0]].y, z: p2[a.nodes[0]].z}
				max[a.id] = {x: p2[a.nodes[0]].x, y: p2[a.nodes[0]].y, z: p2[a.nodes[0]].z}
				for (index in a.nodes) {
					min[a.id] = {
						x: Math.min(min[a.id].x, p2[a.nodes[index]].x), 
						y: Math.min(min[a.id].y, p2[a.nodes[index]].y), 
						z: Math.min(min[a.id].z, p2[a.nodes[index]].z), 
					};
					max[a.id] = {
						x: Math.max(max[a.id].x, p2[a.nodes[index]].x), 
						y: Math.max(max[a.id].y, p2[a.nodes[index]].y), 
						z: Math.max(max[a.id].z, p2[a.nodes[index]].z),  
					};
				}
			}
			if( typeof min[b.id] == 'undefined' ) {
				min[b.id] = {x: p2[b.nodes[0]].x, y: p2[b.nodes[0]].y, z: p2[b.nodes[0]].z}
				max[b.id] = {x: p2[b.nodes[0]].x, y: p2[b.nodes[0]].y, z: p2[b.nodes[0]].z}
				for (index in b.nodes) {
					min[b.id] = {
						x: Math.min(min[b.id].x, p2[b.nodes[index]].x), 
						y: Math.min(min[b.id].y, p2[b.nodes[index]].y), 
						z: Math.min(min[b.id].z, p2[b.nodes[index]].z), 
					};
					max[b.id] = {
						x: Math.max(max[b.id].x, p2[b.nodes[index]].x), 
						y: Math.max(max[b.id].y, p2[b.nodes[index]].y), 
						z: Math.max(max[b.id].z, p2[b.nodes[index]].z), 
					};
				}
			}
			
			if ( min[a.id].z > max[b.id].z ) {
				return 1;
			} else if ( max[a.id].z < min[b.id].z ) {
				return -1
			}
			
			/*
			// Test 1 - x axis collision
			if( min[a.id].x < max[b.id].x && max[a.id].x > min[b.id].x ) {
				// Test 2 - y axis collision
				if( min[a.id].y < max[b.id].y && max[a.id].y > min[b.id].y ) {
					// here be dragons
				}
			}
			*/
			
			return 0;
		});
		delete min;
		delete max;
		
		for (index in this.connections) {
			ctx.fillStyle = this.connections[index].style.color;
			ctx.strokeStyle = this.connections[index].style.lineColor;
			ctx.beginPath();
			ctx.moveTo(p2[this.connections[index].nodes[0]].x, p2[this.connections[index].nodes[0]].y);
			for (var i = 0; i < this.connections[index].nodes.length-1; i++) {
				var t = p2[this.connections[index].nodes[i+1]];
				if( !t ) {
					continue;
				}
		 
				ctx.lineTo(t.x, t.y);
			}
			
			ctx.closePath();
			if( this.style.skeleton ) {
				ctx.stroke()
			} else {
				ctx[this.connections[index].style.fillType].call(ctx)			
			}
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