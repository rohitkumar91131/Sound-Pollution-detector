"use client"

import { useEffect, useRef, useState } from "react"

export default function CircularSoundMeter() {
  const [dB, setDb] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [warning, setWarning] = useState("Safe / Quiet")
  const [icon, setIcon] = useState("✅")
  const animationRef = useRef()
  const smoothedDb = useRef(0)
  const audioContextRef = useRef()
  const analyserRef = useRef()
  const dataArrayRef = useRef()
  const sourceRef = useRef()
  const canvasRef = useRef()

  const startMeter = async () => {
    if (isRunning) return
    setIsRunning(true)

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048
    const dataArray = new Uint8Array(analyser.fftSize)
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)

    audioContextRef.current = audioContext
    analyserRef.current = analyser
    dataArrayRef.current = dataArray
    sourceRef.current = source

    const updateMeter = () => {
      analyser.getByteTimeDomainData(dataArray)
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        const val = (dataArray[i] - 128) / 128
        sum += val * val
      }
      const rms = Math.sqrt(sum / dataArray.length)
      const decibels = 20 * Math.log10(rms)
      const clampedDb = Math.max(decibels, -100)

      smoothedDb.current = smoothedDb.current * 0.8 + (clampedDb + 100) * 0.2
      setDb(smoothedDb.current)

      if (smoothedDb.current <= 50) {
        setWarning("Safe / Quiet")
        setIcon("✅")
      } else if (smoothedDb.current <= 80) {
        setWarning("Moderate / Noticeable")
        setIcon("⚠️")
      } else {
        setWarning("Dangerous / Loud")
        setIcon("🔴")
      }

      drawMeter(smoothedDb.current)
      animationRef.current = requestAnimationFrame(updateMeter)
    }

    updateMeter()
  }

  const stopMeter = () => {
    setIsRunning(false)
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    audioContextRef.current?.close()
    setDb(0)
    smoothedDb.current = 0
    setWarning("Safe / Quiet")
    setIcon("✅")
    drawMeter(0)
  }

  useEffect(() => {
    drawMeter(0)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      audioContextRef.current?.close()
    }
  }, [])

  const drawMeter = (value) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const width = canvas.width
    const height = canvas.height
    const cx = width / 2
    const cy = height / 2
    const radius = Math.min(width, height) / 2 - 40

    ctx.clearRect(0, 0, width, height)

    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0.75 * Math.PI, 0.25 * Math.PI, false)
    ctx.lineWidth = 20
    ctx.strokeStyle = "#555"
    ctx.stroke()

    const endAngle = 0.75 * Math.PI + (value / 100) * 1.5 * Math.PI
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0.75 * Math.PI, endAngle, false)
    ctx.strokeStyle = value > 80 ? "red" : value > 50 ? "orange" : "green"
    ctx.lineWidth = 20
    ctx.stroke()

    const angle = 0.75 * Math.PI + (value / 100) * 1.5 * Math.PI
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + radius * 0.9 * Math.cos(angle), cy + radius * 0.9 * Math.sin(angle))
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 4
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(cx, cy, 10, 0, 2 * Math.PI)
    ctx.fillStyle = "#fff"
    ctx.fill()

    ctx.fillStyle = "#fff"
    ctx.font = "24px Arial"
    ctx.textAlign = "center"
    ctx.fillText(`${Math.round(value)} / 100 dB`, cx, cy + radius + 30)
  }

  return (
    <div className="w-[100dvw] h-[100dvh] flex flex-col justify-center items-center text-center p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <h1 className="text-3xl md:text-5xl font-bold mb-8 text-white">Sound Pollution Meter</h1>
      <canvas ref={canvasRef} className="w-80 h-80 md:w-96 md:h-96" width={400} height={400} />

      <div className="text-xl md:text-2xl mt-4 text-white">
        {icon} {warning}
      </div>

      {!isRunning ? (
        <button className="mt-6 px-6 py-3 text-lg md:text-xl rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white" onClick={startMeter}>
          Start
        </button>
      ) : (
        <button className="mt-6 px-6 py-3 text-lg md:text-xl rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white" onClick={stopMeter}>
          Stop
        </button>
      )}
    </div>
  )
}
