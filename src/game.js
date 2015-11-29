// game.js

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
  this.zorder = -1;
  this._Employee(bounds, bounds, 2);
}

define(Worker, Employee, 'Employee', {
});

// Assistant
function Assistant(bounds)
{
  this.zorder = 0;
  this._Employee(bounds, bounds, 4);
}

define(Assistant, Employee, 'Employee', {
});

// Researcher
function Researcher(bounds)
{
  this.zorder = 0;
  this._Employee(bounds, bounds, 5);
}

define(Researcher, Employee, 'Employee', {
});

// Movable
function isObstacle(c) {
  return (c < 0 || c == 2);
}
function Movable(bounds, hitbox, tileno)
{
  this._Actor(bounds, hitbox, tileno);
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
  this.zorder = 1;
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
      [0,1,0,0,0, 1,0,14,0,1, 0,0,0,1,0],
      [0,0,5,0,0, 0,0,2,2,0, 0,0,7,13,0],
      [0,0,3,0,0, 0,0,0,0,0, 0,2,2,2,2],
      
      [2,2,2,2,0, 0,0,6,4,4, 4,4,4,4,4],
      [0,0,3,0,0, 0,2,2,0,0, 0,0,0,0,0],
      [0,1,3,0,0, 1,0,0,0,1, 0,0,0,1,0],
      [0,0,3,0,0, 0,0,0,2,2, 0,0,0,12,0],
      [0,11,3,11,0, 11,0,0,0,0, 0,0,2,2,2],
      
      [2,2,2,2,2, 2,2,0,0,0, 0,0,0,0,0],
      [0,0,3,0,0, 0,0,0,0,0, 0,0,8,8,0],
      [0,1,3,0,0, 1,0,0,0,1, 2,2,2,2,2],
      [0,0,3,0,0, 0,0,0,0,0, 0,0,0,8,8],
      [9,9,9,9,9, 9,2,0,10,0, 0,0,8,8,8],
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
    this.slots = [];

    var tilemap = this.tilemap;
    tilemap.apply(function (x, y, c) {
      switch (c) {
      case 10:
	scene.player = new Player(tilemap.map2coord(new Vec2(x,y)));
	scene.addObject(scene.player);
	tilemap.set(x, y, 0);
	break;
      case 11:
	scene.slots.push({worker:null, bounds:tilemap.map2coord(new Vec2(x,y))});
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
    this.chatBox.padding = 8;
    this.chatBox.visible = false;
    this.chatBox.background = 'black';
    this.chatBox.start(this);
    this.height0 = this.chatBox.frame.height+32;
    this.height1 = this.window.height-this.chatBox.frame.height-32;
    this.chatBox.bounds = new Rectangle(0, this.height1);

    this.money = 1000;
    this.loan = 0;
    this.revenue = 0;
    this.cost = 100;
    this.demand = 0.5;
    this.supply = 0.5;
    this.quality = 0;
    
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
    this.textDate.text = '2015/01';
    this.textHealth.text = '';
    for (var i = 0; i < this.player.health; i++) {
      this.textHealth.text += '\x7f';
    }
    this.textMoney.text = rformat('$'+this.money, 8);
    this.textLoan.text = rformat('$'+this.loan, 8);
    this.textRevenue.text = rformat('$'+this.revenue+'/M', 8);
    this.textCost.text = rformat('$'+this.cost+'/M', 8);
    this.textQuality.text = rformat('$'+this.quality, 8);
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
      menu.addItem(new Vec2(40, 40), 'Hire Worker',
		   (function () { scene.hireWorker(); }));
      menu.addItem(new Vec2(40, 50), 'Loan Money',
		   (function () { scene.loanMoney(); }));
      menu.addItem(new Vec2(40, 60), 'Repay Money',
		   (function () { scene.repayMoney(); }));
      menu.selected.subscribe(function (obj, value) {
	if (value !== null) { value(); }
	scene.chatBox.visible = false;
      });
      
    } else if (actor instanceof Worker) {
      this.chatBox.visible = true;
      this.chatBox.clear();
      this.chatBox.addDisplay('"'+"'"+'ello, Boss."', 1);
      var menu = this.chatBox.addMenu();
      menu.vertical = true;
      menu.sound = app.audios.beep;
      menu.current = menu.addItem(new Vec2(40, 30), 'Nothing', null);
      menu.addItem(new Vec2(40, 40), 'Train',
		   (function () { scene.trainWorker(actor); }));
      menu.addItem(new Vec2(40, 50), "You're Fired",
		   (function () { scene.fireWorker(actor); })),
      menu.selected.subscribe(function (obj, value) {
	if (value !== null) { value(); }
	scene.chatBox.visible = false;
      });
      
    } else if (actor instanceof Researcher) {
      this.chatBox.visible = true;
      this.chatBox.clear();
      this.chatBox.addDisplay('"What do you want?"', 1);
      var menu = this.chatBox.addMenu();
      menu.vertical = true;
      menu.sound = app.audios.beep;
      menu.current = menu.addItem(new Vec2(40, 30), 'Nothing', null);
      menu.addItem(new Vec2(40, 40), 'Upgrade Product',
		   (function () { scene.upgradeProduct(); }));
      menu.addItem(new Vec2(40, 50), 'Downgrade Product',
		   (function () { scene.downgradeProduct(); }));
      menu.selected.subscribe(function (obj, value) {
	if (value !== null) { value(); }
	scene.chatBox.visible = false;
      });
      
    }
  },

  hireWorker: function () {
    log("hireWorker");
  },
  loanMoney: function () {
    log("loanMoney");
  },
  repayMoney: function () {
    log("repayMoney");
  },
  trainWorker: function (worker) {
    log("hireWorker:", worker);
  },
  fireWorker: function (worker) {
    log("fireWorker:", worker);
  },
  upgradeProduct: function () {
    log("upgradeProduct");
  },
  downgradeProduct: function () {
    log("downgradeProduct");
  },
  
});
