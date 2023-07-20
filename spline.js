// function (dataTemp, intensity) {
//   console.log(dataTemp)
//   var i = 0,
//     splitters = [],
//     pathReturn = '',
//     pathBuffer = '',
//     dataLen = dataTemp.length;

//   if (intensity === undefined) {
//     intensity = 1;
//   }
//   for (; i < dataLen; i++) {
//     if (i !== dataLen - 1 && i !== 0) {
//       pathBuffer = getSpline(splitters, intensity);
//       pathBuffer && (pathReturn += pathBuffer);
//       splitters = [];
//     }
//     splitters.push(dataTemp[i]);
//     if (i === dataLen - 1) {
//       pathBuffer = getSpline(splitters, intensity);
//       pathBuffer && (pathReturn += pathBuffer);
//     }
//   }
//   return pathReturn
// }

module.exports = function getSpline(dataTemp, intensity = 1) {
  if (dataTemp.length < 2) {
    return;
  }

  var minXInterval = (dataTemp[1].x - dataTemp[0].x) / 2,
    curveIntensityRatio = Number(intensity),
    curveIntensity = curveIntensityRatio * minXInterval,
    i,
    prevCtrlPts,
    curvePath = '',
    TAB = ' ',
    M = 'M',
    C = 'C',
    firstLine,
    line,
    ctrlPts,
    btwnExtremas,
    pathLets = '',
    firstCtrlPt,
    len = dataTemp.length,
    increasing,
    extrema,
    ifExtrema = function (prevPoint, point, nextPoint) {
      if (!prevPoint || !nextPoint) {
        return true;
      }
      if (((prevPoint.y - point.y) / (nextPoint.y - point.y)) >= 0) {
        return true;
      }
      return false;
    },
    ifIncreasing = function (prevPoint, point) {
      if (prevPoint.y > point.y) {
        return true;
      } else if (prevPoint.y < point.y) {
        return false;
      }
    },
    pathCommandify = function (points) {
      if (points.length !== 3) {
        return;
      }
      var pathD = '',
        i = 0,
        n = 3;

      for (; i < n; i++) {
        if (i === 2) {
          pathD += C + TAB;
        }
        pathD += points[i].x + TAB + points[i].y + TAB;
      }

      return pathD;
    },
    getLineEq = function (point1, point2) {
      var m = (point1.y - point2.y) / (point1.x - point2.x),
        c = point1.y - (m * point1.x);
      return {
        m: m,
        c: c
      };
    },
    getCntrlPointsOnLine = function (line, point, prevPoint, increasing) {
      var xPrev = point.x - curveIntensity,
        yPrev = (line.m * xPrev) + line.c,
        xNext = point.x + curveIntensity,
        yNext = (line.m * xNext) + line.c;

      if ((increasing === true) && prevPoint && (yPrev > prevPoint.y)) {
        // take the control point in the line at the y of prev point
        yPrev = prevPoint.y;
        xPrev = (yPrev - line.c) / line.m;
      } else if ((increasing === false) && prevPoint && (yPrev < prevPoint.y)) {
        // take the control point in the line at the y of prev point
        yPrev = prevPoint.y;
        xPrev = (yPrev - line.c) / line.m;
      }

      return [{
        x: xPrev,
        y: yPrev
      }, point, {
        x: xNext,
        y: yNext
      }];
    },
    ifBtwnExtremas = function (index) {
      if (index === 0 || index === len - 1) {
        return false;
      }
      if (ifExtrema(dataTemp[index - 2], dataTemp[index - 1], dataTemp[index])) {
        if (ifExtrema(dataTemp[index], dataTemp[index + 1], dataTemp[index + 2])) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    },
    angleBetweenSlopes = function (m1, m2) {
      return Math.atan((m1 - m2) / (1 + m1 * m2));
    },
    rotatingCtrlPts = function (ctrlPts, phi) {
      var bufferPoint = {};

      phi = Math.PI - phi;
      // rotating first point
      bufferPoint.x = ctrlPts[0].x - ctrlPts[1].x;
      bufferPoint.y = ctrlPts[0].y - ctrlPts[1].y;
      bufferPoint.x = bufferPoint.x * Math.cos(phi) - bufferPoint.y * Math.sin(phi);
      bufferPoint.y = bufferPoint.y * Math.cos(phi) + bufferPoint.x * Math.sin(phi);
      ctrlPts[0].x = bufferPoint.x + ctrlPts[1].x;
      ctrlPts[0].y = bufferPoint.y + ctrlPts[1].y;

      // rotating second point
      bufferPoint.x = ctrlPts[2].x - ctrlPts[1].x;
      bufferPoint.y = ctrlPts[2].y - ctrlPts[1].y;
      bufferPoint.x = bufferPoint.x * Math.cos(phi) - bufferPoint.y * Math.sin(phi);
      bufferPoint.y = bufferPoint.y * Math.cos(phi) + bufferPoint.x * Math.sin(phi);
      ctrlPts[2].x = bufferPoint.x + ctrlPts[1].x;
      ctrlPts[2].y = bufferPoint.y + ctrlPts[1].y;

      return ctrlPts;
    },
    modifyTwists = function (prevCtrlPts, ctrlPts) {
      var line,
        xIntercept,
        phi,
        slope;
      // checking wether last control point of the previous set is on the positive side

      // intesection of current control point with previous extrema line
      line = getLineEq(ctrlPts[0], ctrlPts[1]);
      xIntercept = (prevCtrlPts[2].y - line.c) / line.m;
      slope = (ctrlPts[1].y - prevCtrlPts[2].y) / (ctrlPts[1].x - prevCtrlPts[2].x);
      if (xIntercept < prevCtrlPts[2].x) {
        phi = angleBetweenSlopes(line.m, slope);
        ctrlPts = rotatingCtrlPts(ctrlPts, phi);
      }
      return ctrlPts;
    };

  curvePath += M + TAB + dataTemp[0].x + TAB + dataTemp[0].y + TAB;
  firstLine = getLineEq(dataTemp[0], dataTemp[1]);
  firstCtrlPt = getCntrlPointsOnLine(firstLine, dataTemp[0])[1];
  curvePath += C + TAB + firstCtrlPt.x + TAB + firstCtrlPt.y + TAB;
  prevCtrlPts = [null, null, firstCtrlPt];
  for (i = 1; i <= len - 1; i++) {
    extrema = dataTemp[i + 1] && ifExtrema(dataTemp[i - 1], dataTemp[i], dataTemp[i + 1]);
    increasing = null;
    if (extrema) {
      btwnExtremas = false;
      line = {
        c: dataTemp[i].y,
        m: 0
      };
    } else {
      btwnExtremas = ifBtwnExtremas(i);
      increasing = (dataTemp[i + 1] && ifIncreasing(dataTemp[i - 1], dataTemp[i]));
      line = dataTemp[i + 1] && getLineEq(dataTemp[i], dataTemp[i + 1]);
    }

    ctrlPts = line && getCntrlPointsOnLine(line, dataTemp[i], dataTemp[i - 1], increasing);
    if ((btwnExtremas) && ctrlPts && prevCtrlPts && modifyTwists(prevCtrlPts, ctrlPts)) {
      ctrlPts = modifyTwists(prevCtrlPts, ctrlPts);
    }
    ctrlPts && (pathLets = pathCommandify(ctrlPts));
    ctrlPts && (curvePath += pathLets);
    prevCtrlPts = ctrlPts;
  }

  firstLine = getLineEq(dataTemp[len - 2], dataTemp[len - 1]);
  firstCtrlPt = getCntrlPointsOnLine(firstLine, dataTemp[len - 1])[0];
  curvePath += firstCtrlPt.x + TAB + firstCtrlPt.y + TAB + dataTemp[len - 1].x +
    TAB + dataTemp[len - 1].y;

  return curvePath;
}