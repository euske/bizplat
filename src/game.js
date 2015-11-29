// game.js

MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

// BarBox
function BarBox(bounds)
{
  this._Sprite(bounds);
  this.value = 0;
}

define(BarBox, Sprite, 'Sprite', {
  render: function (ctx, bx, by) {
    ctx.fillStyle = 'green';
    ctx.fillRect(bx+this.bounds.x, by+this.bounds.y,
		 Math.floor(this.value*this.bounds.width),
		 this.bounds.height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'white';
    ctx.strokeRect(bx+this.bounds.x+.5, by+this.bounds.y+.5,
		   this.bounds.width, this.bounds.height);
  },
});

// ChatBox
function ChatBox(frame, font)
{
  this._TextBoxTT(frame, font);
  this.linespace = 3;
  this.padding = 8;
  this.background = 'black';
}

define(ChatBox, TextBoxTT, 'TextBoxTT', {
  render: function (ctx, bx, by) {
    this._TextBoxTT_render(ctx, bx, by);
    if (this.bounds !== null) {
      bx += this.bounds.x;
      by += this.bounds.y;
    }
    var rect = this.frame.inflate(5, 5);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    ctx.strokeRect(bx+rect.x, by+rect.y, rect.width, rect.height);
  },
  
});

// Employee
function Employee(bounds, hitbox, tileno)
{
  this._Actor(bounds, hitbox, tileno);
}
define(Employee, Actor, 'Actor', {
});

// Worker
function Worker(bounds)
{
  this._Employee(bounds, bounds, 2);
  this.zorder = -1;
  this.rank = 0;
  this.wage = 0;
}

define(Worker, Employee, 'Employee', {
  upgrade: function () {
    this.rank++;
    this.wage = (this.rank-1)*50+100;
    this.tileno = (this.rank < 2)? 2 : 3;
  }
});

// Assistant
function Assistant(bounds)
{
  this._Employee(bounds, bounds, 4);
  this.zorder = 0;
}

define(Assistant, Employee, 'Employee', {
});

// Researcher
function Researcher(bounds)
{
  this._Employee(bounds, bounds, 5);
  this.zorder = 0;
}

define(Researcher, Employee, 'Employee', {
});

// Kitty
function Kitty(bounds)
{
  this._Employee(bounds, bounds, 8);
  this.zorder = 0;
  this.qindex = 0;
}

define(Kitty, Employee, 'Employee', {
  quote: function () {
    this.qindex++;
    switch (this.qindex % 3) {
    case 1:
    case 2:
      return '"Nyaa."';
    default:
      return '"What? I\'m busy now.\n Don\'t talk to me."';
    }
  }
});

// Machine
function Machine(bounds)
{
  this._Sprite(bounds);
  this.zorder = 1;
  this.size = 6;
}
define(Machine, Sprite, 'Sprite', {
  render: function (ctx, bx, by) {
    var x = bx+this.bounds.x;
    var y = by+this.bounds.y;
    var w = this.bounds.width;
    var h = this.bounds.height;
    var sprites = this.scene.app.sprites;
    var tw = sprites.height;
    var th = sprites.height;
    for (var i = 0; i < this.size; i++) {
      var tileno = (i == 0)? 7 : 6;
      ctx.drawImage(sprites,
		    tileno*tw, th-h, w, h,
		    x, y, w, h);
      x += w;
    }
  },
});

// Spawner
function Spawner(bounds)
{
  this._Sprite(bounds);
  this.visible = false;
}

define(Spawner, Sprite, 'Sprite', {
});


// Movable
function isObstacle(c) {
  return (c < 0 || c == 2);
}
function Movable(bounds, hitbox, tileno)
{
  this._Actor(bounds, hitbox, tileno);
  this.zorder = 2;
  this.gravity = 2;
  this.maxspeed = 8;
  this.velocity = new Vec2(0, 0);
  this._landed = false;
}

define(Movable, Actor, 'Actor', {
  update: function () {
    this.velocity.y += this.gravity;
    this.velocity.y = clamp(-this.maxspeed, this.velocity.y, this.maxspeed);
    var v = this.getMove(this.velocity);
    this._landed = (0 < this.velocity.y && v.y === 0);
    this.velocity = v;
    this.move(this.velocity.x, this.velocity.y);
  },

  getMove: function (v) {
    var rect = this.hitbox;
    var tilemap = this.scene.tilemap;
    var d0 = tilemap.contactTile(rect, isObstacle, v);
    rect = rect.move(d0.x, d0.y);
    v = v.sub(d0);
    var d1 = tilemap.contactTile(rect, isObstacle, new Vec2(v.x, 0));
    rect = rect.move(d1.x, d1.y);
    v = v.sub(d1);
    var d2 = tilemap.contactTile(rect, isObstacle, new Vec2(0, v.y));
    return new Vec2(d0.x+d1.x+d2.x,
		    d0.y+d1.y+d2.y);
  },
  
});

// Fire
function Fire(bounds)
{
  this._Movable(bounds, bounds.inflate(-2,0), 10);
}

define(Fire, Movable, 'Movable', {
});

// Player
function Player(bounds)
{
  this._Movable(bounds, bounds.inflate(-3,0), 1);
  this.health = 5;
  this.speed = 4;
  this.jumpacc = -6;
  this.maxacctime = 8;
  this._jumpt = -1;
}

define(Player, Movable, 'Movable', {
  usermove: function (v) {
    this.velocity.x = v.x*this.speed;
  },
  
  jump: function (jumping) {
    if (jumping) {
      if (this._landed) {
	this._jumpt = 0;
	this.velocity.y = this.jumpacc;
	playSound(this.scene.app.audios.jump);
      }
    } else {
      this._jumpt = -1;
    }
  },

  update: function () {
    if (0 <= this._jumpt && this._jumpt < this.maxacctime) {
      this._jumpt++;
      this.velocity.y -= this.gravity;
    }
    this._Movable_update();
  },

});


//  Game
// 
function Game(app)
{
  this._GameScene(app);
  this.tileSize = 16;
  this.statusSize = 80;
  this.chatSize = 64;
}

define(Game, GameScene, 'GameScene', {
  init: function () {
    this._GameScene_init();

    var scene = this;
    var app = this.app;
    var map = copyArray([
      [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
      [0,1,0,0,0, 1,0,0,20,1, 0,0,0,1,0],
      [0,0,5,0,0, 0,0,2,2,0, 0,0,7,13,0],
      [0,0,3,0,0, 0,0,0,0,0, 0,2,2,2,2],
      
      [2,2,2,2,0, 0,0,6,4,4, 4,4,4,4,4],
      [0,0,3,0,0, 0,2,2,0,0, 0,0,0,0,0],
      [0,1,3,0,0, 1,0,0,0,1, 0,0,0,1,0],
      [0,0,3,0,0, 0,0,0,2,2, 0,0,0,12,0],
      [15,11,3,11,0, 11,0,0,0,0, 0,0,2,2,2],
      
      [2,2,2,2,2, 2,2,0,0,0, 0,0,0,0,0],
      [0,0,3,0,0, 0,0,0,0,0, 0,0,8,8,0],
      [0,1,3,0,0, 1,0,0,0,1, 2,2,2,2,2],
      [0,0,3,0,0, 0,0,0,0,0, 0,0,0,8,8],
      [9,9,9,9,9, 9,2,0,10,0, 0,14,8,8,8],
      [2,2,2,2,2, 2,2,2,2,2, 2,2,2,2,2],
    ]);
    this.tilemap = new TileMap(this.tileSize, map);
    this.world = new Rectangle(
      0, 0,
      this.tilemap.width * this.tileSize,
      this.tilemap.height * this.tileSize);
    this.window = new Rectangle(
      0, 0,
      Math.min(this.world.width, this.frame.width-this.statusSize),
      Math.min(this.world.height, this.frame.height));

    this.player = null;
    this.workers = [];

    var tilemap = this.tilemap;
    tilemap.apply(function (x, y, c) {
      switch (c) {
      case 5:
      case 6:
	scene.addObject(new Spawner(tilemap.map2coord(new Vec2(x,y))));
	break;
      case 9:
	if (x == 0) {
	  scene.addObject(new Spawner(tilemap.map2coord(new Vec2(x,y))));
	}
	break;
      case 10:
	scene.player = new Player(tilemap.map2coord(new Vec2(x,y)));
	scene.addObject(scene.player);
	tilemap.set(x, y, 0);
	break;
      case 11:
	scene.workers.push({worker:null, bounds:tilemap.map2coord(new Vec2(x,y))});
	tilemap.set(x, y, 0);
	break;
      case 12:
	scene.addObject(new Assistant(tilemap.map2coord(new Vec2(x,y))));
	tilemap.set(x, y, 0);
	break;
      case 13:
	scene.addObject(new Researcher(tilemap.map2coord(new Vec2(x,y))));
	tilemap.set(x, y, 0);
	break;
      case 14:
	scene.addObject(new Kitty(tilemap.map2coord(new Vec2(x,y))));
	tilemap.set(x, y, 0);
	break;
      case 15:
	scene.addObject(new Machine(tilemap.map2coord(new Vec2(x,y))));
	tilemap.set(x, y, 0);
	break;
      case 20:
	scene.addObject(new Fire(tilemap.map2coord(new Vec2(x,y))));
	tilemap.set(x, y, 0);
	break;
      }
    });
    
    var x0 = this.frame.width-this.statusSize+4;
    var y0 = 4;
    var text = new TextBox(new Rectangle(x0, y0, this.statusSize-8, this.frame.height-8));
    text.font = app.font;
    text.addSegment(new Vec2(x0,y0), 'EUSKO');
    text.addSegment(new Vec2(x0,y0+10), 'CORP.');
    text.addSegment(new Vec2(x0,y0+60), 'MONEY');
    text.addSegment(new Vec2(x0,y0+80), 'LOAN');
    text.addSegment(new Vec2(x0,y0+100), 'REVENUE');
    text.addSegment(new Vec2(x0,y0+120), 'COST');
    text.addSegment(new Vec2(x0,y0+150), 'DEMAND');
    text.addSegment(new Vec2(x0,y0+170), 'SUPPLY');
    text.addSegment(new Vec2(x0,y0+190), 'QUALITY');
    text.addSegment(new Vec2(x0+30,y0+210), '/UNIT');
    this.statusText = text;
    this.textDate = text.addSegment(new Vec2(x0,y0+30), '2015/01');
    this.textHealth = text.addSegment(new Vec2(x0,y0+40), '\x7f', app.colorfont);
    this.textMoney = text.addSegment(new Vec2(x0,y0+70), '$0');
    this.textLoan = text.addSegment(new Vec2(x0,y0+90), '$0');
    this.textRevenue = text.addSegment(new Vec2(x0,y0+110), '$0');
    this.textCost = text.addSegment(new Vec2(x0,y0+130), '$0');
    this.textQuality = text.addSegment(new Vec2(x0,y0+200), '$0');
    this.barDemand = new BarBox(new Rectangle(x0+10, y0+158, 50, 8));
    this.barSupply = new BarBox(new Rectangle(x0+10, y0+178, 50, 8));

    this.chatBox = new ChatBox(new Rectangle(16, 16, this.window.width-32, this.chatSize));
    this.chatBox.font = app.font;
    this.chatBox.visible = false;
    this.chatBox.start(this);
    this.height0 = this.chatBox.frame.height+32;
    this.height1 = this.window.height-this.chatBox.frame.height-32;
    this.chatBox.bounds = new Rectangle(0, this.height1);

    this.money = 1000;
    this.loan = 0;
    this.revenue = 0;
    this.cost = 100;
    this.demand = 0;
    this.supply = 0;
    this.quality = 1;

    this.demandNext = 0;
    this.demandGoal = 0;
    this.dayNext = 0;
    this.days = 0;

    this.updateTime();
    this.updateDemand();
    this.updateCost();
    this.updateSupply();
    
  },
  
  setCenter: function (rect) {
    if (this.window.width < rect.width) {
      this.window.x = (rect.width-this.window.width)/2;
    } else if (rect.x < this.window.x) {
      this.window.x = rect.x;
    } else if (this.window.x+this.window.width < rect.x+rect.width) {
      this.window.x = rect.x+rect.width - this.window.width;
    }
    if (this.window.height < rect.height) {
      this.window.y = (rect.height-this.window.height)/2;
    } else if (rect.y < this.window.y) {
      this.window.y = rect.y;
    } else if (this.window.y+this.window.height < rect.y+rect.height) {
      this.window.y = rect.y+rect.height - this.window.height;
    }
    this.window.x = clamp(0, this.window.x, this.world.width-this.window.width);
    this.window.y = clamp(0, this.window.y, this.world.height-this.window.height);
  },

  render: function (ctx, bx, by) {
    // Fill with the background color.
    ctx.fillStyle = 'black';
    ctx.fillRect(bx, by, this.frame.width, this.frame.height);

    var tileSize = this.tileSize;
    var window = this.window;
    var tilemap = this.tilemap;
    var x0 = Math.floor(window.x/tileSize);
    var y0 = Math.floor(window.y/tileSize);
    var x1 = Math.ceil((window.x+window.width)/tileSize);
    var y1 = Math.ceil((window.y+window.height)/tileSize);
    var fx = x0*tileSize-window.x;
    var fy = y0*tileSize-window.y;

    // Draw the tilemap.
    var ft = (function (x,y,c) { return c; });
    tilemap.renderFromBottomLeft(
      ctx, this.app.tiles, ft,
      bx+fx, by+fy, x0, y0, x1-x0+1, y1-y0+1);

    // Draw the sprites.
    for (var i = 0; i < this.sprites.length; i++) {
      var obj = this.sprites[i];
      if (obj.scene !== this) continue;
      if (!obj.visible) continue;
      if (obj.bounds === null) {
	obj.render(ctx, bx, by);
      } else {
	obj.render(ctx, bx-window.x, by-window.y);
      }
    }

    ctx.fillStyle = 'black';
    ctx.fillRect(bx+window.width, by,
		 this.frame.width-window.width, this.frame.height);

    this.statusText.render(ctx, bx, by);
    this.barDemand.render(ctx, bx, by);
    this.barSupply.render(ctx, bx, by);
    if (this.chatBox.visible) {
      if (this.height1 <= this.player.bounds.y-window.y) {
	this.chatBox.bounds.y = 0;
      } else if (this.player.bounds.y-window.y <= this.height0) {
	this.chatBox.bounds.y = this.height1;
      }
      this.chatBox.render(ctx, bx, by);
    }
  },

  keydown: function (key) {
    this._GameScene_keydown(key);
    if (this.chatBox.visible) {
      if (this.chatBox.getCurrentTask() !== null) {
	this.chatBox.keydown(key);
      } else {
	this.chatBox.visible = false;
      }
    } else {
      var sym = getKeySym(key);
      if (sym == 'up' || sym == 'down') {
	var actors = this.findObjects(
	  this.player.bounds.inflate(16,16),
	  (function (obj) { return obj instanceof Employee; }));
	for (var i = 0; i < actors.length; i++) {
	  this.talkTo(actors[i]);
	  break;
	}
      }
    }
  },

  update: function () {
    this._GameScene_update();
    if (!this.chatBox.visible) {
      this.player.usermove(this.app.key_dir);
      this.player.jump(this.app.key_action);
    }
    this.setCenter(this.player.bounds.inflate(50,50));
    this.updateTime();
    this.updateDemand();
    this.textHealth.text = '';
    for (var i = 0; i < this.player.health; i++) {
      this.textHealth.text += '\x7f';
    }
    this.barDemand.value = this.demand;
    this.barSupply.value = this.supply;
    this.chatBox.update();
  },

  talkTo: function (actor) {
    var scene = this;
    var app = this.app;
    if (actor instanceof Assistant) {
      this.chatBox.visible = true;
      this.chatBox.clear();
      this.chatBox.addDisplay('"Good day, Sir."', 1);
      var menu = this.chatBox.addMenu();
      menu.vertical = true;
      menu.sound = app.audios.beep;
      menu.current = menu.addItem(new Vec2(40, 30), 'Nothing', null);
      menu.addItem(new Vec2(40, 40), 'Hire Worker ($100/M)',
		   (function () { scene.hireWorker(); }));
      menu.addItem(new Vec2(40, 50), 'Borrow $500',
		   (function () { scene.borrowMoney(); }));
      menu.addItem(new Vec2(40, 60), 'Repay $500',
		   (function () { scene.repayMoney(); }));
      menu.selected.subscribe(function (obj, value) {
	scene.chatBox.visible = false;
	if (value !== null) { value(); }
      });
      
    } else if (actor instanceof Worker) {
      this.chatBox.visible = true;
      this.chatBox.clear();
      this.chatBox.addDisplay('"\'ello, Boss."', 1);
      var menu = this.chatBox.addMenu();
      menu.vertical = true;
      menu.sound = app.audios.beep;
      menu.current = menu.addItem(new Vec2(40, 30), 'Nothing', null);
      menu.addItem(new Vec2(40, 40), 'Train ($200)',
		   (function () { scene.trainWorker(actor); }));
      menu.addItem(new Vec2(40, 50), "You're Fired",
		   (function () { scene.fireWorker(actor); })),
      menu.selected.subscribe(function (obj, value) {
	scene.chatBox.visible = false;
	if (value !== null) { value(); }
      });
      
    } else if (actor instanceof Researcher) {
      this.chatBox.visible = true;
      this.chatBox.clear();
      this.chatBox.addDisplay('"What do you want?"', 1);
      var menu = this.chatBox.addMenu();
      menu.vertical = true;
      menu.sound = app.audios.beep;
      menu.current = menu.addItem(new Vec2(40, 30), 'Nothing', null);
      var v = 100*Math.pow(2,this.quality);
      menu.addItem(new Vec2(40, 40), 'Upgrade Product ($'+v+')',
		   (function () { scene.upgradeProduct(); }));
      menu.addItem(new Vec2(40, 50), 'Downgrade Product',
		   (function () { scene.downgradeProduct(); }));
      menu.selected.subscribe(function (obj, value) {
	scene.chatBox.visible = false;
	if (value !== null) { value(); }
      });
      
    } else if (actor instanceof Kitty) {
      this.chatBox.visible = true;
      this.chatBox.clear();
      this.chatBox.addDisplay(actor.quote(), 1);
    }
  },

  updateCost: function () {
    var cost = 100;
    for (var i = 0; i < this.workers.length; i++) {
      var slot = this.workers[i];
      if (slot.worker !== null) {
	cost += slot.worker.wage;
      }
    }
    cost += Math.floor(this.loan*0.1);
    this.cost = cost;
    this.textCost.text = rformat('$'+this.cost+'/M', 8);
  },

  updateSupply: function () {
    var supply = 0;
    for (var i = 0; i < this.workers.length; i++) {
      var slot = this.workers[i];
      if (slot.worker !== null) {
	supply += slot.worker.rank;
      }
    }
    this.supply = Math.min(1.0, 0.5*supply/this.quality);
    this.textQuality.text = rformat('$'+this.quality, 8);
  },
  
  updateRevenue: function () {
    var revenue = Math.min(this.supply, this.demand)*this.quality;
    this.revenue = Math.floor(400*revenue);
    this.textRevenue.text = rformat('$'+this.revenue+'/M', 8);
  },

  updateMoney: function () {
    this.textMoney.text = rformat('$'+this.money, 8);
    this.textLoan.text = rformat('$'+this.loan, 8);
  },
  
  updateTime: function () {
    if (this.dayNext < this.ticks) {
      this.dayNext = this.ticks+3*this.app.framerate;
      this.days++;
      var month = Math.floor(this.days/30) % 12;
      var day = this.days % 30;
      this.textDate.text = MONTHS[month]+'. '+(day+1);
      this.money += Math.floor(this.revenue/30);
      if (day == 0) {
	this.money -= this.cost;
      }
      this.updateMoney();
    }
  },

  updateDemand: function () {
    if (this.demandNext < this.ticks) {
      this.demandNext = this.ticks+frnd(10,50)*this.app.framerate;
      this.demandGoal = Math.random(); // harsh reality.
    }
    var v = Math.random()*0.05;
    this.demand = this.demand*(1.0-v)+this.demandGoal*v;
    this.updateRevenue();
  },

  hireWorker: function () {
    log("hireWorker");
    for (var i = 0; i < this.workers.length; i++) {
      var slot = this.workers[i];
      if (slot.worker === null) {
	slot.worker = new Worker(slot.bounds);
	slot.worker.upgrade();
	this.addObject(slot.worker);
	this.chatBox.visible = true;
	this.chatBox.clear();
	this.chatBox.addDisplay('"We hired a new worker."', 1);
	this.updateCost();
	this.updateSupply();
	return;
      }
    }
    this.chatBox.visible = true;
    this.chatBox.clear();
    this.chatBox.addDisplay('"No more worker can be hired."', 1);
  },
  borrowMoney: function () {
    log("borrowMoney");
    var v = 500;
    this.loan += v;
    this.money += Math.floor(v*0.9);
    var interest = Math.floor(this.loan*0.1);
    this.chatBox.visible = true;
    this.chatBox.clear();
    this.chatBox.addDisplay('"We borrowed $'+v+'.\n'+
			    ' Interest is $'+interest+'/MO."', 1);
    this.updateMoney();
    this.updateCost();
  },
  repayMoney: function () {
    log("repayMoney");
    var v = 500;
    if (this.money < v) {
      this.chatBox.visible = true;
      this.chatBox.clear();
      this.chatBox.addDisplay('"We don\'t have enough cash."', 1);
      return;
    }
    this.money -= v;
    this.loan -= v;
    var interest = Math.floor(this.loan*0.1);
    this.chatBox.visible = true;
    this.chatBox.clear();
    this.chatBox.addDisplay('"We repayed $'+v+'.\n'+
			    ' Interest is $'+interest+'/MO."', 1);
    this.updateMoney();
    this.updateCost();
  },
  trainWorker: function (worker) {
    log("trainWorker:", worker);
    var v = 200;
    if (this.money < v) {
      this.chatBox.visible = true;
      this.chatBox.clear();
      this.chatBox.addDisplay('"We don\'t have enough cash."', 1);
      return;
    }
    if (2 <= worker.rank) {
      this.chatBox.visible = true;
      this.chatBox.clear();
      this.chatBox.addDisplay('"I\'m already good, Sir."', 1);
      return;
    }
    worker.upgrade();
    this.money -= v;
    this.chatBox.visible = true;
    this.chatBox.clear();
    this.chatBox.addDisplay('"I become better!\n'+
			    ' My wage is now $'+worker.wage+'/MO."', 1);
    this.updateMoney();
    this.updateCost();
    this.updateSupply();
  },
  fireWorker: function (worker) {
    log("fireWorker:", worker);
    for (var i = 0; i < this.workers.length; i++) {
      var slot = this.workers[i];
      if (slot.worker === worker) {
	this.removeObject(worker);
	slot.worker = null;
      }
    }
    this.updateCost();
    this.updateSupply();
  },
  upgradeProduct: function () {
    log("upgradeProduct");
    var v = 100*Math.pow(2,this.quality);
    if (this.money < v) {
      this.chatBox.visible = true;
      this.chatBox.clear();
      this.chatBox.addDisplay('"We don\'t have enough cash."', 1);
      return;
    }
    this.money -= v;
    this.quality++;
    this.chatBox.visible = true;
    this.chatBox.clear();
    this.chatBox.addDisplay('"Unit price is now $'+this.quality+'.\n'+
			    ' Production rate was also affected."', 1);
    this.updateMoney();
    this.updateSupply();
  },
  downgradeProduct: function () {
    log("downgradeProduct");
    if (this.quality <= 1) {
      this.chatBox.visible = true;
      this.chatBox.clear();
      this.chatBox.addDisplay('"We can\'t downgrade anymore."', 1);
      return;
    }
    this.quality--;
    this.chatBox.visible = true;
    this.chatBox.clear();
    this.chatBox.addDisplay('"Unit price is now $'+this.quality+'."', 1);
    this.updateSupply();
  },
  
});
