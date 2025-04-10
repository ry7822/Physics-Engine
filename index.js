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
  }

  draw(ctx, cameraY) {
    if (Game.isPressed) {
      ctx.fillStyle = "red";
      if (this.direction === 'left') {
        ctx.fillRect(this.x - 10, this.y - cameraY, 10, 10);
      } else {
        ctx.fillRect(this.x + this.width, this.y - cameraY, 10, 10);
      }

      ctx.fillRect(this.x + (10 * this.direction), this.y - cameraY, 10, 10)
    }

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

    this.players = [new Block(375, 200, 20, 20, this)];
    this.cameraY = 0;

    this.walls = [];

    this.loadWalls().then(() => {
        this.init();
    });

    this.onMouseDown = this.onMouseDown.bind(this);
    this.mouseMoveHandler = this.mouseMoveHandler.bind(this);
    this.lastMouseX = 0;
    this.mouseSpeedX = 0;
    this.startTime = 0;
    this.isPressed = false;

    this.firstMousePos = null;
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

  mouseMoveHandler(e) {
    let currentPos = e.clientX;
    let player = this.players[0];
    if (this.isPressed) {
      if (e.clientX < this.firstMousePos) {
        player.direction = 'left';
        if (this.lastMouseX < currentPos) {
          this.startTime = performance.now();
          console.log("Start time: " + this.startTime);
        }
        if (this.lastMouseX > currentPos) {
            console.log("Stopped recording")
          this.mouseSpeedX = Math.abs(currentPos - this.lastMouseX) / (performance.now() - this.startTime);
          console.log("Mouse speed: ", this.mouseSpeedX);
          player.vx = -this.mouseSpeedX * 10;
          player.vy = -this.mouseSpeedX / 0.5 * 10;
          console.log("Accelerate right: ", this.mouseSpeedX);
          this.isPressed = false;
        }

      } else {
        player.direction = 'right';
      }

      this.lastMouseX = currentPos;
    }


  }

  onMouseDown(e) {

    // If !isPressed:
    // Get mouse position
    // Check in which direction the mouse is moving (aka if the mouse is to the left of original position, the sprite should be to the left, and it should check for speed to the right and vice versa)
    // If the mouse starts moving towards original position (e.clientX is greater/less than lastMouseX), record the time. If the mouse starts moving away again, nullify time.
    // When the mouse reaches original position, record time again and get deltatime and deltaposition. Divide dPos by dTime to get speed.
    // Accelerate the sprite in the direction of the mouse movement with the speed calculated above.
    // isPressed = false
    if (!this.isPressed) {
      this.firstMousePos = e.clientX;
    }
    this.isPressed = !this.isPressed;
  }

  onKeyDown(e) {
    if (e.key === 'Escape') {
      this.open_settings_window();
    }

    const player = this.players[0];

    // Only for testing purposes [REMOVE]
    if (e.key === 'a' && Math.abs(player.vx) < 0.05 && Math.abs(player.vy) < 0.5) {
      this.players[0].vy -= 30;
      this.players[0].vx -= 16;
    } else if (e.key === 'd' && Math.abs(player.vx) < 0.05 && Math.abs(player.vy) < 0.5) {
      this.players[0].vy -= 30;
      this.players[0].vx += 16;
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
    const loop = () => {
      if (this.done) return;

      this.ctx.clearRect(0, 0, this.winwidth, this.winheight);

      // Update cameraY based on the player's y-position
      const player = this.players[0];
      const targetCameraY = player.y - this.winheight / 2;
      this.cameraY += (targetCameraY - this.cameraY) * 0.1;

      if (this.move_up) {
        for (const player of this.players) {
          player.y -= 0.01;
        }
        this.move_up = false;
      }

      for (const wall of this.walls) {
        wall.draw(this.ctx, this.cameraY);
      }

      for (const player of this.players) {
        player.update();
        player.draw(this.ctx, this.cameraY);
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