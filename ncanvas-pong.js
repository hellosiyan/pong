/* NPongPickup */
function NPong() {
	this.enabled = true;
	this.canvas = null;
	this.score = 0;
	this.hits = 0;
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

/* NPongPickup */
function NPongPickup() {
	this.enabled = true;
	this.context = null;
	NRect.call(this, arguments[0]);
	this.activate = function() {
		this.enabled = false;
		this.onActivate();
	};
}
NPongPickup.prototype = new NRect(); 
NPongPickup.prototype.constructor = NPongPickup;

/* NPongPickup */
function NPongPickupScore() {
	NRect.call(this, arguments[0])
	this.draw = function(ctx) {
		ctx.fillStyle = this.style.color;
		ctx.globalAlpha = this.style.opacity;
		
		var blkw = this.width/4, blkh = this.height/7;
		
		for (var i = 1; i<= 5; i+=2) {
			ctx.fillRect(this.x + blkw, this.y + i*blkh, blkw*2, blkh);
		}
		
		ctx.fillRect(this.x + 2*blkw, this.y, blkw, blkh);
		ctx.fillRect(this.x + 1*blkw, this.y + 6*blkh, blkw, blkh);
		
		ctx.fillRect(this.x, this.y + 2*blkh, blkw, blkh);
		ctx.fillRect(this.x, this.y + 5*blkh, blkw, blkh);
		ctx.fillRect(this.x + 3*blkw, this.y + 1*blkh, blkw, blkh);
		ctx.fillRect(this.x + 3*blkw, this.y + 4*blkh, blkw, blkh);
		
		return this;
	}
	this.onActivate = function() {
		this.context.score += 4 + Math.ceil(Math.random()*11);
		this.context.triggerEvent(new NEvent({type: 'onScoreChange'}));
	};
}
NPongPickupScore.prototype = new NPongPickup(); 
NPongPickupScore.prototype.constructor = NPongPickupScore;


/* NPongPickupSpawner */
function NPongPickupSpawner() {
	var interval = null;
	this.speed = 1000;
	this.scene = null;
	this.context = null;
	this.hunter = null;
	this.arguments = {};
	this.types = ['Score'];
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
				if( _this.pickups[i].enabled && _this.pickups[i].intersects(_this.hunter) ) {
					_this.pickups[i].activate();
					this.removeChild(_this.pickups[i]);
				}
			}
		});
		
	}
	this.hunter = function(value) {
		if( !value ) {
			return this.hunter
		}
		this.hunter = value;
	}
	this.spawn = function() {
		var rand_type = Math.ceil(Math.random() * this.types.length-1);
		var pickup = new window['NPongPickup' + this.types[rand_type]](this.arguments);
		pickup.context = this.context;
		
		pickup.x = Math.ceil(Math.random() * this.context.canvas.width);
		pickup.y = Math.ceil(Math.random() * this.context.canvas.height);
		
		this.pickups.push(pickup);
		pickup.addTo(this.scene);
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
			this.scene.removeChild(this.pickups[i]);
		}
	}
}
NPongPickupSpawner.prototype = new NObject(); 
NPongPickupSpawner.prototype.constructor = NPongPickupSpawner;
