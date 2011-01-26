
nTranslate3d = function (x, y, z, vz) {
	if( vz <= z ) {
		return {x: x, y: y, z: z};
	}
	var delta = vz/(vz-t.z)
	return {x: x*delta, y: y*delta, z: z};
}

/* N3Point*/
function N3Point () {
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
N3Point.prototype = new NObject(); 
N3Point.prototype.constructor = N3Point;


/* N3Polygon */
function N3Polygon () {
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
			p2[index] = new N3Point({x: this.x + this.points[index].x, y: this.y + this.points[index].y, z: this.z + this.points[index].z, style: this.points[index].style});
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
N3Polygon.prototype = new NObject(); 
N3Polygon.prototype.constructor = N3Point;

