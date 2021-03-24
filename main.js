const box$ = document.getElementById("box");

const SLOPE_DAMPING_RATE = 0.1;
const MOMENTUM_STRENGTH = 0.2;

let is_down = false;
let raf_start_timestamp = null;
let raf_id = 0;
let raf_last_tracking_timestamp = 0;
let raf_last_momentum_move_timestamp = 0;
const mouse_down_pos = { x: 0, y: 0 };
const mouse_current_pos = { x: 0, y: 0 };

const prev_shift_pos = { x: 0, y: 0 };
const current_shift_pos = { x: 0, y: 0 };
const last_current_shift_pos = { x: 0, y: 0 };

const slope = { x: 0, y: 0 };
const last_slope = { x: 0, y: 0 };
const is_momentum_move_end = { x: false, y: false };

const updateShiftPos = (e) => {
  mouse_current_pos.x = e.clientX;
  mouse_current_pos.y = e.clientY;
  current_shift_pos.x = last_current_shift_pos.x + mouse_current_pos.x - mouse_down_pos.x;
  current_shift_pos.y = last_current_shift_pos.y + mouse_current_pos.y - mouse_down_pos.y;
}

const updateLastShiftPos = () => {
  last_current_shift_pos.x = current_shift_pos.x;
  last_current_shift_pos.y = current_shift_pos.y;
}

const updateSlope = (dt) => {
  slope.x = (current_shift_pos.x - prev_shift_pos.x) / dt;
  slope.y = (current_shift_pos.y - prev_shift_pos.y) / dt;
}

const trackingSlope = (timestamp) => {
  if (!raf_start_timestamp) {
    raf_start_timestamp = raf_last_tracking_timestamp = timestamp;
  }
  const dt = (timestamp - raf_last_tracking_timestamp);
  updateSlope(dt);
  raf_last_tracking_timestamp = timestamp;
  Object.assign(prev_shift_pos, current_shift_pos);
  if (is_down) {
    raf_id = window.requestAnimationFrame(trackingSlope);
  }
}


const dampeningSlope = (is_positive_direction, target_slope, progress, target_coord) => {
  if (is_positive_direction) {
    if (target_slope[target_coord] > 0) {
      //damping slope until 0
      target_slope[target_coord] -= SLOPE_DAMPING_RATE;
      return false;
    } else {
      return true;
    }
  } else {
    if (target_slope[target_coord] < 0) {
      //damping slope until 0
      target_slope[target_coord] += SLOPE_DAMPING_RATE;
      return false;
    } else {
      return true;
    }
  }
}


const momentumMove = (timestamp) => {
  if (!raf_start_timestamp) {
    raf_start_timestamp = raf_last_momentum_move_timestamp = timestamp;
  }
  const progress = (timestamp - raf_start_timestamp) / 1000;
  const dt = (timestamp - raf_last_momentum_move_timestamp);
  is_momentum_move_end.x = dampeningSlope(last_slope.x > 0, slope, progress, "x");
  is_momentum_move_end.y = dampeningSlope(last_slope.y > 0, slope, progress, "y");
  // is_momentum_move_end.y = dampeningSlope(last_slope.y > 0, slope);

  current_shift_pos.x += slope.x * dt * MOMENTUM_STRENGTH;
  box$.style.transform = `translate(${current_shift_pos.x}px)`;

  raf_last_momentum_move_timestamp = timestamp;
  if (!is_momentum_move_end.x || !is_momentum_move_end.y) {
    raf_id = window.requestAnimationFrame(momentumMove);
  } else {
    updateLastShiftPos();
  }

}

box$.addEventListener("mousedown", (e) => {
  is_down = true;
  mouse_down_pos.x = e.clientX;
  mouse_down_pos.y = e.clientY;
  is_momentum_move_end.x = false;
  is_momentum_move_end.y = false;
  window.cancelAnimationFrame(raf_id);
  updateLastShiftPos();
  raf_id = window.requestAnimationFrame(trackingSlope);
})

document.addEventListener("mousemove", (e) => {
  if (is_down) {
    updateShiftPos(e);
    box$.style.transform = `translate(${current_shift_pos.x}px)`;
  }
})

document.addEventListener("mouseup", (e) => {
  is_down = false;
  raf_start_timestamp = null;
  Object.assign(last_slope, slope);
  window.cancelAnimationFrame(raf_id);
  raf_id = window.requestAnimationFrame(momentumMove);
  updateLastShiftPos();
})

