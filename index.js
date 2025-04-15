class Block {
  constructor(x, y, width, height, parent = null) {
    this.parent = parent;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.elasticity = 0.8;
    this.friction = 0.95;
    this.direction = 1;

    this.image = new Image();
    this.image.src = "sprite/guy_fieri.png";

    this.startTime = null;
  }

  draw(ctx, cameraY) {
    const timer = 100;

    if (Math.abs(this.parent.player.vx) < 0.1 && Math.abs(this.parent.player.vy) < 1) {
      if (this.startTime === null) {
        this.startTime = performance.now();
      } else if (performance.now() - this.startTime >= timer) {
        ctx.fillStyle = "red";
        if(this.parent.isPressed && this.parent.startPos !== null) {
          ctx.fillRect(this.parent.startPos - 2, 0, 4, 1000);
        }
        if (this.direction === 'left') {
          ctx.fillRect(this.x - 10, this.y - cameraY, 10, 10);
        } else {
          ctx.fillRect(this.x + this.width, this.y - cameraY, 10, 10);
        }
      }
    } else {this.startTime = null;}

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2 - cameraY);
    ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
    ctx.restore();
  }

  update() {

    this.vy += this.parent.gravity;

    this.y += this.vy;
    this.x += this.vx;

    this.check_for_collision_with_walls();

    this.vx *= this.parent.air_resistance;
    this.vy *= this.parent.air_resistance;
  }

  check_for_collision_with_walls() {
    this.check_for_top_collision();
    this.check_for_bottom_collision();
    this.check_for_left_collision();
    this.check_for_right_collision();
  }

  check_for_top_collision() {
    for (const wall of this.parent.walls) {
      if (((wall.x <= this.x && this.x <= wall.x + wall.width) || (wall.x <= this.x + this.width && this.x + this.width <= wall.x + wall.width)) && (wall.y + wall.height >= this.y && wall.y + (wall.height / 2) <= this.y)) {
        this.y = wall.y + wall.height + 0.01; // Add a small offset
        this.vy = -this.vy * this.elasticity;
        this.vx *= this.friction;
      }
    }
  }

  check_for_bottom_collision() {
    for (const wall of this.parent.walls) {
      if (((wall.x <= this.x && this.x <= wall.x + wall.width) || (wall.x <= this.x + this.width && this.x + this.width <= wall.x + wall.width)) && (wall.y <= this.y + this.height && wall.y + (wall.height / 2) >= this.y + this.height)) {
        this.y = wall.y - this.height - 0.01; // Add a small offset
        this.vy = -this.vy * this.elasticity;
        this.vx *= this.friction;
      }
    }
  }

  check_for_left_collision() {
    for (const wall of this.parent.walls) {
      if (((wall.y <= this.y && this.y <= wall.y + wall.height) || (wall.y <= this.y + this.height && this.y + this.height <= wall.y + wall.height)) && (wall.x + wall.width >= this.x && wall.x + (wall.width / 2) <= this.x)) {
        this.x = wall.x + wall.width + 0.01; // Add a small offset
        this.vx = -this.vx * this.elasticity;
        this.vy *= this.friction;
        console.log("collision left");
      }
    }
  }

  check_for_right_collision() {
    for (const wall of this.parent.walls) {
      if (((wall.y <= this.y && this.y <= wall.y + wall.height) || (wall.y <= this.y + this.height && this.y + this.height <= wall.y + wall.height)) && (wall.x <= this.x + this.width && wall.x + (wall.width / 2) >= this.x + this.width)) {
        this.x = wall.x - this.width - 0.01; // Add a small offset
        this.vx = -this.vx * this.elasticity;
        this.vy *= this.friction;
        console.log("collision right");
      }
    }
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.winwidth = this.canvas.width;
    this.winheight = this.canvas.height;
    this.done = false;
    this.move_up = false;

    this.gravity = 0.5;
    this.air_resistance = 0.995;
    this.elasticity = 0.6;

    this.player = new Block(375, 200, 20, 20, this);
    this.cameraY = 0;

    this.walls = [];

    this.loadWalls().then(() => {
        this.init();
    });

    this.onMouseDown = this.onMouseDown.bind(this);
    this.mouseMoveHandler = this.mouseMoveHandler.bind(this);
    this.isPressed = false;
    this.startPos = null;
  }

  async loadWalls() {
    const response = await fetch('mapfiles/map.json');
    const wallsData = await response.json();
    this.walls = wallsData.map(wall => new Wall(wall.x, wall.y, wall.width, wall.height, wall.imageSrc));
  }

  init() {
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
    window.addEventListener("mousedown", (e) => this.onMouseDown(e));
    window.addEventListener("mousemove", this.mouseMoveHandler);

    this.run();
  }

  isMoving() {
    return Math.abs(this.player.vx) > 0.05 || Math.abs(this.player.vy) > 0.5;
  }

  mouseMoveHandler(e) {
    if(this.isPressed && !this.isMoving()) {
      console.log(e.movementX);

      if (this.player.direction === 'left') {
        // Ignore movement to the left, register movement to the right, if the mouse reaches startPos, accelerate the player, isPressed = false
        if (e.clientX - this.canvas.getBoundingClientRect().left > this.startPos) {
          this.player.vx = (e.clientX - this.canvas.getBoundingClientRect().left - this.startPos) * 0.5;
          this.isPressed = false;
        }
      } else {
        // Ignore movement to the right, register movement to the left, if the mouse reaches startPos, accelerate the player, isPressed = false
        if (e.clientX - this.canvas.getBoundingClientRect().left < this.startPos) {
          this.player.vx = (this.startPos - (e.clientX - this.canvas.getBoundingClientRect().left)) * -0.5;
          this.isPressed = false;
        }
      }
      // Speed limit
      if (Math.abs(this.player.vx) > 10) {
        this.player.vx = 10 * Math.sign(this.player.vx);
      }
    }
  }

  onMouseDown(e) {
    if (!this.isMoving()) {
      if (!this.isPressed) {
        this.startPos = e.clientX - this.canvas.getBoundingClientRect().left;
        if (this.startPos < this.player.x + this.player.width / 2) {
          this.player.direction = 'left';
        } else {
          this.player.direction = 'right';
        }
      }
      this.isPressed = !this.isPressed;
    }
  }

  onKeyDown(e) {
    if (e.key === 'Escape') {
      this.open_settings_window();
    }

    // Only for testing purposes [REMOVE]
    if (e.key === 'a' && Math.abs(this.player.vx) < 0.05 && Math.abs(this.player.vy) < 0.5) {
      this.player.vy -= 30;
      this.player.vx -= 16;
    } else if (e.key === 'd' && Math.abs(this.player.vx) < 0.05 && Math.abs(this.player.vy) < 0.5) {
      this.player.vy -= 30;
      this.player.vx += 16;
    }
  }

  open_settings_window() {
    const settings_window = document.createElement('div');
    settings_window.style.position = 'absolute';
    settings_window.style.top = '50%';
    settings_window.style.left = '50%';
    settings_window.style.transform = 'translate(-50%, -50%)';
    settings_window.style.backgroundColor = 'white';
    settings_window.style.padding = '20px';
    settings_window.style.border = '1px solid black';
    document.body.appendChild(settings_window);

    const create_slider = (label, param, from, to, step) => {
      const container = document.createElement('div');
      container.style.marginBottom = '10px';

      const labelElement = document.createElement('label');
      labelElement.textContent = label;
      container.appendChild(labelElement);

      const input = document.createElement('input');
      input.type = 'range';
      input.min = from;
      input.max = to;
      input.step = step;
      input.value = this[param];
      input.addEventListener('input', (event) => {
        this[param] = parseFloat(event.target.value);
      });
      container.appendChild(input);

      settings_window.appendChild(container);
    };
    create_slider('Gravity', 'gravity', 0, 2, 0.01);
    create_slider('Friction', 'friction', 0, 1, 0.01);
    create_slider('Air Resistance', 'air_resistance', 0, 1, 0.001);
    create_slider('Elasticity', 'elasticity', 0, 1, 0.01);
  }

  run() {
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;
    let lastFrameTime = 0;

    const loop = (currentTime) => {
      if (this.done) return;

      const deltaTime = currentTime - lastFrameTime;

      if (deltaTime >= frameInterval) {
        lastFrameTime = currentTime;

        this.ctx.clearRect(0, 0, this.winwidth, this.winheight);

        // Update cameraY based on the player's y-position
        const targetCameraY = this.player.y - this.winheight / 2;
        this.cameraY += (targetCameraY - this.cameraY) * 0.1;

        if (this.move_up) {
          this.player.y -= 0.01;
          this.move_up = false;
        }

        for (const wall of this.walls) {
          wall.draw(this.ctx, this.cameraY);
        }

        this.player.update();
        this.player.draw(this.ctx, this.cameraY);
      }


      requestAnimationFrame(loop);
    };

    loop();
  }
}

class Wall {
  constructor(x, y, width, height, imageSrc="images/tile_1.gif") {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = new Image();
    this.image.src = imageSrc;
  }

  draw(ctx, cameraY) {
    ctx.drawImage(this.image, this.x, this.y - cameraY, this.width, this.height);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Game();
});