import * as React from "react";

interface Laser {
  // from the nose of the ship
  x: number;
  y: number;

  xv: number;
  yv: number;

  dist: number;
  explodeTime: number;
}

interface Ship {
  centreX: number;
  centreY: number;

  angleInRadians: number; // convert to radians
  radius: number;

  blinkNum: number;
  blinkTime: number;

  canShoot: boolean;
  dead: boolean;
  explodeTime: number;
  lasers: Laser[];

  rotationInRadians: number;

  thrusting: boolean;
  thrust: { x: number; y: number };
}

export interface GameProps {
  width: number;
  height: number;
}

export interface GameState {
  levelIndex: number;

  ship: Ship;
}

const FireKeyCode = 32; // Space
const RotateLeftKeyCode = 37; // Left Arrow
const RotateRightKeyCode = 39; // Right Arrow
const ThrustKeyCode = 38; // Up Arrow

class Game extends React.Component<GameProps, GameState> {
  public state: GameState;

  private FPS: number = 60; // frames per second
  private TEXT_SIZE: number = 40;

  private FRICTION: number = 0.7; // friction coefficient of space (0 = no friction, 1 = lots of friction)

  private SHIP_SIZE: number = 30;
  private SHIP_THRUST: number = 5; // acceleration of the ship in pixels per second per second
  // private SHIP_TURN_SPD = 720; // turn speed in degrees per second
  private SHIP_TURN_SPEED_DEGREES_SEC: number = 150; // turn speed in degrees per second

  private SHIP_BLINK_DUR: number = 0.1; // duration in seconds of a single blink during ship's invisibility
  // private SHIP_EXPLODE_DUR: number  = 0.3; // duration of the ship's explosion in seconds
  private SHIP_INV_DUR: number = 3; // duration of the ship's invisibility in seconds

  private LASER_DISTANCE: number = 0.6; // max distance laser can travel as fraction of screen width
  // private LASER_EXPLODE_DURATION_SEC: number = 0.1; // duration of the lasers' explosion in seconds
  private LASER_MAX_COUNT: number = 10; // maximum number of lasers on screen at once
  private LASER_SPEED_PX_SEC: number = 500; // speed of lasers in pixels per second

  private gameCanvas: HTMLCanvasElement | null;

  // private gameCanvasRefObject: React.RefObject<HTMLCanvasElement>;
  private gameCanvasRefHandlerFn: (element: HTMLCanvasElement) => void;

  constructor(props: GameProps) {
    super(props);

    // this.gameCanvasRefObject = React.createRef();

    this.gameCanvas = null;
    this.gameCanvasRefHandlerFn = (element: HTMLCanvasElement) => {
      this.gameCanvas = element;
    };

    const { width, height } = props;

    this.state = {
      levelIndex: 0,

      ship: {
        // Centre of canvas
        centreX: width / 2,
        centreY: height / 2,

        //  0 degress is " 3 o'clock"
        // 90 degrees is "12 o'clock"
        angleInRadians: this.degreesToRadians(90),
        radius: this.SHIP_SIZE / 2,

        blinkNum: Math.ceil(this.SHIP_INV_DUR / this.SHIP_BLINK_DUR),
        blinkTime: Math.ceil(this.SHIP_BLINK_DUR * this.FPS),

        canShoot: true,
        dead: false,
        explodeTime: 0,
        lasers: [],
        rotationInRadians: 0,
        thrusting: false,

        thrust: {
          x: 0,
          y: 0
        }
      }
    };
  }

  public degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  public componentDidMount() {
    // document.addEventListener("keydown", this.keyDown);
    // document.addEventListener("keyup", this.keyUp);

    // set up the game loop
    setInterval(() => this.updateGameStatus(), 1000 / this.FPS);
    // this.updateGameStatus();
  }

  public componentDidUpdate() {
    this.updateCanvas();
  }

  public updateGameStatus() {
    const { width, height } = this.props;
    const nextState = { ...this.state };

    // handle Ship
    const { ship } = nextState;

    // rotate the ship
    ship.angleInRadians += ship.rotationInRadians;

    // move the ship
    ship.centreX += ship.thrust.x;
    ship.centreY += ship.thrust.y;

    // handle edge of screen
    if (ship.centreX < 0 - ship.radius) {
      ship.centreX = width + ship.radius;
    } else if (ship.centreX > width + ship.radius) {
      ship.centreX = 0 - ship.radius;
    }
    if (ship.centreY < 0 - ship.radius) {
      ship.centreY = height + ship.radius;
    } else if (ship.centreY > height + ship.radius) {
      ship.centreY = 0 - ship.radius;
    }

    // thrust the ship
    const blinkOn = ship.blinkNum % 2 === 0;
    const exploding = ship.explodeTime > 0;

    if (ship.thrusting && !ship.dead) {
      ship.thrust.x +=
        (this.SHIP_THRUST * Math.cos(ship.angleInRadians)) / this.FPS;
      ship.thrust.y -=
        (this.SHIP_THRUST * Math.sin(ship.angleInRadians)) / this.FPS;
      // fxThrust.play();

      // draw the thruster
      if (!exploding && blinkOn) {
        // ctx.fillStyle = "red";
        // ctx.strokeStyle = "yellow";
        // ctx.lineWidth = SHIP_SIZE / 10;
        // ctx.beginPath();
        // ctx.moveTo(
        //   // rear left
        //   ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
        //   ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
        // );
        // ctx.lineTo(
        //   // rear centre (behind the ship)
        //   ship.x - ((ship.r * 5) / 3) * Math.cos(ship.a),
        //   ship.y + ((ship.r * 5) / 3) * Math.sin(ship.a)
        // );
        // ctx.lineTo(
        //   // rear right
        //   ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
        //   ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
        // );
        // ctx.closePath();
        // ctx.fill();
        // ctx.stroke();
      }
    } else {
      // apply friction (slow the ship down when not thrusting)
      ship.thrust.x -= (this.FRICTION * ship.thrust.x) / this.FPS;
      ship.thrust.y -= (this.FRICTION * ship.thrust.y) / this.FPS;
      // fxThrust.stop();
    }

    // move the lasers
    for (let i = ship.lasers.length - 1; i >= 0; i--) {
      // check distance travelled
      if (ship.lasers[i].dist > this.LASER_DISTANCE * width) {
        ship.lasers.splice(i, 1);
        continue;
      }

      // handle the explosion
      if (ship.lasers[i].explodeTime > 0) {
        ship.lasers[i].explodeTime--;

        // destroy the laser after the duration is up
        if (ship.lasers[i].explodeTime === 0) {
          ship.lasers.splice(i, 1);
          continue;
        }
      } else {
        // move the laser
        ship.lasers[i].x += ship.lasers[i].xv;
        ship.lasers[i].y += ship.lasers[i].yv;

        // calculate the distance travelled
        ship.lasers[i].dist += Math.sqrt(
          Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2)
        );
      }

      // handle edge of screen
      if (ship.lasers[i].x < 0) {
        ship.lasers[i].x = width;
      } else if (ship.lasers[i].x > width) {
        ship.lasers[i].x = 0;
      }
      if (ship.lasers[i].y < 0) {
        ship.lasers[i].y = height;
      } else if (ship.lasers[i].y > height) {
        ship.lasers[i].y = 0;
      }
    }

    this.setState(nextState);
  }

  public updateCanvas() {
    // if (!this.refs) {
    //   return;
    // }

    // const canvas = this.refs.canvas as HTMLCanvasElement;

    // if (!this.gameCanvasRefObject) {
    //   return;
    // }

    // const canvas = this.gameCanvasRefObject.current;

    if (!this.gameCanvas) {
      return;
    }

    const ctx = this.gameCanvas.getContext("2d");

    if (ctx == null) {
      return;
    }

    // Draw background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);

    // draw the high score
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = this.TEXT_SIZE * 0.75 + "px dejavu sans mono";

    // ctx.fillText("BEST " + scoreHigh, canv.width / 2, SHIP_SIZE);
    ctx.fillText(
      `Level: ${this.state.levelIndex + 1}`,
      this.gameCanvas.width / 2,
      this.SHIP_SIZE
    );

    ctx.fillText(
      `Is Thrusting: ${this.state.ship.thrusting}`,
      this.gameCanvas.width / 2,
      this.SHIP_SIZE * 2
    );

    ctx.fillText(
      `Rotation: ${this.state.ship.rotationInRadians}`,
      this.gameCanvas.width / 2,
      this.SHIP_SIZE * 3
    );

    // Handle Ship
    const { ship } = this.state;

    // rotate the ship
    // ship.angleInRadians += ship.rotationInRadians;

    const blinkOn = ship.blinkNum % 2 === 0;
    const exploding = ship.explodeTime > 0;

    if (ship.thrusting && !ship.dead) {
      // fxThrust.play();

      // draw the thruster
      if (!exploding && blinkOn) {
        ctx.fillStyle = "red";
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = this.SHIP_SIZE / 10;
        ctx.beginPath();
        ctx.moveTo(
          // rear left
          ship.centreX -
            ship.radius *
              ((2 / 3) * Math.cos(ship.angleInRadians) +
                0.5 * Math.sin(ship.angleInRadians)),
          ship.centreY +
            ship.radius *
              ((2 / 3) * Math.sin(ship.angleInRadians) -
                0.5 * Math.cos(ship.angleInRadians))
        );
        ctx.lineTo(
          // rear centre (behind the ship)
          ship.centreX -
            ((ship.radius * 5) / 3) * Math.cos(ship.angleInRadians),
          ship.centreY + ((ship.radius * 5) / 3) * Math.sin(ship.angleInRadians)
        );
        ctx.lineTo(
          // rear right
          ship.centreX -
            ship.radius *
              ((2 / 3) * Math.cos(ship.angleInRadians) -
                0.5 * Math.sin(ship.angleInRadians)),
          ship.centreY +
            ship.radius *
              ((2 / 3) * Math.sin(ship.angleInRadians) +
                0.5 * Math.cos(ship.angleInRadians))
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else {
      // apply friction (slow the ship down when not thrusting)
      // fxThrust.stop();
    }

    this.drawShip(ctx, ship.centreX, ship.centreY, ship.angleInRadians);

    // draw the lasers
    for (let i = 0; i < ship.lasers.length; i++) {
      if (ship.lasers[i].explodeTime === 0) {
        ctx.fillStyle = "salmon";
        ctx.beginPath();
        ctx.arc(
          ship.lasers[i].x,
          ship.lasers[i].y,
          this.SHIP_SIZE / 15,
          0,
          Math.PI * 2,
          false
        );
        ctx.fill();
      } else {
        // draw the eplosion
        ctx.fillStyle = "orangered";
        ctx.beginPath();
        ctx.arc(
          ship.lasers[i].x,
          ship.lasers[i].y,
          ship.radius * 0.75,
          0,
          Math.PI * 2,
          false
        );
        ctx.fill();
        ctx.fillStyle = "salmon";
        ctx.beginPath();
        ctx.arc(
          ship.lasers[i].x,
          ship.lasers[i].y,
          ship.radius * 0.5,
          0,
          Math.PI * 2,
          false
        );
        ctx.fill();

        ctx.fillStyle = "pink";
        ctx.beginPath();
        ctx.arc(
          ship.lasers[i].x,
          ship.lasers[i].y,
          ship.radius * 0.25,
          0,
          Math.PI * 2,
          false
        );
        ctx.fill();
      }
    }

    // tslint:disable-next-line:no-console
    // console.log("updateCanvas: End");
  }

  public render() {
    const { width, height } = this.props;

    return (
      // tslint:disable-next-line:jsx-no-string-ref
      <canvas
        // Allow key handlers to work
        tabIndex={1}
        // tslint:disable-next-line:jsx-no-string-ref
        // ref="canvas"
        ref={this.gameCanvasRefHandlerFn}
        width={width}
        height={height}
        // tslint:disable-next-line:jsx-no-lambda
        onKeyDown={e => this.handleKeyDown(e)}
        // tslint:disable-next-line:jsx-no-lambda
        onKeyUp={e => this.handleKeyUp(e)}
      />
    );
  }

  public shootLaser = (ship: Ship) => {
    // const nextState = { ...this.state };

    // const { ship } = nextState;
    // const nextShip: Ship = { ...ship };

    // nextShip.lasers = [...ship.lasers];

    // create the laser object
    if (ship.canShoot && ship.lasers.length < this.LASER_MAX_COUNT) {
      ship.lasers.push({
        // from the nose of the ship
        x: ship.centreX + (4 / 3) * ship.radius * Math.cos(ship.angleInRadians),
        y: ship.centreY - (4 / 3) * ship.radius * Math.sin(ship.angleInRadians),

        xv:
          (this.LASER_SPEED_PX_SEC * Math.cos(ship.angleInRadians)) / this.FPS,
        yv:
          (-this.LASER_SPEED_PX_SEC * Math.sin(ship.angleInRadians)) / this.FPS,

        dist: 0,
        explodeTime: 0
      });

      // fxLaser.play();
    }

    // prevent further shooting
    ship.canShoot = false;
  };

  public handleKeyDown = (ev: React.KeyboardEvent<HTMLCanvasElement>): void => {
    const { ship } = this.state;

    if (ship.dead) {
      return;
    }

    const nextShip = { ...ship };

    switch (ev.keyCode) {
      case FireKeyCode: // space bar (shoot laser)
        this.shootLaser(nextShip);
        break;

      case RotateLeftKeyCode: // left arrow (rotate ship left)
        nextShip.rotationInRadians =
          ((this.SHIP_TURN_SPEED_DEGREES_SEC / 180) * Math.PI) / this.FPS;
        break;

      case RotateRightKeyCode: // right arrow (rotate ship right)
        nextShip.rotationInRadians =
          ((-this.SHIP_TURN_SPEED_DEGREES_SEC / 180) * Math.PI) / this.FPS;
        break;

      case ThrustKeyCode: // up arrow (thrust the ship forward)
        nextShip.thrusting = true;
        break;
    }

    this.setState({ levelIndex: 0, ship: nextShip });
  };

  public handleKeyUp = (ev: React.KeyboardEvent<HTMLCanvasElement>): void => {
    const { ship } = this.state;

    if (ship.dead) {
      return;
    }

    // const nextShip = this.state.ship
    const nextShip = { ...ship };

    switch (ev.keyCode) {
      case FireKeyCode: // space bar (allow shooting again)
        nextShip.canShoot = true;
        break;

      case RotateLeftKeyCode: // left arrow (stop rotating left)
        nextShip.rotationInRadians = 0;
        break;

      case RotateRightKeyCode: // right arrow (stop rotating right)
        nextShip.rotationInRadians = 0;
        break;

      case ThrustKeyCode: // up arrow (stop thrusting)
        nextShip.thrusting = false;
        break;
    }

    this.setState({ levelIndex: 0, ship: nextShip });
  };

  private drawShip = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    a: number,
    colour = "purple"
  ) => {
    if (ctx === null) {
      return;
    }

    const { ship } = this.state;

    ctx.strokeStyle = colour;
    ctx.lineWidth = this.SHIP_SIZE / 20;

    ctx.beginPath();

    ctx.moveTo(
      // nose of the ship
      x + (4 / 3) * ship.radius * Math.cos(a),
      y - (4 / 3) * ship.radius * Math.sin(a)
    );

    ctx.lineTo(
      // rear left
      x - ship.radius * ((2 / 3) * Math.cos(a) + Math.sin(a)),
      y + ship.radius * ((2 / 3) * Math.sin(a) - Math.cos(a))
    );

    ctx.lineTo(
      // rear right
      x - ship.radius * ((2 / 3) * Math.cos(a) - Math.sin(a)),
      y + ship.radius * ((2 / 3) * Math.sin(a) + Math.cos(a))
    );

    ctx.strokeStyle = colour;

    ctx.closePath();
    ctx.stroke();

    // Draw inner triangle
    ctx.strokeStyle = colour;
    ctx.lineWidth = this.SHIP_SIZE / 20;

    ctx.beginPath();

    ctx.moveTo(
      // nose of the ship
      x + (4 / 3) * ship.radius * Math.cos(a),
      y - (4 / 3) * ship.radius * Math.sin(a)
    );

    ctx.lineTo(
      // rear left
      x - ship.radius * ((2 / 3) * Math.cos(a) + Math.sin(a)) * 0.6,
      y + ship.radius * ((2 / 3) * Math.sin(a) - Math.cos(a)) * 0.6
    );

    ctx.lineTo(
      // rear right
      x - ship.radius * ((2 / 3) * Math.cos(a) - Math.sin(a)) * 0.6,
      y + ship.radius * ((2 / 3) * Math.sin(a) + Math.cos(a)) * 0.6
    );

    ctx.strokeStyle = colour;

    ctx.closePath();
    ctx.stroke();
  };
}

export default Game;
