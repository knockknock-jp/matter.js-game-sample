$ ->

  ###
  定数
  ###

  FPS = 1000 / 30
  ID_SCENE_INTRO = "id_scene_intro"
  ID_SCENE_GAME = "id_scene_game"
  ID_SCENE_OUTRO = "id_scene_outro"
  SCROLL_SPEED = 5
  STAGE_WIDTH = 750
  STAGE_HEIGHT = 750
  OBSTACLE_HEIGHT = 750
  OBSTACLE_WIDTH = 64
  OBSTACLE_DURATION_X = 300
  OBSTACLE_DURATION_Y = 200
  PLAYER_HEIGHT = 49
  PLAYER_WIDTH = 34
  PLAYER_JUMP_FORCE = 0.11
  ID_SOUND_CLICK = "js-soundClick"
  ID_SOUND_FAILURE = "js-soundFailure"
  ID_SOUND_JUMP = "js-soundJump"
  ID_SOUND_COUNTUP = "js-soundCountUp"

  ###
  変数
  ###

  currentSceneId = null
  physics = null
  panel = null
  count = 0

  ###
  クラス
  ###

  # Matter.js制御
  class Physics
    constructor: (element)->
      @_engine = null
      @_player = null
      @_obstacleArr = []
      @_scrollX = 0
      @_intervalId = null
      @_intervalId2 = null
      # 物理エンジンを作成
      @_engine = Matter.Engine.create document.getElementById(element), {
        render: { # レンダリングの設定
          options: {
            wireframes: false # ワイヤーフレームモードをoff
            width: STAGE_WIDTH # canvasのwidth
            height: STAGE_HEIGHT # canvasのheight
            background: "./images/bg.png"
          }
        }
      }
      # 演算領域を設定
      @_engine.world.bounds.max = {x: STAGE_WIDTH, y: STAGE_HEIGHT}
      # 物理シュミレーションを実行
      Matter.Engine.run @_engine
      # 天井生成
      ceiling = Matter.Bodies.rectangle(STAGE_WIDTH / 2, -10, STAGE_WIDTH, 10, {
        isStatic: true # 固定するか否か
      })
      # 床生成
      floor = Matter.Bodies.rectangle(STAGE_WIDTH / 2, STAGE_HEIGHT + 10, STAGE_WIDTH, 10, {
        isStatic: true # 固定するか否か
      })
      # 天井・床追加
      Matter.World.add @_engine.world, [ceiling, floor]

    # イントロシーン開始
    setIntroScene: ->
      # エンジン停止
      @_engine.enabled = false

    # ゲームシーン開始
    setGameScene: ->
      # エンジン再起動
      @_engine.enabled = true
      # プレーヤー生成
      @_player = new Player @_engine.world
      # 障害物生成
      @_obstacleArr.push new Obstacle(@_engine.world)
      #
      if @_intervalId
        clearInterval @_intervalId
      @_intervalId = setInterval =>
        @_scrollX += SCROLL_SPEED
        if OBSTACLE_DURATION_X < @_scrollX
          @_scrollX = 0
          # 障害物生成
          @_obstacleArr.push new Obstacle(@_engine.world)
        arr = []
        for obstacle in @_obstacleArr
          if obstacle.getPositionX() < -(OBSTACLE_WIDTH / 2)
            # 障害物削除
            obstacle.remove()
            obstacle = null
          else
            # 障害物更新
            obstacle.update()
            arr.push obstacle
            # 障害物通過判定
            if obstacle.getIsPast(@_player.getPositionX())
              # カウントアップイベント
              $("body").trigger "addCountEvent"
        @_obstacleArr = arr
      , FPS
      # キーボードイベント
      $("html").on "keydown", @_onControll
      # 画面タップ
      $("body").on "touchstart", @_onControll
      # 衝突判定
      Matter.Events.on @_engine, "collisionStart", @_onHit

    # 終了シーン開始
    setOutroScene: ->
      # エンジン停止
      @_engine.enabled = false

    # 初期化
    initialize: ->
      if @_player
        @_player.remove()
      for obstacle in @_obstacleArr
        obstacle.remove()
      @_obstacleArr = []
      @_scrollX = 0

    _onControll: =>
      # ジャンプ
      @_player.jump()

    _onHit: (e)=>
      if @_intervalId
        clearInterval @_intervalId
      # 衝突判定
      Matter.Events.off @_engine, "collisionStart", @_onHit
      # キーボードイベント
      $("html").off "keydown", @_onControll
      # 画面タップ
      $("body").off "touchstart", @_onControll
      @_intervalId2 = setTimeout =>
        clearTimeout @_intervalId2
        # シーン変更
        $("body").trigger "changeSceneEvent", [{id: ID_SCENE_OUTRO}]
      , 2000
      # 効果音再生イベント
      $("body").trigger "playSoundEvent", [{id: ID_SOUND_FAILURE}]

  # プレーヤー
  class Player
    constructor: (world)->
      @_world = world
      @_body = null
      @_intervalId = null
      # Body生成
      @_body = Matter.Bodies.rectangle(200, 250, PLAYER_WIDTH, PLAYER_HEIGHT, {
        isStatic: false # 固定するか否か
        density: 0.002 # 密度
        frictionAir: 0 # 空気抵抗
        render: {
          sprite: { # スプライトの設定
            texture: "./images/gesso.png" # スプライトに使うテクスチャ画像を指定
          }
        }
      })
      # Body追加
      Matter.World.add @_world, [@_body]

    # X位置取得
    getPositionX: ->
      return @_body.position.x

    # ジャンプ
    jump: ->
      # Body上方向に力を加える
      Matter.Body.applyForce @_body, {x: 0, y: 1}, {x: 0, y: -PLAYER_JUMP_FORCE}
      # スプライト変更
      @_body.render.sprite.texture = "./images/gesso2.png"
      if @_intervalId
        clearTimeout @_intervalId
      @_intervalId = setTimeout ()=>
        @_body.render.sprite.texture = "./images/gesso.png"
      , 100
      # 効果音再生イベント
      $("body").trigger "playSoundEvent", [{id: ID_SOUND_JUMP}]

    # 削除
    remove: ->
      # Body削除
      Matter.World.remove @_world, @_body

  # 障害物
  class Obstacle
    constructor: (world, x)->
      @_world = world
      @_topBody = null
      @_bottomBody = null
      @_isPast = false
      #
      durationY = OBSTACLE_DURATION_Y / 2
      randomY = Math.floor(Math.random() * (STAGE_HEIGHT - OBSTACLE_DURATION_Y) - ((STAGE_HEIGHT - OBSTACLE_DURATION_Y) / 2))
      targetX = STAGE_WIDTH + (OBSTACLE_WIDTH / 2)
      # 上のBody生成
      targetY = (OBSTACLE_HEIGHT / 2) + (-STAGE_HEIGHT / 2) - durationY + randomY
      @_topBody = Matter.Bodies.rectangle(targetX, targetY, OBSTACLE_WIDTH, OBSTACLE_HEIGHT, {
        isStatic: true
        render: {
          sprite: { # スプライトの設定
            texture: "./images/clay-pipe.png" # スプライトに使うテクスチャ画像を指定
          }
        }
      })
      # 下のBody生成
      targetY = (OBSTACLE_HEIGHT / 2) + (STAGE_HEIGHT / 2) + durationY + randomY
      @_bottomBody = Matter.Bodies.rectangle(targetX, targetY, OBSTACLE_WIDTH, OBSTACLE_HEIGHT, {
        isStatic: true
        render: {
          sprite: { # スプライトの設定
            texture: "./images/clay-pipe.png" # スプライトに使うテクスチャ画像を指定
          }
        }
      })
      # Body追加
      Matter.World.add @_world, [@_topBody, @_bottomBody]

    # 通過判定
    getIsPast: (playerX)->
      if not @_isPast and @_topBody.position.x <= playerX
        @_isPast = true
        return true
      else
        return false

    # X位置取得
    getPositionX: ->
      return @_topBody.position.x

    # 更新
    update: ->
      # Body移動
      Matter.Body.translate @_topBody, {x: -SCROLL_SPEED, y: 0}
      Matter.Body.translate @_bottomBody, {x: -SCROLL_SPEED, y: 0}

    # 削除
    remove: ->
      # Body削除
      Matter.World.remove @_world, @_topBody
      Matter.World.remove @_world, @_bottomBody

  # パネル
  class Panel
    constructor: ->
      @_$panelIntro = $ "#js-panelIntro"
      @_$panelGame = $ "#js-panelGame"
      @_$panelOutro = $ "#js-panelOutro"

    # イントロシーン開始
    setIntroScene: ->
      @_$panelIntro.css {
        display: "block"
      }
      @_$panelGame.css {
        display: "none"
      }
      @_$panelOutro.css {
        display: "none"
      }

    # ゲームシーン開始
    setGameScene: ->
      @_$panelIntro.css {
        display: "none"
      }
      @_$panelGame.css {
        display: "block"
      }
      @_$panelOutro.css {
        display: "none"
      }

    # 終了シーン開始
    setOutroScene: ->
      @_$panelIntro.css {
        display: "none"
      }
      @_$panelGame.css {
        display: "block"
      }
      @_$panelOutro.css {
        display: "block"
      }

    # カウント設定
    setCount: (num)->
      @_$panelGame.text num

  # サウンド
  class Sound
    constructor: ->
      @_$soundClick = $("#" + ID_SOUND_CLICK)
      @_$soundFailure = $("#" + ID_SOUND_FAILURE)
      @_$soundJump = $("#" + ID_SOUND_JUMP)
      @_$soundCountUp = $("#" + ID_SOUND_COUNTUP)

    play: (id)->
      target = null
      if id is ID_SOUND_CLICK
        target = @_$soundClick.get(0)
      else if id is ID_SOUND_FAILURE
        target = @_$soundFailure.get(0)
      else if id is ID_SOUND_JUMP
        target = @_$soundJump.get(0)
      else if id is ID_SOUND_COUNTUP
        target = @_$soundCountUp.get(0)
      target.currentTime = 0
      target.volume = 0.2
      target.play()

  ###
  イベント
  ###

  # シーン変更イベント
  $("body").on "changeSceneEvent", (e, data)->
    if data.id is ID_SCENE_INTRO
      if currentSceneId is ID_SCENE_INTRO
        return
      currentSceneId = ID_SCENE_INTRO
      # イントロシーン開始
      physics.setIntroScene()
      panel.setIntroScene()
    else if data.id is ID_SCENE_GAME
      if currentSceneId is ID_SCENE_GAME
        return
      currentSceneId = ID_SCENE_GAME
      # ゲームシーン開始
      physics.setGameScene()
      panel.setGameScene()
      # カウント初期化
      count = 0
      panel.setCount count
      # 効果音再生イベント
      $("body").trigger "playSoundEvent", [{id: ID_SOUND_CLICK}]
    else if data.id is ID_SCENE_OUTRO
      if currentSceneId is ID_SCENE_OUTRO
        return
      currentSceneId = ID_SCENE_OUTRO
      # アウトロシーン開始
      physics.setOutroScene()
      panel.setOutroScene()

  # カウントアップ
  $("body").on "addCountEvent", ->
    count = count + 1
    panel.setCount count
    # 効果音再生イベント
    $("body").trigger "playSoundEvent", [{id: ID_SOUND_COUNTUP}]

  # キーボードイベント
  $("html").on "keydown", ->
    if currentSceneId is ID_SCENE_INTRO
      # シーン変更
      $("body").trigger "changeSceneEvent", [{id: ID_SCENE_GAME}]
    else if currentSceneId is ID_SCENE_OUTRO
      # 初期化
      physics.initialize()
      # シーン変更
      $("body").trigger "changeSceneEvent", [{id: ID_SCENE_GAME}]

  # 画面タップ
  $("body").on "touchstart", ->
    if currentSceneId is ID_SCENE_INTRO
      # シーン変更
      $("body").trigger "changeSceneEvent", [{id: ID_SCENE_GAME}]
    else if currentSceneId is ID_SCENE_OUTRO
      # 初期化
      physics.initialize()
      # シーン変更
      $("body").trigger "changeSceneEvent", [{id: ID_SCENE_GAME}]

  # 効果音再生イベント
  $("body").on "playSoundEvent", (e, data)->
    if data.id is ID_SOUND_CLICK
      sound.play ID_SOUND_CLICK
    else if data.id is ID_SOUND_FAILURE
      sound.play ID_SOUND_FAILURE
    else if data.id is ID_SOUND_JUMP
      sound.play ID_SOUND_JUMP
    else if data.id is ID_SOUND_COUNTUP
      sound.play ID_SOUND_COUNTUP

  # リサイズイベント
  onResize = ->
    if $(window).height() < $(window).width()
      size = $(window).height()
    else
      size = $(window).width()
    $("#js-game").css {
      position: "absolute"
      top: Math.floor(($(window).height() - size) / 2)
      left: Math.floor(($(window).width() - size) / 2)
      height: size
      width: size
    }
    $("#js-panelIntro").css {
      position: "absolute"
      top: Math.floor((size - 100) / 2)
      left: Math.floor((size - 300) / 2)
    }
    $("#js-panelGame").css {
      position: "absolute"
      top: 20
      left: Math.floor((size - 100) / 2)
    }
    $("#js-panelOutro").css {
      position: "absolute"
      top: Math.floor((size - 100) / 2)
      left: Math.floor((size - 300) / 2)
    }

  onResize()
  $(window).on "resize", onResize


  ###
  アクション
  ###

  # Matter.js制御
  physics = new Physics "js-engine"

  # パネル制御
  panel = new Panel()

  # サウンド制御
  sound = new Sound()

  # シーン変更
  $("body").trigger "changeSceneEvent", [{id: ID_SCENE_INTRO}]
