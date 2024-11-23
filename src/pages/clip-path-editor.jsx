import React, { useState, useRef, useEffect } from 'react'
import { Copy, Square, Hexagon, Triangle, Circle } from 'lucide-react'

const ClipPathEditor = () => {
  const [points, setPoints] = useState([
    { x: 50, y: 0, curve: false },
    { x: 100, y: 50, curve: false },
    { x: 50, y: 100, curve: false },
    { x: 0, y: 50, curve: false }
  ])
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [controlPoint, setControlPoint] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(100)
  const [shape, setShape] = useState('custom')
  const svgRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false);

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
    setIsDragging(true);
    if (isControl) {
      setControlPoint({ pointIndex: index, controlNumber });
    } else {
      setSelectedPoint(index);
    }
  };

  const handleMouseMove = (e) => {
    if (selectedPoint === null && controlPoint === null) return

    const svg = svgRef.current
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const newX = Math.min(100, Math.max(0, x))
    const newY = Math.min(100, Math.max(0, y))

    if (controlPoint) {
      setPoints(points.map((point, index) => {
        if (index === controlPoint.pointIndex) {
          const controlKey = `control${controlPoint.controlNumber}`
          return {
            ...point,
            [controlKey]: { x: newX, y: newY }
          }
        }
        return point
      }))
    } else if (selectedPoint !== null) {
      setPoints(points.map((point, index) =>
        index === selectedPoint ? { ...point, x: newX, y: newY } : point
      ))
    }
  }


  const handleMouseUp = () => {
    setIsDragging(false);
    setSelectedPoint(null);
    setControlPoint(null);
  };


  const toggleCurve = (index) => {
    setPoints(points.map((point, i) => {
      if (i === index) {
        return {
          ...point,
          curve: !point.curve,
          control1: point.control1 || { x: point.x - 20, y: point.y },
          control2: point.control2 || { x: point.x + 20, y: point.y }
        }
      }
      return point
    }))
  }

  const generatePath = () => {
    let path = ''
    points.forEach((point, index) => {
      const nextPoint = points[(index + 1) % points.length]

      if (index === 0) {
        path += `M ${point.x} ${point.y} `
      }

      if (nextPoint.curve) {
        path += `C ${point.control2?.x || point.x} ${point.control2?.y || point.y}, `

        path += `${nextPoint.control1?.x || nextPoint.x} ${nextPoint.control1?.y || nextPoint.y}, `
        path += `${nextPoint.x} ${nextPoint.y} `
      } else {
        path += `L ${nextPoint.x} ${nextPoint.y} `
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
    setShape(newShape)
    setPoints(presetShapes[newShape] || points)
    setRotation(0)
    setScale(100)
  }

  const addPoint = () => {
    if (points.length >= 50) return // Limit maximum points
    const lastPoint = points[points.length - 1]
    setPoints([...points, { x: lastPoint.x + 10, y: lastPoint.y + 10, curve: false }])
  }

  const removePoint = (index) => {
    if (points.length <= 3) return // Maintain minimum 3 points
    setPoints(points.filter((_, i) => i !== index))
  }

  const transformPoint = (point) => {
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
            className="w-full h-full"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <path
              d={generatePath()}
              fill="rgba(255, 44, 60, 0.5)"
              stroke="#ff2c3c"
              strokeWidth="1"
              style={{
                transform: `rotate(${rotation}deg) scale(${scale / 100})`,
                transformOrigin: 'center'
              }}
            />
            {points.map((point, index) => {
              const transformedPoint = transformPoint(point);
              const control1 = point.control1 ? transformPoint(point.control1) : null;
              const control2 = point.control2 ? transformPoint(point.control2) : null;

              return (
                <g key={index}>
                  <circle
                    cx={transformedPoint.x}
                    cy={transformedPoint.y}
                    r="2"
                    fill={point.curve ? "#ff2c3c" : "#ff2c3c"}
                    stroke="#fff"
                    strokeWidth="0.5"
                    cursor="pointer"
                    onMouseDown={() => handleMouseDown(index)}
                    onClick={() => toggleCurve(index)}
                  />
                  {point.curve && (
                    <>
                      <line
                        x1={transformedPoint.x}
                        y1={transformedPoint.y}
                        x2={control1?.x || transformedPoint.x}
                        y2={control1?.y || transformedPoint.y}
                        stroke="#ff2c3c"
                        strokeWidth="0.5"
                        strokeDasharray="2,2"
                        style={{ zIndex: 1 }}
                      />
                      <circle
                        cx={control1?.x || transformedPoint.x}
                        cy={control1?.y || transformedPoint.y}
                        r="1.5"
                        fill="#ff2c3c"
                        cursor="pointer"
                        style={{ zIndex: 2 }}
                        onMouseDown={() => handleMouseDown(index, true, 1)}
                      />
                      <line
                        x1={transformedPoint.x}
                        y1={transformedPoint.y}
                        x2={control2?.x || transformedPoint.x}
                        y2={control2?.y || transformedPoint.y}
                        stroke="#ff2c3c"
                        strokeWidth="0.5"
                        strokeDasharray="2,2"
                        style={{ zIndex: 1 }}
                      />
                      <circle
                        cx={control2?.x || transformedPoint.x}
                        cy={control2?.y || transformedPoint.y}
                        r="1.5"
                        fill="#ff2c3c"
                        cursor="pointer"
                        style={{ zIndex: 2 }}
                        onMouseDown={() => handleMouseDown(index, true, 2)}
                      />
                    </>
                  )}
                  <text
                    x={transformedPoint.x + 2}
                    y={transformedPoint.y - 2}
                    fontSize="4"
                    fill="#ff2c3c"
                  >
                    {index + 1}
                  </text>
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
