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

var shift1 = [0, 1, 2, 3, 4].map(function (i) {
  var a = Math.PI / 3 * i * 1.2 + 0.3;
  return { x : Math.cos(a), y : Math.sin(a) };
});
var shift2 = [0, 1, 2, 3, 4].map(function (i) {
  var a = Math.PI / 3 * (i + 0.2) * 1.2 + 0.3;
  return { x : Math.cos(a), y : Math.sin(a) };
});

function calcLinkCurve(source, target, ordinal) {
  var dx = target.x - source.x,
      dy = target.y - source.y;
  var m;
  var p0, p2;
  if (ordinal == 0) {
    m = {
      x: (source.x + target.x) / 2,
      y: (source.y + target.y) / 2
    };
    var l = Math.sqrt(dx * dx + dy * dy);
    p0 = {
      x: source.x + dx * source.r / l,
      y: source.y + dy * source.r / l
    };
    p2 = {
      x: target.x - dx * target.r / l,
      y: target.y - dy * target.r / l
    };
  }
  else {
    m = {
      x: (source.x + target.x) / 2 + dy / 5 * (ordinal - Math.sign(ordinal) * 0.5),
      y: (source.y + target.y) / 2 - dx / 5 * (ordinal - Math.sign(ordinal) * 0.5)
    };
    var bezier = [source, m, target];
    var t0 = source.r / quadraticBezierLength(bezier);
    var t2 = 1 - target.r / quadraticBezierLength(bezier);
    p0 = getPointAtQuadraticBezier(bezier, t0);
    p2 = getPointAtQuadraticBezier(bezier, t2);
  }
  return [p0, m, p2];
}

function calcLoopCurve(source, ordinal) {
  var i1 = ordinal % 5,
      i2 = (ordinal + 4) % 5;
  var dr = 50 + 20 * Math.floor((ordinal - 1) / 5);
  var x1 = source.x + shift1[i1].x * dr,
      y1 = source.y - shift1[i1].y * dr,
      x2 = source.x + shift2[i2].x * dr,
      y2 = source.y - shift2[i2].y * dr;
  var xm = (x1 + x2) / 2,
      ym = (y1 + y2) / 2;
  var bezier0 = [source, { x: x1, y: y1 }, { x: xm, y: ym }];
  var t0 = source.r / 2 / quadraticBezierLength(bezier0);
  var p0 = getPointAtQuadraticBezier(bezier0, t0);
  var p3 = reflect(p0, source, { x: xm, y: ym });
  return [p0, { x: x1, y: y1 }, { x: xm, y: ym }, p3];
}

function getPointAtQuadraticBezier(p, t) {
  var x = (1 - t) * (1 - t) * p[0].x + 2 * (1 - t) * t * p[1].x + t * t * p[2].x;
  var y = (1 - t) * (1 - t) * p[0].y + 2 * (1 - t) * t * p[1].y + t * t * p[2].y;
  return { x: x, y: y };
}

function reflect(p, p0, p1) {
  var dx = p1.x - p0.x;
  var dy = p1.y - p0.y;
  var a = (dx * dx - dy * dy) / (dx * dx + dy * dy);
  var b = 2 * dx * dy / (dx * dx + dy * dy);
  var x = a * (p.x - p0.x) + b * (p.y - p0.y) + p0.x;
  var y = b * (p.x - p0.x) - a * (p.y - p0.y) + p0.y;
  return { x:x, y:y };
}

function euclideanLength(p) {
  var dx = p[1].x - p[0].x;
  var dy = p[1].y - p[0].y;
  return Math.sqrt(dx * dx + dy * dy);
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
var curve = d3.line().curve(d3.curveCardinal.tension(0.3));
