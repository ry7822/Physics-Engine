class Block {
  constructor(x, y, width, height, parent = null) {
    this.parent = parent;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.elasticity = 0.65;
    this.friction = 0.8;
    this.direction = 1;

    this.image = new Image();
    this.image.src = "sprite/guy_fieri.png";
    this.man = new Image();
    this.man.src = "images/man.gif";
    this.club = new Image();
    this.club.src = "images/golfing.gif";
    // Placeholder for the animation logic

    this.startTime = null;
    this.position = null;
  }

  draw(ctx, cameraY) {
    const timer = 100;

    if (Math.abs(this.parent.player.vx) < 0.1 && Math.abs(this.parent.player.vy) < 1) {
      if (this.startTime === null) {
        this.startTime = performance.now();
      } else if (performance.now() - this.startTime >= timer) {

        this.position = Math.min(4*Math.PI/3, this.parent.distance);

        if (this.direction === 'left') {
          // Minus the width of the block to avoid drawing inside the sprite, this is not necessary when the placeholder is removed.
          ctx.drawImage(this.man, this.x, this.y - cameraY);
        } else {
          ctx.drawImage(this.man, this.x, this.y - cameraY);
        }
      }
    } else {this.startTime = null;}

    // Draw the hitbox outline for testing
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y - cameraY, this.width, this.height);

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2 - cameraY);
    ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
    ctx.restore();
  }

  update() {
    const prevX = this.x;
    const prevY = this.y;

    this.vy += this.parent.gravity;

    if (Math.abs(this.vy) > 30) {
      this.vy = 30 * Math.sign(this.vy);
    }

    const dx = this.vx;
    const dy = this.vy;

    // Perform continuous collision detection
    this.continuous_collision_detection(prevX, prevY, dx, dy);

    this.vx *= this.parent.air_resistance;
    this.vy *= this.parent.air_resistance;
  }

  continuous_collision_detection(prevX, prevY, dx, dy) {
    const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))); // Number of steps based on velocity
    const stepX = dx / steps;
    const stepY = dy / steps;

    for (let i = 1; i <= steps; i++) {
      const nextX = prevX + stepX * i;
      const nextY = prevY + stepY * i;

      this.x = nextX;
      this.y = nextY;

      if (this.check_for_collision_with_walls()) {
        break; // Stop further movement if a collision is detected
      }
    }
  }

  check_for_collision_with_walls() {
    let collided = false;

    if (this.check_for_top_collision()) {collided = true; console.log("top collision");}
    if (this.check_for_bottom_collision()) {collided = true; console.log("bottom collision");}
    if (this.check_for_left_collision()) {collided = true; console.log("left collision");}
    if (this.check_for_right_collision()) {collided = true; console.log("right collision");}

    return collided;
  }

  check_for_top_collision() {
    for (const wall of this.parent.walls) {
        // Check if there's enough horizontal overlap first, prevents false positives
        const horizontalOverlap = 
            this.x + this.width > wall.x + 1 && // Add a small threshold
            this.x < wall.x + wall.width - 1;    // Add a small threshold
        
        if (horizontalOverlap && 
            wall.y + wall.height >= this.y && 
            wall.y + (wall.height / 2) <= this.y) {
            
            this.y = wall.y + wall.height + 0.01;
            this.vy = -this.vy * this.elasticity;
            this.vx *= this.friction;
            if (wall.image.src.includes("images/tile_234.gif")) {
              // Win condition
              this.parent.done = true;
              window.alert("Do you feel happy about yourself?");
            }
            return true;
        }
    }
    return false;
}

  check_for_bottom_collision() {
    for (const wall of this.parent.walls) {
        // Check if there's enough horizontal overlap first, prevents false positives
        const horizontalOverlap =
            this.x + this.width > wall.x + 1 && // Add a small threshold
            this.x < wall.x + wall.width - 1;    // Add a small threshold

        if (horizontalOverlap &&
            wall.y <= this.y + this.height &&
            wall.y + (wall.height / 2) >= this.y + this.height) {

            this.y = wall.y - this.height - 0.01;
            this.vy = -this.vy * this.elasticity;
            this.vx *= this.friction;
            if (wall.image.src.includes("images/tile_234.gif")) {
              // Win condition
              this.parent.done = true;
              window.alert("Do you feel happy about yourself?");
            }
            return true;
        }
    }
    return false;
}

  check_for_left_collision() {
    for (const wall of this.parent.walls) {
        // Check if there's enough vertical overlap first, prevents false positives
        const verticalOverlap = 
            this.y + this.height > wall.y + 1 && // Add a small threshold
            this.y < wall.y + wall.height - 1;    // Add a small threshold
        
        if (verticalOverlap && 
            wall.x + wall.width >= this.x && 
            wall.x <= this.x) {
            
            this.x = wall.x + wall.width + 0.1;
            this.vx = Math.max(-this.vx * this.elasticity, -5);
            this.vy *= this.friction;
            if (wall.image.src.includes("images/tile_234.gif")) {
              // Win condition
              this.parent.done = true;
              window.alert("Do you feel happy about yourself?");
            }
            return true;
        }

        if (this.x <= 0) {
            this.x = 0;
            this.vx = Math.max(-this.vx * this.elasticity, -5);
            this.vy *= this.friction;
            return true;
        }
    }
    return false;
}

  check_for_right_collision() {
    for (const wall of this.parent.walls) {
        // Check if there's enough vertical overlap first, prevents false positives
        const verticalOverlap = 
            this.y + this.height > wall.y + 1 && // Add a small threshold
            this.y < wall.y + wall.height - 1;    // Add a small threshold
        
        if (verticalOverlap && 
            wall.x <= this.x + this.width && 
            wall.x + wall.width >= this.x + this.width) {
            
            this.x = wall.x - this.width - 0.1;
            this.vx = Math.min(-this.vx * this.elasticity, 5);
            this.vy *= this.friction;
            console.log(wall.image.src);
            if (wall.image.src.includes("images/tile_234.gif")) {
              // Win condition
              this.parent.done = true;
              window.alert("Do you feel happy about yourself?");
            }
            return true;
        }

        if (this.x + this.width >= this.parent.winwidth) {
            this.x = this.parent.winwidth - this.width;
            this.vx = Math.min(-this.vx * this.elasticity, 5);
            this.vy *= this.friction;
            return true;
        }
    }
    return false;
}
}

class Game {
  constructor() {
    this.parent = parent;
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.winwidth = this.canvas.width;
    this.winheight = this.canvas.height;
    this.done = false;
    this.move_up = false;

    this.gravity = 0.5;
    this.air_resistance = 0.995;

    this.player = new Block(50, -1400, 20, 20, this);
    this.cameraY = 0;

    this.walls = [];

    this.loadWalls().then(() => {
        this.init();
    });

    this.onMouseDown = this.onMouseDown.bind(this);
    this.mouseMoveHandler = this.mouseMoveHandler.bind(this);
    this.isPressed = false;
    this.startPos = null;
    this.distance = null;

    this.mouseMovements = [];
    this.movementHistoryDuration = 100; // in milliseconds
  }

  async loadWalls() {
    const response = await fetch('mapfiles/map.json');
    const wallsData = await response.json();
    this.walls = wallsData.map(wall => new Wall(wall.x, wall.y, wall.width, wall.height, wall.imageSrc));
  }

  init() {
    window.addEventListener("mousedown", (e) => this.onMouseDown(e));
    window.addEventListener("mousemove", this.mouseMoveHandler);

    this.run();
  }

  isMoving() {
    return Math.abs(this.player.vx) > 0.05 || Math.abs(this.player.vy) > 0.5;
  }

  mouseMoveHandler(e) {
    // Store current movement with a timestamp
    this.mouseMovements.push({
      movementX: e.movementX,
      timestamp: performance.now()
    });

    // Remove old movements (older than 500 ms)
    const currentTime = performance.now();
    this.mouseMovements = this.mouseMovements.filter(
        movement => currentTime - movement.timestamp <= this.movementHistoryDuration
    );

    // Calculate averaged movement
    let averageMovementX = 0;
    if (this.mouseMovements.length > 0) {
      averageMovementX = this.mouseMovements.reduce((sum, movement) => sum + movement.movementX, 0)
          / this.mouseMovements.length;
    }

    if (this.isPressed) {
      this.distance = Math.abs(e.clientX - this.canvas.getBoundingClientRect().left - this.startPos);
    }

    if (this.isPressed && !this.isMoving()) {
      if (averageMovementX >= 10) {
        this.parent.fillStyle = "blue";
      }

      if (this.player.direction === 'left') {
        // Use averaged movement for position calculation
        if (e.clientX - this.canvas.getBoundingClientRect().left > this.startPos) {
          this.player.vx = (e.clientX - this.canvas.getBoundingClientRect().left - this.startPos) * 0.5;
          this.player.vy = (this.startPos - (e.clientX - this.canvas.getBoundingClientRect().left)) * -0.75;
          this.isPressed = false;
        }
      } else {
        if (e.clientX - this.canvas.getBoundingClientRect().left < this.startPos) {
          this.player.vx = (this.startPos - (e.clientX - this.canvas.getBoundingClientRect().left)) * -0.5;
          this.player.vy = (this.startPos - (e.clientX - this.canvas.getBoundingClientRect().left)) * -0.75;
          this.isPressed = false;
        }
      }

      // Speed limit
      if (Math.abs(this.player.vx) > 15) {
        this.player.vx = 15 * Math.sign(this.player.vx);
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

  run() {

    const loop = () => {
      if (this.done) {this.player.x=590; this.player.y=550; this.player.vx=0; this.player.vy=0; this.done = false;}

      this.ctx.clearRect(0, 0, this.winwidth, this.winheight);

      // Update cameraY based on the player's y-position with interpolation
      const targetCameraY = this.player.y - this.winheight / 2;
      this.cameraY += (targetCameraY - this.cameraY) * 0.1;
      // Clamp cameraY to a maximum value (lowest point)
      this.cameraY = Math.min(350 - this.winheight / 2, this.cameraY);

      if (this.move_up) {
        this.player.y -= 0.01;
        this.move_up = false;
      }

      for (const wall of this.walls) {
        wall.draw(this.ctx, this.cameraY);
      }

      this.player.update();
      this.player.draw(this.ctx, this.cameraY);

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
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
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y - cameraY, this.width, this.height);

    ctx.drawImage(this.image, this.x, this.y - cameraY, this.width, this.height);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Game();
});