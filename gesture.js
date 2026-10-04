export const DRAG_THRESHOLD = 8;

export class Gesture {
  constructor(event) {
    this.pointerId = event.pointerId;
    this.start = { x: event.clientX, y: event.clientY };
    this.last = { ...this.start, time: event.timeStamp };
    this.dragging = false;
    this.direction = { x: 0, y: 0 };
    this.speed = 0;
    this.lastMovementTime = event.timeStamp;
  }

  move(event) {
    if (event.pointerId !== this.pointerId) return null;
    const point = { x: event.clientX, y: event.clientY, time: event.timeStamp };
    const dx = point.x - this.last.x;
    const dy = point.y - this.last.y;
    let rotationDelta = { x: 0, y: 0 };
    if (!this.dragging && Math.hypot(point.x - this.start.x, point.y - this.start.y) > DRAG_THRESHOLD) {
      this.dragging = true;
      rotationDelta = { x: point.x - this.start.x, y: point.y - this.start.y };
    } else if (this.dragging) {
      rotationDelta = { x: dx, y: dy };
    }
    const distance = Math.hypot(dx, dy);
    if (distance > 0) {
      this.direction = { x: dx / distance, y: dy / distance };
      this.speed = Math.min(distance / Math.max(8, point.time - this.last.time), 2);
      this.lastMovementTime = point.time;
    }
    this.last = point;
    return rotationDelta;
  }

  release(event) {
    const delta = this.move(event);
    if (!delta) return null;
    return {
      delta,
      dragging: this.dragging,
      direction: { ...this.direction },
      speed: event.timeStamp - this.lastMovementTime > 120 ? 0 : this.speed,
    };
  }
}
