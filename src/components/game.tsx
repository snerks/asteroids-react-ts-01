import * as React from "react";

interface ILaser {
  // from the nose of the ship
  x: number;
  y: number;

  xv: number;
  yv: number;

  dist: number;
  explodeTime: number;
}

interface IShip {
  centreX: number;
  centreY: number;

  angleInRadians: number; // convert to radians
  radius: number;

  //   blinkNum: number;
  //   blinkTime: number;

  canShoot: boolean;
  dead: boolean;
  explodeTime: number;
  lasers: ILaser[];

  rotationInRadians: number;

  thrusting: boolean;
  thrust: { x: number; y: number };
}

// ts-lint:disable:interface-name
// tslint:disable-next-line:no-empty-interface
export interface IGameProps {
  width: number;
  height: number;
}

// tslint:disable-next-line:no-empty-interface
export interface IGameState {
  levelIndex: number;

  ship: IShip;
}

class Game extends React.Component<IGameProps, IGameState> {
  public state: IGameState;

  private FPS: number = 60; // frames per second
  private TEXT_SIZE: number = 40;
  private SHIP_SIZE: number = 30;

  // private SHIP_TURN_SPD = 720; // turn speed in degrees per second
  private SHIP_TURN_SPEED_DEGREES_SEC: number = 150; // turn speed in degrees per second

  constructor(props: IGameProps) {
    super(props);

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

        // blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
        // blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),

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
    // setInterval(this.updateCanvas(), 1000 / this.FPS);
    this.updateCanvas();
  }

  public componentDidUpdate() {
    this.updateCanvas();
  }

  public updateCanvas() {
    // tslint:disable-next-line:no-console
    const canvas = this.refs.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    if (ctx == null) {
      return;
    }

    // Draw background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw the high score
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = this.TEXT_SIZE * 0.75 + "px dejavu sans mono";

    // ctx.fillText("BEST " + scoreHigh, canv.width / 2, SHIP_SIZE);
    ctx.fillText(
      `Level: ${this.state.levelIndex + 1}`,
      canvas.width / 2,
      this.SHIP_SIZE
    );

    ctx.fillText(
      `Is Thrusting: ${this.state.ship.thrusting}`,
      canvas.width / 2,
      this.SHIP_SIZE * 2
    );

    ctx.fillText(
      `Rotation: ${this.state.ship.rotationInRadians}`,
      canvas.width / 2,
      this.SHIP_SIZE * 3
    );

    // Handle Ship
    const { ship } = this.state;

    // rotate the ship
    ship.angleInRadians += ship.rotationInRadians;

    this.drawShip(ctx, ship.centreX, ship.centreY, ship.angleInRadians);

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
        ref="canvas"
        width={width}
        height={height}
        // tslint:disable-next-line:jsx-no-lambda
        onKeyDown={e => this.handleKeyDown(e)}
        // tslint:disable-next-line:jsx-no-lambda
        onKeyUp={e => this.handleKeyUp(e)}
      />
    );
  }

  public handleKeyDown = (ev: React.KeyboardEvent<HTMLCanvasElement>): void => {
    const { ship } = this.state;

    if (ship.dead) {
      return;
    }

    const nextShip = { ...ship };

    switch (ev.keyCode) {
      case 32: // space bar (shoot laser)
        // shootLaser();
        break;
      case 37: // left arrow (rotate ship left)
        nextShip.rotationInRadians =
          ((this.SHIP_TURN_SPEED_DEGREES_SEC / 180) * Math.PI) / this.FPS;
        break;
      case 38: // up arrow (thrust the ship forward)
        nextShip.thrusting = true;
        break;
      case 39: // right arrow (rotate ship right)
        nextShip.rotationInRadians =
          ((-this.SHIP_TURN_SPEED_DEGREES_SEC / 180) * Math.PI) / this.FPS;
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
      case 32: // space bar (allow shooting again)
        nextShip.canShoot = true;
        break;
      case 37: // left arrow (stop rotating left)
        nextShip.rotationInRadians = 0;
        break;
      case 38: // up arrow (stop thrusting)
        nextShip.thrusting = false;
        break;
      case 39: // right arrow (stop rotating right)
        nextShip.rotationInRadians = 0;
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
