// Generated by CoffeeScript 1.7.1
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  $(function() {

    /*
    定数
     */
    var FPS, ID_SCENE_GAME, ID_SCENE_INTRO, ID_SCENE_OUTRO, ID_SOUND_CLICK, ID_SOUND_COUNTUP, ID_SOUND_FAILURE, ID_SOUND_JUMP, OBSTACLE_DURATION_X, OBSTACLE_DURATION_Y, OBSTACLE_HEIGHT, OBSTACLE_WIDTH, Obstacle, PLAYER_HEIGHT, PLAYER_JUMP_FORCE, PLAYER_WIDTH, Panel, Physics, Player, SCROLL_SPEED, STAGE_HEIGHT, STAGE_WIDTH, Sound, count, currentSceneId, onResize, panel, physics, sound;
    FPS = 1000 / 30;
    ID_SCENE_INTRO = "id_scene_intro";
    ID_SCENE_GAME = "id_scene_game";
    ID_SCENE_OUTRO = "id_scene_outro";
    SCROLL_SPEED = 5;
    STAGE_WIDTH = 750;
    STAGE_HEIGHT = 750;
    OBSTACLE_HEIGHT = 750;
    OBSTACLE_WIDTH = 64;
    OBSTACLE_DURATION_X = 300;
    OBSTACLE_DURATION_Y = 200;
    PLAYER_HEIGHT = 49;
    PLAYER_WIDTH = 34;
    PLAYER_JUMP_FORCE = 0.11;
    ID_SOUND_CLICK = "js-soundClick";
    ID_SOUND_FAILURE = "js-soundFailure";
    ID_SOUND_JUMP = "js-soundJump";
    ID_SOUND_COUNTUP = "js-soundCountUp";

    /*
    変数
     */
    currentSceneId = null;
    physics = null;
    panel = null;
    count = 0;

    /*
    クラス
     */
    Physics = (function() {
      function Physics(element) {
        this._onHit = __bind(this._onHit, this);
        this._onControll = __bind(this._onControll, this);
        var ceiling, floor;
        this._engine = null;
        this._player = null;
        this._obstacleArr = [];
        this._scrollX = 0;
        this._intervalId = null;
        this._intervalId2 = null;
        this._engine = Matter.Engine.create(document.getElementById(element), {
          render: {
            options: {
              wireframes: false,
              width: STAGE_WIDTH,
              height: STAGE_HEIGHT,
              background: "./images/bg.png"
            }
          }
        });
        Matter.Engine.run(this._engine);
        ceiling = Matter.Bodies.rectangle(STAGE_WIDTH / 2, -10, STAGE_WIDTH, 10, {
          isStatic: true
        });
        floor = Matter.Bodies.rectangle(STAGE_WIDTH / 2, STAGE_HEIGHT + 10, STAGE_WIDTH, 10, {
          isStatic: true
        });
        Matter.World.add(this._engine.world, [ceiling, floor]);
      }

      Physics.prototype.setIntroScene = function() {
        return this._engine.enabled = false;
      };

      Physics.prototype.setGameScene = function() {
        this._engine.enabled = true;
        this._player = new Player(this._engine.world);
        this._obstacleArr.push(new Obstacle(this._engine.world));
        if (this._intervalId) {
          clearInterval(this._intervalId);
        }
        this._intervalId = setInterval((function(_this) {
          return function() {
            var arr, obstacle, _i, _len, _ref;
            _this._scrollX += SCROLL_SPEED;
            if (OBSTACLE_DURATION_X < _this._scrollX) {
              _this._scrollX = 0;
              _this._obstacleArr.push(new Obstacle(_this._engine.world));
            }
            arr = [];
            _ref = _this._obstacleArr;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              obstacle = _ref[_i];
              if (obstacle.getPositionX() < -(OBSTACLE_WIDTH / 2)) {
                obstacle.remove();
                obstacle = null;
              } else {
                obstacle.update();
                arr.push(obstacle);
                if (obstacle.getIsPast(_this._player.getPositionX())) {
                  $("body").trigger("addCountEvent");
                }
              }
            }
            return _this._obstacleArr = arr;
          };
        })(this), FPS);
        $("html").on("keydown", this._onControll);
        $("body").on("touchstart", this._onControll);
        return Matter.Events.on(this._engine, "collisionStart", this._onHit);
      };

      Physics.prototype.setOutroScene = function() {
        return this._engine.enabled = false;
      };

      Physics.prototype.initialize = function() {
        var obstacle, _i, _len, _ref;
        if (this._player) {
          this._player.remove();
        }
        _ref = this._obstacleArr;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          obstacle = _ref[_i];
          obstacle.remove();
        }
        this._obstacleArr = [];
        return this._scrollX = 0;
      };

      Physics.prototype._onControll = function() {
        return this._player.jump();
      };

      Physics.prototype._onHit = function(e) {
        if (this._intervalId) {
          clearInterval(this._intervalId);
        }
        Matter.Events.off(this._engine, "collisionStart", this._onHit);
        $("html").off("keydown", this._onControll);
        $("body").off("touchstart", this._onControll);
        this._intervalId2 = setTimeout((function(_this) {
          return function() {
            clearTimeout(_this._intervalId2);
            return $("body").trigger("changeSceneEvent", [
              {
                id: ID_SCENE_OUTRO
              }
            ]);
          };
        })(this), 2000);
        return $("body").trigger("playSoundEvent", [
          {
            id: ID_SOUND_FAILURE
          }
        ]);
      };

      return Physics;

    })();
    Player = (function() {
      function Player(world) {
        this._world = world;
        this._body = null;
        this._intervalId = null;
        this._body = Matter.Bodies.rectangle(200, 250, PLAYER_WIDTH, PLAYER_HEIGHT, {
          isStatic: false,
          density: 0.002,
          frictionAir: 0,
          render: {
            sprite: {
              texture: "./images/gesso.png"
            }
          }
        });
        Matter.World.add(this._world, [this._body]);
      }

      Player.prototype.getPositionX = function() {
        return this._body.position.x;
      };

      Player.prototype.jump = function() {
        Matter.Body.applyForce(this._body, {
          x: 0,
          y: 1
        }, {
          x: 0,
          y: -PLAYER_JUMP_FORCE
        });
        this._body.render.sprite.texture = "./images/gesso2.png";
        if (this._intervalId) {
          clearTimeout(this._intervalId);
        }
        this._intervalId = setTimeout((function(_this) {
          return function() {
            return _this._body.render.sprite.texture = "./images/gesso.png";
          };
        })(this), 100);
        return $("body").trigger("playSoundEvent", [
          {
            id: ID_SOUND_JUMP
          }
        ]);
      };

      Player.prototype.remove = function() {
        return Matter.World.remove(this._world, this._body);
      };

      return Player;

    })();
    Obstacle = (function() {
      function Obstacle(world, x) {
        var durationY, randomY, targetX, targetY;
        this._world = world;
        this._topBody = null;
        this._bottomBody = null;
        this._isPast = false;
        durationY = OBSTACLE_DURATION_Y / 2;
        randomY = Math.floor(Math.random() * (STAGE_HEIGHT - OBSTACLE_DURATION_Y) - ((STAGE_HEIGHT - OBSTACLE_DURATION_Y) / 2));
        targetX = STAGE_WIDTH + (OBSTACLE_WIDTH / 2);
        targetY = (OBSTACLE_HEIGHT / 2) + (-STAGE_HEIGHT / 2) - durationY + randomY;
        this._topBody = Matter.Bodies.rectangle(targetX, targetY, OBSTACLE_WIDTH, OBSTACLE_HEIGHT, {
          isStatic: true,
          render: {
            sprite: {
              texture: "./images/clay-pipe.png"
            }
          }
        });
        targetY = (OBSTACLE_HEIGHT / 2) + (STAGE_HEIGHT / 2) + durationY + randomY;
        this._bottomBody = Matter.Bodies.rectangle(targetX, targetY, OBSTACLE_WIDTH, OBSTACLE_HEIGHT, {
          isStatic: true,
          render: {
            sprite: {
              texture: "./images/clay-pipe.png"
            }
          }
        });
        Matter.World.add(this._world, [this._topBody, this._bottomBody]);
      }

      Obstacle.prototype.getIsPast = function(playerX) {
        if (!this._isPast && this._topBody.position.x <= playerX) {
          this._isPast = true;
          return true;
        } else {
          return false;
        }
      };

      Obstacle.prototype.getPositionX = function() {
        return this._topBody.position.x;
      };

      Obstacle.prototype.update = function() {
        Matter.Body.translate(this._topBody, {
          x: -SCROLL_SPEED,
          y: 0
        });
        return Matter.Body.translate(this._bottomBody, {
          x: -SCROLL_SPEED,
          y: 0
        });
      };

      Obstacle.prototype.remove = function() {
        Matter.World.remove(this._world, this._topBody);
        return Matter.World.remove(this._world, this._bottomBody);
      };

      return Obstacle;

    })();
    Panel = (function() {
      function Panel() {
        this._$panelIntro = $("#js-panelIntro");
        this._$panelGame = $("#js-panelGame");
        this._$panelOutro = $("#js-panelOutro");
      }

      Panel.prototype.setIntroScene = function() {
        this._$panelIntro.css({
          display: "block"
        });
        this._$panelGame.css({
          display: "none"
        });
        return this._$panelOutro.css({
          display: "none"
        });
      };

      Panel.prototype.setGameScene = function() {
        this._$panelIntro.css({
          display: "none"
        });
        this._$panelGame.css({
          display: "block"
        });
        return this._$panelOutro.css({
          display: "none"
        });
      };

      Panel.prototype.setOutroScene = function() {
        this._$panelIntro.css({
          display: "none"
        });
        this._$panelGame.css({
          display: "block"
        });
        return this._$panelOutro.css({
          display: "block"
        });
      };

      Panel.prototype.setCount = function(num) {
        return this._$panelGame.text(num);
      };

      return Panel;

    })();
    Sound = (function() {
      function Sound() {
        this._$soundClick = $("#" + ID_SOUND_CLICK);
        this._$soundFailure = $("#" + ID_SOUND_FAILURE);
        this._$soundJump = $("#" + ID_SOUND_JUMP);
        this._$soundCountUp = $("#" + ID_SOUND_COUNTUP);
      }

      Sound.prototype.play = function(id) {
        var target;
        target = null;
        if (id === ID_SOUND_CLICK) {
          target = this._$soundClick.get(0);
        } else if (id === ID_SOUND_FAILURE) {
          target = this._$soundFailure.get(0);
        } else if (id === ID_SOUND_JUMP) {
          target = this._$soundJump.get(0);
        } else if (id === ID_SOUND_COUNTUP) {
          target = this._$soundCountUp.get(0);
        }
        target.currentTime = 0;
        target.volume = 0.2;
        return target.play();
      };

      return Sound;

    })();

    /*
    イベント
     */
    $("body").on("changeSceneEvent", function(e, data) {
      if (data.id === ID_SCENE_INTRO) {
        if (currentSceneId === ID_SCENE_INTRO) {
          return;
        }
        currentSceneId = ID_SCENE_INTRO;
        physics.setIntroScene();
        return panel.setIntroScene();
      } else if (data.id === ID_SCENE_GAME) {
        if (currentSceneId === ID_SCENE_GAME) {
          return;
        }
        currentSceneId = ID_SCENE_GAME;
        physics.setGameScene();
        panel.setGameScene();
        count = 0;
        panel.setCount(count);
        return $("body").trigger("playSoundEvent", [
          {
            id: ID_SOUND_CLICK
          }
        ]);
      } else if (data.id === ID_SCENE_OUTRO) {
        if (currentSceneId === ID_SCENE_OUTRO) {
          return;
        }
        currentSceneId = ID_SCENE_OUTRO;
        physics.setOutroScene();
        return panel.setOutroScene();
      }
    });
    $("body").on("addCountEvent", function() {
      count = count + 1;
      panel.setCount(count);
      return $("body").trigger("playSoundEvent", [
        {
          id: ID_SOUND_COUNTUP
        }
      ]);
    });
    $("html").on("keydown", function() {
      if (currentSceneId === ID_SCENE_INTRO) {
        return $("body").trigger("changeSceneEvent", [
          {
            id: ID_SCENE_GAME
          }
        ]);
      } else if (currentSceneId === ID_SCENE_OUTRO) {
        physics.initialize();
        return $("body").trigger("changeSceneEvent", [
          {
            id: ID_SCENE_GAME
          }
        ]);
      }
    });
    $("body").on("touchstart", function() {
      if (currentSceneId === ID_SCENE_INTRO) {
        return $("body").trigger("changeSceneEvent", [
          {
            id: ID_SCENE_GAME
          }
        ]);
      } else if (currentSceneId === ID_SCENE_OUTRO) {
        physics.initialize();
        return $("body").trigger("changeSceneEvent", [
          {
            id: ID_SCENE_GAME
          }
        ]);
      }
    });
    $("body").on("playSoundEvent", function(e, data) {
      if (data.id === ID_SOUND_CLICK) {
        return sound.play(ID_SOUND_CLICK);
      } else if (data.id === ID_SOUND_FAILURE) {
        return sound.play(ID_SOUND_FAILURE);
      } else if (data.id === ID_SOUND_JUMP) {
        return sound.play(ID_SOUND_JUMP);
      } else if (data.id === ID_SOUND_COUNTUP) {
        return sound.play(ID_SOUND_COUNTUP);
      }
    });
    onResize = function() {
      var size;
      if ($(window).height() < $(window).width()) {
        size = $(window).height();
      } else {
        size = $(window).width();
      }
      $("#js-game").css({
        position: "absolute",
        top: Math.floor(($(window).height() - size) / 2),
        left: Math.floor(($(window).width() - size) / 2),
        height: size,
        width: size
      });
      $("#js-panelIntro").css({
        position: "absolute",
        top: Math.floor((size - 100) / 2),
        left: Math.floor((size - 300) / 2)
      });
      $("#js-panelGame").css({
        position: "absolute",
        top: 20,
        left: Math.floor((size - 100) / 2)
      });
      return $("#js-panelOutro").css({
        position: "absolute",
        top: Math.floor((size - 100) / 2),
        left: Math.floor((size - 300) / 2)
      });
    };
    onResize();
    $(window).on("resize", onResize);

    /*
    アクション
     */
    physics = new Physics("js-engine");
    panel = new Panel();
    sound = new Sound();
    return $("body").trigger("changeSceneEvent", [
      {
        id: ID_SCENE_INTRO
      }
    ]);
  });

}).call(this);

//# sourceMappingURL=index.map
