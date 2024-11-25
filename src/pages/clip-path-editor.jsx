import { useState, useEffect, useRef } from 'react'
import { Copy, Square, Hexagon, Triangle, Circle } from 'lucide-react'

const ClipPathEditor = () => {

  const initialPoints = [
    { x: 50, y: 0, curve: false },
    { x: 100, y: 50, curve: false },
    { x: 50, y: 100, curve: false },
    { x: 0, y: 50, curve: false }
  ];

  const [points, setPoints] = useState(initialPoints)

  const [dragStartPoints, setDragStartPoints] = useState(null);

  const [selectedPoint, setSelectedPoint] = useState(null)
  const [controlPoint, setControlPoint] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(100)
  const [shape, setShape] = useState('custom')
  const svgRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [altPressed, setAltPressed] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState(new Set());
  const [history, setHistory] = useState([initialPoints]);
  const [historyIndex, setHistoryIndex] = useState(0);

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
      { x: 50, y: 0, curve: true, control1: { x: 85, y: 0 }, control2: { x: 100, y: 35 } },
      { x: 50, y: 100, curve: true, control1: { x: 100, y: 65 }, control2: { x: 85, y: 100 } },
      { x: 50, y: 100, curve: true, control1: { x: 15, y: 100 }, control2: { x: 0, y: 65 } },
      { x: 50, y: 0, curve: true, control1: { x: 0, y: 35 }, control2: { x: 15, y: 0 } }
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
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedPoints, historyIndex, history]);

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
      const newScale = Math.max(10, Math.min(200, scale - e.deltaY * 0.1));
      setScale(newScale);
    }
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
  }, [scale]);

  const handleMouseDown = (index, isControl, controlNumber) => {
    // Don't save initial state to history, just keep it for reference
    setDragStartPoints(JSON.parse(JSON.stringify(points)));
    setIsDragging(true);
    if (isControl) {
      setControlPoint({ pointIndex: index, controlNumber });
    } else {
      setSelectedPoint(index);
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
    if (selectedPoint === null && controlPoint === null) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();

    // Calculate the center of the SVG
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Get mouse position relative to SVG
    let x = ((e.clientX - rect.left - centerX) / (rect.width * scale / 100)) * 100 + 50;
    let y = ((e.clientY - rect.top - centerY) / (rect.height * scale / 100)) * 100 + 50;

    if (rotation !== 0) {
      const radians = (-rotation * Math.PI) / 180;
      const rotatedX = x - 50;
      const rotatedY = y - 50;
      x = (rotatedX * Math.cos(radians) - rotatedY * Math.sin(radians)) + 50;
      y = (rotatedX * Math.sin(radians) + rotatedY * Math.cos(radians)) + 50;
    }

    const newX = Math.min(100, Math.max(0, x));
    const newY = Math.min(100, Math.max(0, y));

    const newPoints = points.map((point, index) => {
      if (controlPoint && index === controlPoint.pointIndex) {
        return {
          ...point,
          [`control${controlPoint.controlNumber}`]: { x: newX, y: newY },
          curve: true
        };
      } else if (selectedPoint !== null && index === selectedPoint) {
        const deltaX = newX - point.x;
        const deltaY = newY - point.y;
        return {
          ...point,
          x: newX,
          y: newY,
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

    // Just update points without saving to history during drag
    setPoints(newPoints);
  };

  const handleMouseUp = () => {
    if (isDragging && dragStartPoints) {
      // Only save to history if points actually changed
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
        if (i === index) {
          const newCurve = !point.curve;
          const dx = 20; // Distance for control points

          let control1 = point.control1;
          let control2 = point.control2;

          if (newCurve) {
            if (!control1) {
              control1 = { x: point.x - dx, y: point.y };
            }
            if (!control2) {
              control2 = { x: point.x + dx, y: point.y };
            }
          }

          return {
            ...point,
            curve: newCurve,
            control1: newCurve ? control1 : null,
            control2: newCurve ? control2 : null
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

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

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
    setScale(100);
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

    const radians = (rotation * Math.PI) / 180;
    const centerX = 50;
    const centerY = 50;

    // Translate to origin
    const translatedX = point.x - centerX;
    const translatedY = point.y - centerY;

    // Rotate
    const rotatedX = translatedX * Math.cos(radians) - translatedY * Math.sin(radians);
    const rotatedY = translatedX * Math.sin(radians) + translatedY * Math.cos(radians);

    // Scale
    const scaledX = (rotatedX * scale) / 100;
    const scaledY = (rotatedY * scale) / 100;

    // Translate back
    return {
      x: scaledX + centerX,
      y: scaledY + centerY
    };
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',

      backgroundColor: '#111',
      maxWidth: '95vw',

    },
    header: {
      marginBottom: '24px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '16px',
      color: '#fff',
    },
    buttonGroup: {
      display: 'flex',
      marginLeft: '10px',
      gap: '8px',
    },
    button: {
      padding: '8px',
      backgroundColor: '#ff2c3c',
      borderRadius: '4px',
      border: 'none',
    },
    buttonHover: {
      backgroundColor: '#ff6f2c',
    },
    editorGrid: {
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#111',
      gap: '16px',
    },
    svgContainer: {
      border: '1px solid #e5e7eb',
      padding: '16px',
    },
    controls: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginLeft: '10px',
    },
    input: {
      display: 'flex',
      width: '90%',
      padding: '8px',
      border: '1px solid #e5e7eb',
      borderRadius: '4px'
    },
    label: {
      color: '#fff',
    },
    codePreview: {
      width: '90%',
      padding: '16px',
      backgroundColor: '#f3f4f6',
      borderRadius: '4px',
      WrapText: 'wrap',
    },
    preview: {
      marginTop: '24px',
      marginLeft: '10px',

    },
    previewGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
    },
    previewBox: {
      width: '256px',
      height: '256px',
      background: 'linear-gradient(to right, #ff2c3c, #ff6f2c)',
    },
    previewImage: {
      width: '128px',
      height: '128px',
      objectFit: 'cover',
    },
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Clip Path Editor</h1>
        <div style={styles.buttonGroup}>
          <button onClick={() => handleShapeChange('square')} style={styles.button}>
            <Square className="w-6 h-6" />
          </button>
          <button onClick={() => handleShapeChange('triangle')} style={styles.button}>
            <Triangle className="w-6 h-6" />
          </button>
          <button onClick={() => handleShapeChange('hexagon')} style={styles.button}>
            <Hexagon className="w-6 h-6" />
          </button>
          <button onClick={() => handleShapeChange('circle')} style={styles.button}>
            <Circle className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div style={styles.editorGrid}>
        <div style={styles.svgContainer}>
          <svg
            ref={svgRef}
            viewBox="0 0 100 100"
            onMouseMove={handleMouseMove}
            onClick={handleSvgClick}
            className="w-full h-full"
            style={{ cursor: isDragging ? 'grabbing' : shiftPressed ? 'crosshair' : 'grab' }}
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
                      if (!shiftPressed) handleMouseDown(index);
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
                        onMouseDown={() => handleMouseDown(index, true, 1)}
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
                        onMouseDown={() => handleMouseDown(index, true, 2)}
                      />
                    </>
                  )}
                  {/* <text
                    x={transformedPoint.x + 2}
                    y={transformedPoint.y - 2}
                    fontSize="4"
                    fill="#ff2c3c"
                  >
                    {index + 1}
                  </text> */}
                </g>
              );
            })}
          </svg>
        </div>

        <div style={styles.controls}>
          <div>
            <label style={styles.label} className="block mb-1">Rotation (degrees)</label>
            <input
              type="number"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label} className="block mb-1">Scale (%)</label>
            <input
              type="number"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              style={styles.input}
            />
          </div>

          <div style={styles.buttonGroup}>
            <button onClick={addPoint} style={{ ...styles.button, backgroundColor: '#ff2c3c' }}>
              Add Point
            </button>
            {points.length > 3 && (
              <button onClick={() => removePoint(points.length - 1)} style={{ ...styles.button, backgroundColor: '#ff2c3c' }}>
                Remove Point
              </button>
            )}
          </div>

          <div style={styles.codePreview}>
            <pre style={{ textWrap: 'wrap' }} className="whitespace-pre-wrap">{generateClipPath()}</pre>
            <button onClick={copyToClipboard} style={{ ...styles.button, backgroundColor: '#ff2c3c', marginTop: '8px' }}>
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}

export default ClipPathEditor
