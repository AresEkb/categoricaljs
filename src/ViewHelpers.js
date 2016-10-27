'use strict';

function calcOrdinal(adjMatrix, ordMatrix, source, target) {
  var s = source,
      t = target;
  var ordinal;
  if (!ordMatrix[s]) {
    ordMatrix[s] = {};
  }
  if (adjMatrix[s][t] + (adjMatrix[t][s] || 0) == 1) {
    ordinal = 0;
  }
  else {
    if (!ordMatrix[s][t]) {
      var startOrdinal = Math.ceil(((adjMatrix[t][s] || 0) - adjMatrix[s][t]) / 2);
      if (startOrdinal >= 0) {
        startOrdinal++;
      }
      ordMatrix[s][t] = startOrdinal - 1;
    }
    ordinal = ordMatrix[s][t] = (ordMatrix[s][t] + 1) || 1;
  }
  return ordinal;
}

function linkCurve(source, target, ordinal) {
  var dx = target.x - source.x,
      dy = target.y - source.y;
  if (ordinal == 0) {
    var len = Math.sqrt(dx * dx + dy * dy);
    return [
      { x: source.x + dx * source.r / len,
        y: source.y + dy * source.r / len },
      { x: (source.x + target.x) / 2,
        y: (source.y + target.y) / 2 },
      { x: target.x - dx * target.r / len,
        y: target.y - dy * target.r / len }];
  }
  else {
    var k = (ordinal - Math.sign(ordinal) * 0.5) / 5;
    var m = {
      x: (source.x + target.x) / 2 + k * dy,
      y: (source.y + target.y) / 2 - k * dx };
    var bezier = [source, m, target];
    var len = quadraticBezierLength(bezier);
    return [
      quadraticBezierPoint(bezier, source.r / len),
      m,
      quadraticBezierPoint(bezier, 1 - target.r / len) ];
  }
}

var loopCurveShift = [0, 1, 2, 3, 4].map(function (i) {
  return [
    polarToCartesian(Math.PI / 3 * i * 1.2 + 0.3),
    polarToCartesian(Math.PI / 3 * (i + 0.2) * 1.2 + 0.3) ];
});

function loopCurve(source, ordinal) {
  var i1 = ordinal % 5,
      i2 = (ordinal + 4) % 5;
  var dr = 50 + 20 * Math.floor((ordinal - 1) / 5);
  var x1 = source.x + loopCurveShift[i1][0].x * dr,
      y1 = source.y - loopCurveShift[i1][0].y * dr,
      x2 = source.x + loopCurveShift[i2][1].x * dr,
      y2 = source.y - loopCurveShift[i2][1].y * dr;
  var xm = (x1 + x2) / 2,
      ym = (y1 + y2) / 2;
  var bezier = [source, { x: x1, y: y1 }, { x: xm, y: ym }];
  var t0 = source.r / 2 / quadraticBezierLength(bezier);
  var p0 = quadraticBezierPoint(bezier, t0);
  var p3 = reflect(p0, source, { x: xm, y: ym });
  return [p0, { x: x1, y: y1 }, { x: xm, y: ym }, p3];
}

function polarToCartesian(a) {
  return { x : Math.cos(a), y : Math.sin(a) };
}

function reflect(p, p0, p1) {
  var dx = p1.x - p0.x,
      dy = p1.y - p0.y;
  var dx2 = dx * dx,
      dy2 = dy * dy;
  var a = (dx2 - dy2) / (dx2 + dy2),
      b = 2 * dx * dy / (dx2 + dy2);
  var x = a * (p.x - p0.x) + b * (p.y - p0.y) + p0.x;
  var y = b * (p.x - p0.x) - a * (p.y - p0.y) + p0.y;
  return { x: x, y: y };
}

function quadraticBezierPoint(p, t) {
  var t0 = (1 - t) * (1 - t),
      t1 = 2 * (1 - t) * t,
      t2 = t * t;
  var x = t0 * p[0].x + t1 * p[1].x + t2 * p[2].x;
  var y = t0 * p[0].y + t1 * p[1].y + t2 * p[2].y;
  return { x: x, y: y };
}

function quadraticBezierLength(p) {
  var a = {
    x: p[0].x - 2 * p[1].x + p[2].x,
    y: p[0].y - 2 * p[1].y + p[2].y
  };
  var b = {
    x: 2 * p[1].x - 2 * p[0].x,
    y: 2 * p[1].y - 2 * p[0].y
  };
  var A = 4 * (a.x * a.x + a.y * a.y);
  var B = 4 * (a.x * b.x + a.y * b.y);
  var C = b.x * b.x + b.y * b.y;

  var Sabc = 2 * Math.sqrt(A+B+C);
  var A_2 = Math.sqrt(A);
  var A_32 = 2 * A * A_2;
  var C_2 = 2 * Math.sqrt(C);
  var BA = B / A_2;

  return (A_32 * Sabc + A_2 * B * (Sabc - C_2) + (4 * C * A - B * B) * Math.log((2 * A_2 + BA + Sabc) / (BA + C_2))) / (4 * A_32);
}

var color = d3.schemeCategory10;
var brighter = function (color) { return d3.hsl(color).brighter(1); };
var hullCurve = d3.line().curve(d3.curveCardinal.tension(0.3));
