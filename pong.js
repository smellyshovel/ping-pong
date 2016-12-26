class Dimension {
  constructor(hash) {
    this.x = hash.x;
    this.y = hash.y;
  }
}

class Velocity extends Dimension {
  constructor(hash) {
    super({
      x: hash.x,
      y: hash.y,
    });
  }

  get speed() {
    // Pythagorean theorem to get hypotenuse of x & y cathetuses

    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }

  set speed(value) {
    // Calculates difference between existing speed and new speed

    let factor = value / this.speed;
    this.x *= factor;
    this.y *= factor;
  }
}

class Rect {
  constructor(hash) {
    this.pos = new Dimension({
      x: hash.pos.x,
      y: hash.pos.y,
    });

    this.size = new Dimension({
      x: hash.size.width,
      y: hash.size.height,
    });
  }

  draw(context) {
    context.fillStyle = "#fff";
    context.fillRect(this.left, this.top, this.size.x, this.size.y);
  }

  get left() {
    return this.pos.x - this.size.x / 2;
  }

  get right() {
    return this.pos.x + this.size.x / 2;
  }

  get top() {
    return this.pos.y - this.size.y / 2;
  }

  get bottom() {
    return this.pos.y + this.size.y / 2;
  }
}

class Ball extends Rect {
  constructor(hash) {
    super({
      pos: {
        x: hash.pos.x,
        y: hash.pos.y,
      },

      size: {
        width: hash.size,
        height: hash.size,
      },
    });

    this.vel = new Velocity({
      x: hash.speed,
      y: hash.speed,
    });

    this.prev = {
      x: 0.0,
      y: 0.0,
    };
  }

  get prevLeft() {
    return this.prev.x - this.size.x / 2;
  }

  get prevRight() {
    return this.prev.x + this.size.x / 2;
  }

  calcNewPos(dt) {
    this.prev.x = this.pos.x;
    this.prev.y = this.pos.y;

    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
  }

  reverseOnCollisionWithCanvasTopOrBottom(canvas) {
    const TopBorderCollisionCondition = this.top < 0;
    const BottomBorderCollisionCondition = this.bottom > canvas.height;

    if (TopBorderCollisionCondition || BottomBorderCollisionCondition) {
      this.reverse("y", "dinamic");
      // const CurrentSpeed = this.vel.speed;
      // this.vel.speed = CurrentSpeed * 1.10;
    }
  }

  reverseOnCollisionWithSticks(sticks) {
    const LeftStickCollisionCondition = this.prevLeft >= sticks[0].right &&
                                        this.left < sticks[0].right &&
                                        this.top < sticks[0].bottom &&
                                        this.bottom > sticks[0].top;

    const RightStickCollisionCondition = this.prevRight <= sticks[1].left &&
                                         this.right > sticks[1].left &&
                                         this.top < sticks[1].bottom &&
                                         this.bottom > sticks[1].top;

    if (LeftStickCollisionCondition || RightStickCollisionCondition) {
      this.reverse("x", "dinamic");
      this.reverse("y", "random");
    }
  }

  checkCollisionWithCanvasSide(canvas, side) {
    if (side == "left") {
      if (this.left < 0) {
        return true;
      } else return false;
    } else if (side == "right") {
      if (this.right > canvas.width) {
        return true;
      } else return false;
    }
  }

  reverse(asix, type) {
    if (type == "dinamic") {
      this.vel[asix] *= -1;
    } else if (type == "random") {
      const CurrentSpeed = this.vel.speed;
      this.vel[asix] += 300 * (Math.random() - 0.5);
      this.vel.speed = CurrentSpeed * 1.05;
    }
  }
}

class Stick extends Rect {
  constructor(hash) {
    super({
      pos: {
        x: hash.pos.x,
        y: hash.pos.y,
      },

      size: {
        width: hash.size.x,
        height: hash.size.y
      },
    });

    if (hash.vel) {
      this.vel = new Velocity(hash.vel);
    }

    this.canvasWidth = hash.canvasWidth;
    this.score = 0;

    this.initCanvasesWithDigits();
  }

  calcNewPos(canvasHeight, ball, dt) {
    if (Math.abs(ball.vel.y) < this.vel.y) {
      this.pos.y = this.pos.y + ball.vel.y * dt;
    } else {
      let direction = ball.vel.y > 0 ? 1 : -1;
      this.pos.y = this.pos.y + direction * this.vel.y * dt;
    }
  }

  initCanvasesWithDigits() {
    this.PIXEL = this.canvasWidth / 60;

    this.CWD = [ // CWD stands for Canvases With Digits
      '111101101101111', // 0
      '010010010010010', // 1
      '111001111100111', // 2
      '111001111001111', // 3
      '101101111001001', // 4
      '111100111001111', // 5
      '111100111101111', // 6
      '111001001001001', // 7
      '111101111101111', // 8
      '111101111001111'  // 9
    ].map(str => {
      const CANVAS = document.createElement("canvas");
      const CONTEXT = CANVAS.getContext("2d");
      CANVAS.width = 3 * this.PIXEL;
      CANVAS.height = 5 * this.PIXEL;

      CONTEXT.fillStyle = "#fff";

      str.split("").forEach((color, i) => {
        if (color == "1") {
          CONTEXT.fillRect(
            (i % 3) * this.PIXEL, // x
            (i / 3 | 0 ) * this.PIXEL, // y
            this.PIXEL, // w
            this.PIXEL // h
          );
        }
      });
      return CANVAS;
    });
  }

  drawScore(context, index) {
    const INDEX = ++index; // To avoid multiplying by zero
    const THIRD = context.canvas.width / 3;
    const DIGITS = this.score.toString().split("");
    const CW = this.PIXEL * 4;

    DIGITS.forEach((digit, pos) => {
      const OFFSET = THIRD * INDEX - (CW * DIGITS.length / 2) + (this.PIXEL / 2) + pos * CW;

      context.drawImage(
        this.CWD[digit], // canvas to draw
        OFFSET, // offset from left
        20 // offset from top
      );
    });
  }
}

class Pong {
  constructor(params) {
    this.__params = params;

    this.initializeCanvas();
    this.resetBall();
    this.resetSticks("hard");

    this.track();
  }

  initializeCanvas() {
    this._canvas = document.createElement("canvas");
    this._canvas.width = (document.body.offsetWidth <= this.__params.maxFieldWidth ?
                          document.body.offsetWidth : this.__params.maxFieldWidth);
    this._canvas.height = this._canvas.width / this.__params.twimth;

    // styles
    this._canvas.style.borderTop = "1px solid #fff";
    this._canvas.style.borderBottom = "1px solid #fff";
    //

    document.body.appendChild(this._canvas);
    this._context = this._canvas.getContext("2d");
  }

  resetBall() {
    const centerX = this._canvas.width / 2;
    const centerY = this._canvas.height / 2;

    this.ball = null;
    this.ball = new Ball({
      size: this._canvas.width / 60,
      speed: 0,

      pos: {
        x: centerX,
        y: centerY,
      },
    });
  }

  resetSticks(type) {
    const centerY = this._canvas.height / 2;
      if (type == "hard") {
        this.sticks = null;
        this.sticks = [
          new Stick({
            pos: {
              x: this._canvas.width / 15,
              y: centerY,
            },

            size: {
              x: this._canvas.width / 30,
              y: this._canvas.height / 2.85,
            },

            vel: null,
            canvasWidth: this._canvas.width,
          }),

          new Stick({
            pos: {
              x: this._canvas.width - this._canvas.width / 15,
              y: centerY,
            },

            size: {
              x: this._canvas.width / 30,
              y: this._canvas.height / 2.85,
            },

            vel: {
              x: 0,
              y: this._canvas.width / 600 * this.__params.hardness * 100,
            },
            canvasWidth: this._canvas.width,
          }),
        ];
      } else if (type == "soft") {
        this.sticks[0].pos.x = this._canvas.width / 15;
        this.sticks[0].pos.y = centerY;
        this.sticks[1].pos.x = this._canvas.width - this._canvas.width / 15;
        this.sticks[1].pos.y = centerY;
      }
  }

  track() {
    let lastUpdated;

    let callback = (ms) => {
      if (lastUpdated) {
        this.update((ms - lastUpdated) / 1000);
      }

      lastUpdated = ms;
      requestAnimationFrame(callback);
    };

    callback();
  }

  update(dt) {
    this.ball.calcNewPos(dt);

    this.ball.reverseOnCollisionWithCanvasTopOrBottom(this._canvas);
    this.ball.reverseOnCollisionWithSticks(this.sticks);

    if (this.ball.checkCollisionWithCanvasSide(this._canvas, "left")) {
      this.sticks[1].score++;
      this.resetBall();
      this.resetSticks("soft");
    } else if (this.ball.checkCollisionWithCanvasSide(this._canvas, "right")) {
      this.sticks[0].score++;
      this.resetBall();
      this.resetSticks("soft");
    }
    
    this.sticks[1].calcNewPos(this._canvas.height, this.ball, dt);

    this.draw();
  }

  draw() {
    this._context.fillStyle = "#000";
    this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);

    this.ball.draw(this._context);

    this.sticks.forEach((stick, i) => {
      stick.draw(this._context);
      stick.drawScore(this._context, i);
    });
  }

  start() {
    if (this.ball.vel.speed === 0) {
      const START_SPEED = this._canvas.width / this.__params.twimts;
      this.ball.vel.x = START_SPEED * (Math.random() > 0.5 ? 1 : -1);
      this.ball.vel.y = START_SPEED * (Math.random() * 2 - 1);
      this.ball.vel.speed = START_SPEED;
    }
  }
}

document.querySelector("select").addEventListener("change", (event) => {
  event.preventDefault(); // avoids browser-reloading

  document.querySelectorAll("canvas").forEach((canvas) => {
    document.body.removeChild(canvas);
  });

  if (event.target.value == "null") {
    return false;
  }

  let pong = new Pong({
    maxFieldWidth: 1000,
    twimth: 1.5, // times width is more than height
    twimts: 2.4, // times width is more than speed
    hardness: event.target.value, // user choosed hardness via <select>
  });

  pong._canvas.addEventListener("click", (event) => {
    pong.start();
  });

  pong._canvas.addEventListener("mousemove", (event) => {
    pong.sticks[0].pos.y = event.offsetY;
  });
});
