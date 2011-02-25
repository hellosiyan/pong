/* NPong */

function NPong() {
	this.enabled = true;
	this.canvas = null;
	this.score = 0;
	this.hits = 0;
	
	this.padLeft = null;
	this.padRight = null;
	this.ball = null;
	
	this.gameScene = null;
	this.loseScene = null;
	this.startScene = null;
	
	NEventDispatcher.call(this, arguments[0]);
	this.reset = function() {
		this.score = this.hits = 0;
	}
	this.scoreHit = function (accuracy) {
		this.score += Math.ceil( this.hits * ((Math.PI/4 - Math.abs(accuracy))/(Math.PI/4)));
		this.triggerEvent(new NEvent({type: 'onScoreChange'}));
		return this.score;
	}
}
NPong.prototype = new NEventDispatcher(); 
NPong.prototype.constructor = NPong;


function NPongPad() {
	this.type = NPongPad.LEFT;
	
	NRect .call(this, arguments[0]);
	this.draw = function(ctx) {
		ctx.fillStyle = this.style.color;
		ctx.globalAlpha = this.style.opacity;
		
		if( this.type == NPongPad.LEFT ) {
			ctx.fillRect(this.x + 10, this.y, this.width - 10, this.height);
			ctx.globalAlpha = this.style.opacity/1.5;
			ctx.fillRect(this.x+9, this.y, 1, this.height);
			ctx.globalAlpha = this.style.opacity/3;
			ctx.fillRect(this.x+8, this.y, 1, this.height);
		} else {
			ctx.fillRect(this.x, this.y, this.width - 10, this.height);
			ctx.globalAlpha = this.style.opacity/1.5;
			ctx.fillRect(this.x + this.width - 10, this.y, 1, this.height);
			ctx.globalAlpha = this.style.opacity/3;
			ctx.fillRect(this.x + this.width - 9, this.y, 1, this.height);
		}
		
		return this;
	}
}
NPongPad.prototype = new NRect(); 
NPongPad.prototype.constructor = NPongPad;
NPongPad.RIGHT = 0;
NPongPad.LEFT = 1;

/* NPongPickup */

function NPongPickup() {
	this.enabled = false;
	this.context = null;
	this.lifetime = 1000;
	NRect.call(this, arguments[0]);
	this.draw = function(ctx) {
		ctx.fillStyle = this.style.color;
		ctx.strokeStyle = this.style.lineColor;
		ctx.lineWidth = this.style.lineWidth;
		ctx.globalAlpha = this.style.opacity;
		
		// Custom pickup-specific drawings here
		
		this.drawIcon(ctx);
	}
	this.disable = function() {
		var _this = this;
		_this.enabled = false;
		
		NFadeOut(this, 0.05, function( pickup ) {
			_this.context.gameScene.removeChild(this);
			delete this;
		});
	};
	this.activate = function() {
		this.disable();
		this.onActivate();
	};
	this.autoExpire = function() {
		var _this = this;
		setTimeout(function() {
			_this.disable();
		}, _this.lifetime);
	};
}
NPongPickup.prototype = new NRect(); 
NPongPickup.prototype.constructor = NPongPickup;

/* NPongPickupScore */

function NPongPickupScore() {
	NPongPickup.call(this, arguments[0])
	this.drawIcon = function(ctx) {
		var blkw = this.width/7, blkh = this.height/7;
		
		for (var i = 1; i<= 5; i+=2) {
			ctx.fillRect(this.x + blkw, this.y + i*blkh, blkw*3, blkh);
		}
		
		ctx.fillRect(this.x + 3*blkw, this.y, blkw, blkh);
		ctx.fillRect(this.x + 2*blkw, this.y + 6*blkh, blkw, blkh);
		
		ctx.fillRect(this.x, this.y + 2*blkh, blkw, blkh);
		ctx.fillRect(this.x, this.y + 5*blkh, blkw, blkh);
		ctx.fillRect(this.x + 4*blkw, this.y + 1*blkh, blkw, blkh);
		ctx.fillRect(this.x + 4*blkw, this.y + 4*blkh, blkw, blkh);
		
		return this;
	}
	this.onActivate = function() {
		this.context.score += 39 + Math.ceil(Math.random()*11);
		this.context.triggerEvent(new NEvent({type: 'onScoreChange'}));
	};
}
NPongPickupScore.prototype = new NPongPickup(); 
NPongPickupScore.prototype.constructor = NPongPickupScore;

/* NPongPickupWide */

function NPongPickupWide() {
	NPongPickup.call(this, arguments[0])
	this.drawIcon = function(ctx) {
		var blkw = this.width/7, blkh = this.height/7;
		
		for (var i = 1; i< 6; i++) {
			ctx.fillRect(this.x + i*blkw, this.y + (6-i)*blkh, blkw, blkh);
		}
		ctx.fillRect(this.x + 3*blkw, this.y, blkw*4, blkh);
		ctx.fillRect(this.x, this.y + 6*blkh, blkw*4, blkh);
		ctx.fillRect(this.x + 6*blkw, this.y + blkh, blkw, blkh*3);
		ctx.fillRect(this.x, this.y + 3*blkh, blkw, blkh*3);
		
		return this;
	}
	this.onActivate = function() {
		this.context.padLeft.height = Math.min(this.context.padLeft.height + 6, this.context.canvas.height*0.4);
		this.context.padLeft.y = Math.max(Math.min(this.context.padLeft.y - 3, this.context.canvas.height - this.context.padLeft.height), 0);
		
		this.context.padRight.set({height: this.context.padLeft.height, y: this.context.padLeft.y});
	};
}
NPongPickupWide.prototype = new NPongPickup(); 
NPongPickupWide.prototype.constructor = NPongPickupWide;

/* NPongPickupNarrow */

function NPongPickupNarrow() {
	NPongPickup.call(this, arguments[0])
	this.drawIcon = function(ctx) {
		var blkw = this.width/7, blkh = this.height/7;
		
		for (var i = 0; i< 7; i++) {
			ctx.fillRect(this.x + i*blkw, this.y + (6-i)*blkh, blkw, blkh);
		}
		ctx.fillRect(this.x + 5*blkw, this.y + 2*blkh, blkw*2, blkh);
		ctx.fillRect(this.x + 4*blkw, this.y, blkw, blkh*2);
		ctx.fillRect(this.x, this.y + 4*blkh, blkw*2, blkh);
		ctx.fillRect(this.x+ 2*blkw, this.y + 5*blkh, blkw, blkh*2);
		
		return this;
	}
	this.onActivate = function() {
		this.context.padLeft.height = Math.max(this.context.padLeft.height - 6, this.context.ball.height*4);
		this.context.padLeft.y = Math.max(Math.min(this.context.padLeft.y + 3, this.context.canvas.height - this.context.padLeft.height), 0);
		
		this.context.padRight.set({height: this.context.padLeft.height, y: this.context.padLeft.y});
	};
}
NPongPickupNarrow.prototype = new NPongPickup(); 
NPongPickupNarrow.prototype.constructor = NPongPickupNarrow;


/* NPongPickupSpawner */

function NPongPickupSpawner() {
	var interval = null;
	this.speed = 10000;
	this.scene = null;
	this.context = null;
	this.area = new NRect();
	this.arguments = {};
	this.types = 'Wide Narrow Score'.split(' ');
	this.pickups = [];
	NObject.call(this, arguments[0]);
	
	this.addTo = function(scene) {
		this.scene = scene;
		var _this = this;
		
		this.scene.addListener('onSceneStart', function() {
			_this.start();
		});
		
		this.scene.addListener('onSceneStop', function() {
			_this.stop();
		});
		
		this.scene.addListener('onEnterFrame', function() {
			for(var i = 0; i < _this.pickups.length; i++ ) {
				if( _this.pickups[i] && _this.pickups[i].enabled && _this.pickups[i].intersects(_this.context.ball) ) {
					_this.pickups[i].activate();
				}
			}
		});
		
	}
	
	this.spawn = function() {
		var rand_type = Math.ceil(Math.random() * this.types.length-1);
		var pickup = new window['NPongPickup' + this.types[rand_type]](this.arguments);
		pickup.set({context: this.context, style: new NStyle(this.arguments.style)});
		pickup.style.opacity = 0;
		
		pickup.x = Math.ceil(Math.random() * (this.area.width - pickup.width) + this.area.x);
		pickup.y = Math.ceil(Math.random() * (this.area.height - pickup.height) + this.area.y);
		NFadeIn(pickup, 0.05, function() {
			this.enabled = true
		});
		
		this.pickups.push(pickup);
		pickup.addTo(this.scene);
		pickup.autoExpire()
	}
	
	this.start = function() {
		var _this = this;
		
		if( interval ) {
			this.stop();
		}
		
		interval = setInterval(function() {
			_this.spawn();
		}, this.speed);
	}
	
	this.stop = function() {
		clearInterval(interval);
		interval = null;
		
		for (var i = 0; i < this.pickups.length; i ++ ) {
			if( this.pickups[i] ) {
				this.scene.removeChild(this.pickups[i]);
			}
		}
	}
	
	this.disableAll = function() {
		for(var i = 0; i < this.pickups.length; i++ ) {
			if( this.pickups[i] ) {
				this.pickups[i].disable();
			}
		}
		
		return this;
	}
	
	this.clear = function() {
		for(var i = 0; i < this.pickups.length; i++ ) {
			if( this.pickups[i] ) {
				delete this.pickups[i];
			}
		}
		delete this.pickups;
		this.pickups = [];
	}
}
NPongPickupSpawner.prototype = new NObject(); 
NPongPickupSpawner.prototype.constructor = NPongPickupSpawner;
