import { useState, useEffect, useRef } from 'react'
import { Copy, Square, Hexagon, Triangle, Circle } from 'lucide-react'
import '../styles/style.css'

const ClipPathEditor = () => {

  const initialPoints = [
    { x: 50, y: 0, curve: false },
    { x: 100, y: 50, curve: false },
    { x: 50, y: 100, curve: false },
    { x: 0, y: 50, curve: false }
  ];

  const [points, setPoints] = useState(initialPoints)

  const [dragStartPoints, setDragStartPoints] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [selectedPoint, setSelectedPoint] = useState(null)
  const [controlPoint, setControlPoint] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(80)
  const [shape, setShape] = useState('custom')
  const svgRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [altPressed, setAltPressed] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState(new Set());
  const [history, setHistory] = useState([initialPoints]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [viewportPosition, setViewportPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const [image, setImage] = useState(null);
  const [imageURL, setImageURL] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(file);
      setImageURL(url);
    }
  };

  const presetShapes = {
    square: [
      { x: 0, y: 0, curve: false },
      { x: 100, y: 0, curve: false },
      { x: 100, y: 100, curve: false },
      { x: 0, y: 100, curve: false }
    ],
    triangle: [
      { x: 50, y: 0, curve: false },
      { x: 100, y: 100, curve: false },
      { x: 0, y: 100, curve: false }
    ],
    hexagon: [
      { x: 25, y: 6.7, curve: false },
      { x: 75, y: 6.7, curve: false },
      { x: 100, y: 50, curve: false },
      { x: 75, y: 93.3, curve: false },
      { x: 25, y: 93.3, curve: false },
      { x: 0, y: 50, curve: false }
    ],
    circle: [
      {
        x: 50, y: 0, curve: true,
        control1: { x: 22.5, y: 0 },    // Left control point
        control2: { x: 77.5, y: 0 }     // Right control point
      },
      {
        x: 100, y: 50, curve: true,
        control1: { x: 100, y: 22.5 },  // Top control point
        control2: { x: 100, y: 77.5 }   // Bottom control point
      },
      {
        x: 50, y: 100, curve: true,
        control1: { x: 77.5, y: 100 },  // Right control point
        control2: { x: 22.5, y: 100 }   // Left control point
      },
      {
        x: 0, y: 50, curve: true,
        control1: { x: 0, y: 77.5 },    // Bottom control point
        control2: { x: 0, y: 22.5 }     // Top control point
      }
    ]
  }

  useEffect(() => {
    if (dragStartPoints) {
      const pointsCopy = JSON.parse(JSON.stringify(dragStartPoints));
      setPoints(pointsCopy);
    }
  }, [dragStartPoints]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') setShiftPressed(true);
      if (e.key === 'Alt') setAltPressed(true);
      if (e.key === ' ') {
        e.preventDefault();
        setSpacePressed(true);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPoints.size > 0) {
        e.preventDefault();
        deleteSelectedPoints();
      }
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') setShiftPressed(false);
      if (e.key === 'Alt') setAltPressed(false);
      if (e.key === ' ') {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedPoints, historyIndex, history]);

  const convertToSVGCoordinates = (clientX, clientY) => {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const point = svg.createSVGPoint();
    point.x = clientX - rect.left;
    point.y = clientY - rect.top;
    const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());

    return {
      x: svgPoint.x + (50 - 50 / zoom + viewportPosition.x),
      y: svgPoint.y + (50 - 50 / zoom + viewportPosition.y)
    };
  };

  const saveToHistory = (newPoints) => {
    const pointsCopy = JSON.parse(JSON.stringify(newPoints));

    // Only save to history if the points are different from the last state
    if (JSON.stringify(history[historyIndex]) !== JSON.stringify(pointsCopy)) {
      setPoints(pointsCopy);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(pointsCopy);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const pointsCopy = JSON.parse(JSON.stringify(history[newIndex]));
      setHistoryIndex(newIndex);
      setPoints(pointsCopy);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const pointsCopy = JSON.parse(JSON.stringify(history[newIndex]));
      setHistoryIndex(newIndex);
      setPoints(pointsCopy);
    }
  };

  const setPointsWithHistory = (newPoints) => {
    const pointsCopy = JSON.parse(JSON.stringify(newPoints));
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(pointsCopy);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setPoints(pointsCopy);
    saveToHistory(newPoints);
  };

  const findClosestPointOnPath = (clickX, clickY) => {
    const pathLength = 100; // Number of points to check along the path
    let closestPoint = { x: 0, y: 0 };
    let minDistance = Infinity;

    for (let i = 0; i < points.length; i++) {
      const currentPoint = points[i];
      const nextPoint = points[(i + 1) % points.length];

      // Check points along the line segment
      for (let t = 0; t <= 1; t += 1 / pathLength) {
        const x = currentPoint.x + (nextPoint.x - currentPoint.x) * t;
        const y = currentPoint.y + (nextPoint.y - currentPoint.y) * t;

        const distance = Math.sqrt((x - clickX) ** 2 + (y - clickY) ** 2);

        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = { x, y };
        }
      }
    }

    return closestPoint;
  };

  const handleWheel = (e) => {
    if (svgRef.current.contains(e.target)) {
      e.preventDefault();

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.01, zoom * zoomFactor);

      // Get mouse position relative to SVG
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
      const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

      // Calculate new viewport position
      const dx = (mouseX - 50) * (1 - zoomFactor);
      const dy = (mouseY - 50) * (1 - zoomFactor);

      setViewportPosition(prev => ({
        x: prev.x - dx / newZoom,
        y: prev.y - dy / newZoom
      }));

      setZoom(newZoom);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => prev * 1.1);
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.01, prev * 0.9));
  };

  const handleZoomReset = () => {
    setZoom(1);
    setViewportPosition({ x: 0, y: 0 });
  };


  useEffect(() => {
    const svg = svgRef.current;
    if (svg) {
      svg.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (svg) {
        svg.removeEventListener('wheel', handleWheel);
      }
    };
  }, [zoom, viewportPosition]);

  const handleMouseDown = (e, index, isControl, controlNumber) => {
    if (spacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (index !== undefined) {
      setDragStartPoints(JSON.parse(JSON.stringify(points)));
      setIsDragging(true);

      const svgPoint = convertToSVGCoordinates(e.clientX, e.clientY);
      const point = points[index];

      if (isControl) {
        const controlPoint = controlNumber === 1 ? point.control1 : point.control2;
        setDragOffset({
          x: svgPoint.x - controlPoint.x,
          y: svgPoint.y - controlPoint.y
        });
        setControlPoint({ pointIndex: index, controlNumber });
      } else {
        setDragOffset({
          x: svgPoint.x - point.x,
          y: svgPoint.y - point.y
        });
        setSelectedPoint(index);
      }
    }
  };

  const handleSvgClick = (e) => {
    if (!shiftPressed) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Find the closest point on the path
    const closestPoint = findClosestPointOnPath(x, y);

    // Find the index where to insert the new point
    let insertIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < points.length; i++) {
      const currentPoint = points[i];
      const nextPoint = points[(i + 1) % points.length];

      const midX = (currentPoint.x + nextPoint.x) / 2;
      const midY = (currentPoint.y + nextPoint.y) / 2;

      const distance = Math.sqrt((midX - closestPoint.x) ** 2 + (midY - closestPoint.y) ** 2);

      if (distance < minDistance) {
        minDistance = distance;
        insertIndex = i + 1;
      }
    }

    // Insert the new point
    const newPoints = [...points];
    newPoints.splice(insertIndex, 0, {
      x: closestPoint.x,
      y: closestPoint.y,
      curve: false,
      control1: { x: closestPoint.x - 20, y: closestPoint.y },
      control2: { x: closestPoint.x + 20, y: closestPoint.y }
    });
    setPointsWithHistory(newPoints);
  };

  const togglePointSelection = (index, event) => {
    event.stopPropagation();
    const newSelection = new Set(selectedPoints);

    if (event.ctrlKey || event.metaKey) {
      if (newSelection.has(index)) {
        newSelection.delete(index);
      } else {
        newSelection.add(index);
      }
    } else {
      newSelection.clear();
      newSelection.add(index);
    }

    setSelectedPoints(newSelection);
  };

  // Function to delete selected points
  const deleteSelectedPoints = () => {
    if (points.length - selectedPoints.size < 3) {
      // Don't delete if it would result in fewer than 3 points
      return;
    }

    const newPoints = points.filter((_, index) => !selectedPoints.has(index));
    saveToHistory(newPoints);
    setSelectedPoints(new Set());
  };

  const handleMouseMove = (e) => {
    if (isPanning && panStart) {
      const dx = (e.clientX - panStart.x) / (svgRef.current.getBoundingClientRect().width / 100 * zoom);
      const dy = (e.clientY - panStart.y) / (svgRef.current.getBoundingClientRect().height / 100 * zoom);

      setViewportPosition(prev => ({
        x: prev.x - dx,
        y: prev.y - dy
      }));

      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (selectedPoint === null && controlPoint === null) return;

    const svgPoint = convertToSVGCoordinates(e.clientX, e.clientY);

    // Calculate the actual point position by removing the drag offset
    const x = svgPoint.x - dragOffset.x;
    const y = svgPoint.y - dragOffset.y;

    const newPoints = points.map((point, index) => {
      if (controlPoint && index === controlPoint.pointIndex) {
        return {
          ...point,
          [`control${controlPoint.controlNumber}`]: { x, y },
          curve: true
        };
      } else if (selectedPoint !== null && index === selectedPoint) {
        const deltaX = x - point.x;
        const deltaY = y - point.y;
        return {
          ...point,
          x,
          y,
          control1: point.control1 ? {
            x: point.control1.x + deltaX,
            y: point.control1.y + deltaY
          } : null,
          control2: point.control2 ? {
            x: point.control2.x + deltaX,
            y: point.control2.y + deltaY
          } : null
        };
      }
      return point;
    });

    setPoints(newPoints);
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }

    if (isDragging && dragStartPoints) {
      if (JSON.stringify(points) !== JSON.stringify(dragStartPoints)) {
        saveToHistory(points);
      }
      setDragStartPoints(null);
    }

    setIsDragging(false);
    setSelectedPoint(null);
    setControlPoint(null);
  };



  const toggleCurve = (index) => {
    if (altPressed) {
      const newPoints = points.map((point, i) => {
        const nextIndex = (i + 1) % points.length;
        const prevIndex = (i - 1 + points.length) % points.length;
        const currentPoint = points[index];
        const dx = 20;
        const newCurve = !currentPoint.curve;

        if (i === index) {
          // Toggle curve state for clicked point
          return {
            ...point,
            curve: newCurve,
            control1: newCurve ?
              (i < 3 ? { x: point.x - dx, y: point.y } : { x: point.x + dx, y: point.y }) : null,
            control2: newCurve ?
              (i < 3 ? { x: point.x + dx, y: point.y } : { x: point.x - dx, y: point.y }) : null
          };
        }
        else if (i === prevIndex) {
          // Update previous point's curve state
          return {
            ...point,
            curve: points[index].curve,
            control1: point.control1,
            control2: !currentPoint.curve ? { x: point.x - dx, y: point.y } : null
          };
        }
        else if (i === nextIndex) {
          // Update next point's curve state
          return {
            ...point,
            curve: points[index].curve,
            control1: !currentPoint.curve ? { x: point.x + dx, y: point.y } : null,
            control2: point.control2
          };
        }
        return point;
      });

      saveToHistory(newPoints);
    }
  };



  const generatePath = () => {
    let path = ''
    points.forEach((point, index) => {
      const nextPoint = points[(index + 1) % points.length]
      const transformedPoint = transformPoint(point)
      const transformedNext = transformPoint(nextPoint)
      const transformedControl2 = transformPoint(point.control2)
      const transformedControl1Next = transformPoint(nextPoint.control1)

      if (index === 0) {
        path += `M ${transformedPoint.x} ${transformedPoint.y} `
      }

      if (nextPoint.curve) {
        path += `C ${transformedControl2?.x || transformedPoint.x} ${transformedControl2?.y || transformedPoint.y}, `
        path += `${transformedControl1Next?.x || transformedNext.x} ${transformedControl1Next?.y || transformedNext.y}, `
        path += `${transformedNext.x} ${transformedNext.y}`
      } else {
        path += `L ${transformedNext.x} ${transformedNext.y}`
      }
    })
    path += 'Z'
    return path
  }

  const generateClipPath = () => {
    // Convert SVG path to clip-path percentage coordinates
    // This is a simplified version - you'll need to add proper curve conversion
    return `clip-path: path('${generatePath()}');`
  }

  const generatePreviewPath = () => {
    let path = '';
    points.forEach((point, index) => {
      const nextPoint = points[(index + 1) % points.length];
      const transformedPoint = transformPoint(point);
      const transformedNext = transformPoint(nextPoint);
      const transformedControl2 = transformPoint(point.control2);
      const transformedControl1Next = transformPoint(nextPoint.control1);

      if (index === 0) {
        path += `M ${transformedPoint.x}% ${transformedPoint.y}%`;
      }

      if (nextPoint.curve) {
        path += ` C ${transformedControl2?.x || transformedPoint.x}% ${transformedControl2?.y || transformedPoint.y}%,`;
        path += ` ${transformedControl1Next?.x || transformedNext.x}% ${transformedControl1Next?.y || transformedNext.y}%,`;
        path += ` ${transformedNext.x}% ${transformedNext.y}%`;
      } else {
        path += ` L ${transformedNext.x}% ${transformedNext.y}%`;
      }
    });
    path += ' Z';
    return path;
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  useEffect(() => {
    const previewElement = document.querySelector('.previewShape > div');
    if (previewElement) {
      previewElement.style.clipPath = `path('${generatePath()}')`;
    }
  }, [points, rotation, scale]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateClipPath())
    alert('Copied to clipboard!')
  }

  const handleShapeChange = (newShape) => {
    const newPoints = presetShapes[newShape]?.map(point => ({
      ...point,
      control1: point.control1 || { x: point.x - 20, y: point.y },
      control2: point.control2 || { x: point.x + 20, y: point.y }
    })) || points;

    setShape(newShape);
    saveToHistory(newPoints);
    setRotation(0);
    setScale(80);
  };

  const addPoint = () => {
    if (points.length >= 50) return;
    const lastPoint = points[points.length - 1];
    setPointsWithHistory([...points, {
      x: lastPoint.x + 10,
      y: lastPoint.y + 10,
      curve: false,
      control1: { x: lastPoint.x - 10, y: lastPoint.y + 10 },
      control2: { x: lastPoint.x + 30, y: lastPoint.y + 10 }
    }]);
  };

  const removePoint = (index) => {
    if (points.length <= 3) return // Maintain minimum 3 points
    setPointsWithHistory(points.filter((_, i) => i !== index))
  }

  const transformPoint = (point, isControl = false) => {
    if (!point) return null;

    const scaledX = ((point.x - 50) * scale) / 100 + 50;
    const scaledY = ((point.y - 50) * scale) / 100 + 50;

    if (rotation !== 0) {
      const radians = (rotation * Math.PI) / 180;
      const rotatedX = (scaledX - 50) * Math.cos(radians) - (scaledY - 50) * Math.sin(radians) + 50;
      const rotatedY = (scaledX - 50) * Math.sin(radians) + (scaledY - 50) * Math.cos(radians) + 50;
      return { x: rotatedX, y: rotatedY };
    }

    return { x: scaledX, y: scaledY };
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Clip Path Editor</h1>

      </div>



      <div className="editor-grid">
        <div className="svg-container">
          <div className="svg-wrapper">
            <div className="button-group-2">
              <button onClick={() => handleShapeChange('square')} className="button">
                <Square className="w-6 h-6" />
              </button>
              <button onClick={() => handleShapeChange('triangle')} className="button">
                <Triangle className="w-6 h-6" />
              </button>
              <button onClick={() => handleShapeChange('hexagon')} className="button">
                <Hexagon className="w-6 h-6" />
              </button>
              <button onClick={() => handleShapeChange('circle')} className="button">
                <Circle className="w-6 h-6" />
              </button>
            </div>
            <svg
              id='svg1'
              ref={svgRef}
              viewBox={`${50 - 50 / zoom + viewportPosition.x} ${50 - 50 / zoom + viewportPosition.y} ${100 / zoom} ${100 / zoom}`}
              onMouseMove={handleMouseMove}
              onMouseDown={(e) => handleMouseDown(e)}
              onMouseUp={handleMouseUp}
              onClick={handleSvgClick}
              className="w-full h-full"
              style={{
                cursor: isPanning ? 'grabbing' :
                  isDragging ? 'grabbing' :
                    spacePressed ? 'grab' :
                      shiftPressed ? 'crosshair' : 'default'
              }}
            >
              <path
                d={generatePath()}
                fill="rgba(255, 44, 60, 0.5)"
                stroke="#ff2c3c"
                strokeWidth="1"
              />
              {points.map((point, index) => {
                const transformedPoint = transformPoint(point);
                const control1 = transformPoint(point.control1, true);
                const control2 = transformPoint(point.control2, true);

                return (
                  <g key={index}>
                    <circle
                      cx={transformedPoint.x}
                      cy={transformedPoint.y}
                      r="2"
                      fill={selectedPoints.has(index) ? "#ff6f2c" : "#ff2c3c"}
                      stroke={selectedPoints.has(index) ? "#fff" : "#fff"}
                      strokeWidth="0.5"
                      cursor="pointer"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        if (!shiftPressed && !spacePressed) handleMouseDown(e, index);
                      }}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                          togglePointSelection(index, e);
                        } else {
                          toggleCurve(index);
                        }
                      }}
                    />
                    {point.curve && (
                      <>
                        <line
                          x1={transformedPoint.x}
                          y1={transformedPoint.y}
                          x2={control1?.x}
                          y2={control1?.y}
                          stroke="#ff2c3c"
                          strokeWidth="0.5"
                          strokeDasharray="2,2"
                        />
                        <circle
                          cx={control1?.x}
                          cy={control1?.y}
                          r="1.5"
                          fill="#ff2c3c"
                          cursor="pointer"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            if (!shiftPressed && !spacePressed) handleMouseDown(e, index, true, 1);
                          }}
                        />
                        <line
                          x1={transformedPoint.x}
                          y1={transformedPoint.y}
                          x2={control2?.x}
                          y2={control2?.y}
                          stroke="#ff2c3c"
                          strokeWidth="0.5"
                          strokeDasharray="2,2"
                        />
                        <circle
                          cx={control2?.x}
                          cy={control2?.y}
                          r="1.5"
                          fill="#ff2c3c"
                          cursor="pointer"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            if (!shiftPressed && !spacePressed) handleMouseDown(e, index, true, 2);
                          }}
                        />
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="zoom-controls">
            <button onClick={handleZoomOut} className="zoom-button">-</button>
            <div className="zoom-level">{Math.round(zoom * 100)}%</div>
            <button onClick={handleZoomIn} className="zoom-button">+</button>
            <button onClick={handleZoomReset} className="zoom-button">↺</button>
          </div>
        </div>

        <div className="controls">
          <div className="control-group">
            <label className="label">Rotation (degrees)</label>
            <input
              type="number"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="input"
            />
          </div>

          <div className="control-group">
            <label className="label">Scale (%)</label>
            <input
              type="number"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="input"
            />
          </div>

          <div className="button-group">
            <button onClick={addPoint} className="button">Add Point</button>
            {points.length > 3 && (
              <button onClick={() => removePoint(points.length - 1)} className="button">
                Remove Point
              </button>
            )}
          </div>



          <div className="code-preview">
            <pre>{generateClipPath()}</pre>
            <button onClick={copyToClipboard} className="button" style={{ marginTop: '8px' }}>
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bottomSection">
        <div className="previewShape">
          <div className='previewImage' style={{
            backgroundImage: imageURL ? `url(${imageURL})` : 'linear-gradient(135deg, #ff2c3c, #ff6f2c)',
            clipPath: `path('${generatePreviewPath()}')`
          }} />
        </div>

        <div className="image-input">
          <label className="label">Upload Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>
      </div>
    </div >
  );
};


export default ClipPathEditor
