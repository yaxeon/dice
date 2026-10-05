export const REST_ROTATION = Object.freeze({ x: 0, y: 0, z: 0 });
const modulo = (value, size) => ((value % size) + size) % size;

export function settleAxis(current, rest, direction, minimumTravel = 280) {
  if (direction === 0) return current + modulo(rest - current + 180, 360) - 180;
  const sign = Math.sign(direction);
  let travel = modulo(sign * (rest - current), 360);
  if (travel < minimumTravel) travel += Math.ceil((minimumTravel - travel) / 360) * 360;
  return current + sign * travel;
}

export function settleRotation(current, direction, speed = 0) {
  const travel = 280 + Math.min(Math.max(speed, 0), 2) * 90;
  // Tiny perpendicular movement is finger jitter, not a request for a second spin axis.
  const x = Math.abs(direction.x) < .15 ? 0 : direction.x;
  const y = Math.abs(direction.y) < .15 ? 0 : direction.y;
  return {
    x: settleAxis(current.x, REST_ROTATION.x, -y, travel),
    y: settleAxis(current.y, REST_ROTATION.y, x, travel),
    z: settleAxis(current.z, REST_ROTATION.z, 0),
  };
}

export function interpolateRotation(from, to, progress) {
  const eased = 1 - (1 - progress) ** 3;
  return Object.fromEntries(['x', 'y', 'z'].map(axis => [axis, from[axis] + (to[axis] - from[axis]) * eased]));
}
