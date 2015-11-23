// game.js

function isObstacle(c) {
  return c != 0;
}

// Player
function Player(bounds)
{
  Actor.call(this, bounds, bounds, 0);
  this.speed = 4;
  this.gravity = 2;
  this.maxspeed = 8;
  this.jumpacc = -6;
  this.maxacctime = 8;
  this.velocity = new Vec2(0, 0);
  this._landed = false;
  this._jumpt = -1;
}

Player.prototype = Object.create(Actor.prototype);

Player.prototype.jump = function (jumping)
{
  if (jumping) {
    if (this._landed) {
      this._jumpt = 0;
      this.velocity.y = this.jumpacc;
      playSound(this.scene.app.audios.jump);
    }
  } else {
    this._jumpt = -1;
  }
};

Player.prototype.usermove = function (v)
{
  this.velocity.x = v.x*this.speed;
}

Player.prototype.update = function ()
{
  if (0 <= this._jumpt && this._jumpt < this.maxacctime) {
    this._jumpt++;
    this.velocity.y -= this.gravity;
  }
  this.velocity.y += this.gravity;
  this.velocity.y = clamp(-this.maxspeed, this.velocity.y, this.maxspeed);
  var v = this.getMove(this.velocity);
  this._landed = (0 < this.velocity.y && v.y === 0);
  this.velocity = v;
  this.move(this.velocity.x, this.velocity.y);
};

Player.prototype.getMove = function (v)
{
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
};


//  Game
// 
function Game(app)
{
  GameScene.call(this, app);
  this.tilesize = 16;
}

Game.prototype = Object.create(GameScene.prototype);
  
Game.prototype.init = function ()
{
  GameScene.prototype.init.call(this);

  var app = this.app;
  var map = copyArray([
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,1,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 1,1,1,1, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    
    [0,0,1,1, 1,1,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 1,1,0,0, 0,0,0,0, 1,1,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
  ]);
  this.tilemap = new TileMap(this.tilesize, map);
  this.world = new Rectangle(
    0, 0,
    this.tilemap.width * this.tilesize,
    this.tilemap.height * this.tilesize);
  this.window = new Rectangle(
    0, 0,
    Math.min(this.world.width, this.frame.width),
    Math.min(this.world.height, this.frame.height));

  var rect = new Rectangle(1, 10, 1, 1);
  this.player = new Player(this.tilemap.map2coord(rect));
  this.addObject(this.player);
  
  // show a banner.
  var scene = this;
  var textbox = new TextBox(this.frame);
  textbox.putText(app.font, ['GAME!!1'], 'center', 'center');
  textbox.duration = app.framerate*2;
  textbox.update = function () {
    TextBox.prototype.update.call(textbox);
    textbox.visible = blink(scene.ticks, app.framerate/2);
  };
  this.addObject(textbox);

  var tt = new TextBoxTT(new Rectangle(10, 10, 200, 100));
  tt.addTask(app.font, 'THIS IS GAEM.\nYES IT IS.', app.audios.beep, 8);
  this.addObject(tt);
};

Game.prototype.setCenter = function (rect)
{
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
};

Game.prototype.render = function (ctx, bx, by)
{
  // Fill with the background color.
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(bx, by, this.app.screen.width, this.app.screen.height);

  var tilesize = this.tilesize;
  var window = this.window;
  var tilemap = this.tilemap;
  var x0 = Math.floor(window.x/tilesize);
  var y0 = Math.floor(window.y/tilesize);
  var x1 = Math.ceil((window.x+window.width)/tilesize);
  var y1 = Math.ceil((window.y+window.height)/tilesize);
  var fx = x0*tilesize-window.x;
  var fy = y0*tilesize-window.y;

  // Draw the tilemap.
  var ft = (function (x,y,c) { return c; });
  tilemap.renderFromBottomLeft(
    ctx, this.app.tiles, ft,
    bx+fx, by+fy, x0, y0, x1-x0+1, y1-y0+1);

  GameScene.prototype.render.call(this, ctx, bx, by);
};

Game.prototype.update = function ()
{
  GameScene.prototype.update.call(this);
  this.player.usermove(this.app.key_dir);
};

Game.prototype.set_action = function (action)
{
  GameScene.prototype.set_action(this, action);
  this.player.jump(action);
}
