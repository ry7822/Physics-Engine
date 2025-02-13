import { walls } from './mapfiles/map.js';

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
    this.friction = 0.4;

    this.angle = 0;

    this.image = new Image();
    this.image.src = "img/guy_fieri.png";
  }

  draw(ctx, cameraY) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2 - cameraY);
    ctx.rotate(this.angle);
    ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
    ctx.restore();
  }

  update() {

    this.vy += this.parent.gravity;

    this.y += this.vy;
    this.x += this.vx;

    this.check_for_collision_with_walls();

    if (this.y > this.parent.winheight - this.height) {
      this.y = this.parent.winheight - this.height;
      this.vy = -this.vy * this.elasticity;
      this.parent.move_up = true;
    } else {
      this.vy *= this.parent.air_resistance;
    }

    this.vx *= this.parent.air_resistance;
  }

  check_for_collision_with_walls() {
    for (const wall of this.parent.walls) {
      if (this.x < wall.x + wall.width && this.x + this.width > wall.x &&
          this.y < wall.y + wall.height && this.y + this.height > wall.y) {

        if (this.vx > 0 && this.x + this.width > wall.x && this.x < wall.x) {
          this.vx = -this.vx * this.elasticity;
          this.x = wall.x - this.width;
        } else if (this.vx < 0 && this.x < wall.x + wall.width && this.x + this.width > wall.x + wall.width) {
          this.vx = -this.vx * this.elasticity;
          this.x = wall.x + wall.width;
        }

        if (this.vy > 0 && this.y + this.height > wall.y && this.y < wall.y) {
          this.vy = -this.vy * this.elasticity;
          this.y = wall.y - this.height;
        } else if (this.vy < 0 && this.y < wall.y + wall.height && this.y + this.height > wall.y + wall.height) {
          this.vy = -this.vy * this.elasticity;
          this.y = wall.y + wall.height;
        }

        // Apply friction to the opposite velocity component
        this.vx *= (1 - (this.friction / 2));
        this.vy *= (1 - (this.friction / 2));
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

    this.players = [new Block(375, 0, 50, 50, this)];
    this.cameraY = 0;

    this.walls = walls.map(wall => new Wall(wall.x, wall.y, wall.width, wall.height, wall.imageSrc));

    this.init();
  }

  init() {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e))
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    this.run();
  }

  onKeyDown(e) {
    if (e.key === 'Escape') {
      this.open_settings_window();
    }

    const player = this.players[0];
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
  constructor(x, y, width, height, imageSrc="img/missing_texture.png") {
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