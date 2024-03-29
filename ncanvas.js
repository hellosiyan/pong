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
	this.lineWidth = 1; // Polygons, Points
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
	
	this.preventDefault = function() {
		this.isDefaultPrevented = _true;
	},
	this.stopPropagation = function() {
		this.isPropagationStopped = _true;
	},
	this.isDefaultPrevented = _false,
	this.isPropagationStopped = _false
}
NEvent.prototype = new NObject();
NEvent.prototype.constructor = NEvent;

function _true() {
	return true;
};

function _false() {
	return false;
};

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
	this.is_playing = false;
	NObject.call(this, arguments[0])
	this.iter = function() {
		if( this.autoClear ) this.clear();
		
		var enterFrameEvent = new NEvent({type: 'onEnterFrame', canvas: this});
		this.scene.triggerEvent(enterFrameEvent);
		
		if( enterFrameEvent.isDefaultPrevented() ) {
			return;
		}
		
		for( index in this.scene.children ) {
			this.scene.children[index].triggerEvent(new NEvent({type: 'onEnterFrame', canvas: this}));
			if (this.scene.children[index] && this.scene.children[index].visible) {
				this.node.save();
				this.scene.children[index].draw(this.node);
				this.node.restore();
			}
		}
		
	}
	this.play = function(scene, fps) {
		if ( interval != null) {
			this.stop();
		}
		
		this.scene = scene ? scene : this.scene;
		this.fps = fps ? fps : this.scene.fps;
		
		this.is_playing = true;
		var sceneStartEvent = new NEvent({type: 'onSceneStart', canvas: this});
		this.scene.triggerEvent(sceneStartEvent);
		
		if( sceneStartEvent.isDefaultPrevented() ) {
			this.is_playing = false;
			return;
		}
		
		var _this = this;
		
		interval = setInterval(function(){
			_this.iter();
		}, 1000/this.fps);
		this.iter();
	};
	this.stop = function() {
		this.is_playing = false;
		var sceneStopEvent = new NEvent({type: 'onSceneStop', canvas: this});
		this.scene.triggerEvent(sceneStopEvent);
		
		if( sceneStopEvent.isDefaultPrevented() ) {
			this.is_playing = true;
			return this;
		}
		
		clearInterval(interval);
		return this;
	};
	this.clear = function() {
		this.node.clearRect(0, 0, this.node.canvas.width, this.node.canvas.height);
	};
}
NCanvas.prototype = new NObject();
NCanvas.prototype.constructor = NCanvas;

HTMLCanvasElement.prototype.getNCanvas = function() {
	var ctx = new NCanvas();
	ctx.node = this.getContext('2d');
	ctx.width = this.width;
	ctx.height = this.height;
	return ctx;
}


NCanvas.cookie=function(name,value,options){if(typeof value!='undefined'){options=options||{};if(value===null){value='';options.expires=-1;}
var expires='';if(options.expires&&(typeof options.expires=='number'||options.expires.toUTCString)){var date;if(typeof options.expires=='number'){date=new Date();date.setTime(date.getTime()+(options.expires*24*60*60*1000));}else{date=options.expires;}
expires='; expires='+date.toUTCString();}
var path=options.path?'; path='+(options.path):'';var domain=options.domain?'; domain='+(options.domain):'';var secure=options.secure?'; secure':'';document.cookie=[name,'=',encodeURIComponent(value),expires,path,domain,secure].join('');}else{var cookieValue=null;if(document.cookie&&document.cookie!=''){var cookies=document.cookie.split(';');for(var i=0;i<cookies.length;i++){var cookie=cookies[i].trim();if(cookie.substring(0,name.length+1)==(name+'=')){cookieValue=decodeURIComponent(cookie.substring(name.length+1));break;}}}
return cookieValue;}};
