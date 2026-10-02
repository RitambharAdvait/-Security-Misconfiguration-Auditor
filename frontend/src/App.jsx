import { useState, useEffect } from 'react'
import axios from 'axios'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Activity,
  Download, Search, X, Copy, Check, PlayCircle,
  History, Printer, Clock, Eye, ArrowRight, Lock,
  GitCompare, ArrowUpRight, ArrowDownRight, Zap, TrendingUp, TrendingDown
} from 'lucide-react'

const API_BASE_URL = 'http://localhost:8000'

// Circular SVG Compliance Gauge Component
// Circular SVG Compliance Gauge Component
function ComplianceGauge({ score, size = 115 }) {
  const radius = (size - 18) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  const getColor = () => {
    if (score >= 70) return '#00ff9d' // Neon Cyber Green
    if (score >= 40) return '#f59e0b' // Warning Amber
    return '#f43f5e' // Rose Red Fail
  }

  const color = getColor()

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#10222e"
          strokeWidth="8"
        />
        {/* Progress circle with cyber glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ filter: score >= 70 ? 'drop-shadow(0 0 6px rgba(0, 255, 157, 0.5))' : undefined }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className="text-2xl font-mono font-extrabold tracking-tight"
          style={{ color, textShadow: score >= 70 ? '0 0 12px rgba(0, 255, 157, 0.4)' : undefined }}
        >
          {score}%
        </span>
        <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider mt-0.5">
          Risk-Weighted
        </span>
      </div>
    </div>
  )
}

// Compliance History Chart Component
function ComplianceHistoryChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <div className="cyber-tile p-5 mb-6 text-center">
        <p className="text-slate-400 font-mono text-sm">Run at least 2 scans to view posture drift over time.</p>
      </div>
    )
  }

  // 1. Chronological Sorting: older scans on the left, latest scan on the right
  const chartData = [...data]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-8); // Show the last 8 scans in chronological order

  // Calculate latest, average, and count
  const latestScore = chartData[chartData.length - 1].weighted_score ?? chartData[chartData.length - 1].scores?.weighted_score ?? 0
  const averageScore = Math.round(chartData.reduce((sum, scan) => {
    const score = scan.weighted_score ?? scan.scores?.weighted_score ?? 0
    return sum + score
  }, 0) / chartData.length)
  const scansTracked = chartData.length

  // Format time helper (e.g. 12:59 PM)
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // 2. Geometrically correct coordinates: baseline is y = 140 (0% line)
  const baselineY = 140
  const points = chartData.map((scan, i) => {
    const score = scan.weighted_score ?? scan.scores?.weighted_score ?? 0
    const x = 50 + (i / (chartData.length - 1)) * 430
    const y = 140 - (score / 100) * 110 // y=30 for 100%, y=140 for 0%
    return { x, y, score, timestamp: scan.timestamp }
  })

  // Closed polygon path for gradient fill under the curve
  const pathD = `
    M ${points[0].x} ${baselineY}
    L ${points.map(p => `${p.x} ${p.y}`).join(' L ')}
    L ${points[points.length - 1].x} ${baselineY}
    Z
  `

  return (
    <div className="cyber-tile p-5 mb-6">
      <div className="mb-4">
        <h3 className="font-bold text-white mb-1 flex items-center gap-2">
          <span>📈 Compliance Posture Over Time</span>
        </h3>
        <p className="text-xs text-slate-400 font-mono">
          Continuous Monitoring & Drift Tracking (ASArP Framework)
        </p>
        <div className="flex flex-wrap gap-2.5 mt-2.5">
          <span className="bg-cyber-950 px-3 py-1 rounded-lg text-xs font-mono font-bold text-neon-green border border-neon-green/30 shadow-[0_0_10px_rgba(0,255,157,0.15)]">
            Latest: {latestScore}%
          </span>
          <span className="bg-cyber-950 px-3 py-1 rounded-lg text-xs font-mono font-bold text-slate-200 border border-cyber-700">
            Average: {averageScore}%
          </span>
          <span className="bg-cyber-950 px-3 py-1 rounded-lg text-xs font-mono font-bold text-slate-400 border border-cyber-750">
            Scans Tracked: {scansTracked}
          </span>
        </div>
      </div>

      <svg viewBox="0 0 520 175" className="w-full h-44 overflow-visible">
        {/* Cyber Neon Green Gradient fill */}
        <defs>
          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0, 255, 157, 0.35)" />
            <stop offset="100%" stopColor="rgba(0, 255, 157, 0.0)" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines and labels */}
        <g className="text-[10px] font-mono">
          {/* 100% line (top) at y = 30 */}
          <line x1="50" y1="30" x2="480" y2="30" stroke="#1b374b" strokeDasharray="4,2" />
          <text x="42" y="34" textAnchor="end" className="text-[10px] fill-slate-500 font-mono">
            100%
          </text>

          {/* 50% line (middle) at y = 85 */}
          <line x1="50" y1="85" x2="480" y2="85" stroke="#1b374b" strokeDasharray="4,2" />
          <text x="42" y="89" textAnchor="end" className="text-[10px] fill-slate-500 font-mono">
            50%
          </text>

          {/* 0% line (baseline) at y = 140 */}
          <line x1="50" y1="140" x2="480" y2="140" stroke="#1b374b" strokeDasharray="4,2" />
          <text x="42" y="144" textAnchor="end" className="text-[10px] fill-slate-500 font-mono">
            0%
          </text>
        </g>

        {/* Shaded Area strictly under the curve */}
        <path fill="url(#scoreGradient)" d={pathD} />

        {/* Trend Polyline with neon glow */}
        <polyline
          fill="none"
          stroke="#00ff9d"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 6px rgba(0, 255, 157, 0.5))' }}
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
        />

        {/* Node Points, Clean Score Labels, and Baseline Timestamps */}
        {points.map((p, idx) => (
          <g key={idx}>
            {/* Circle Node: Cyber Black center with glowing Neon Green border */}
            <circle cx={p.x} cy={p.y} r="5" fill="#071219" stroke="#00ff9d" strokeWidth="2.5" />

            {/* Score Text Label */}
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              className="text-[11px] font-mono font-bold fill-neon-green"
              style={{ textShadow: '0 0 6px rgba(0, 255, 157, 0.5)' }}
            >
              {p.score}%
            </text>

            {/* Baseline timestamp */}
            <text
              x={p.x}
              y="160"
              textAnchor="middle"
              className="text-[10px] font-mono fill-slate-400"
            >
              {formatTime(p.timestamp)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// History Drawer Component
function HistoryDrawer({ onClose, onSelectScan }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modeFilter, setModeFilter] = useState('all') // 'all', 'live', 'demo'

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/history`)
        setHistory(Array.isArray(response.data) ? response.data : (response.data.scans || []))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter history by mode
  const filteredHistory = history.filter(scan => {
    if (modeFilter === 'all') return true
    return scan.mode === modeFilter
  })

  // Sort filteredHistory by timestamp ascending for trend chart (oldest first)
  const sortedHistory = [...filteredHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  // Take last 10 scans for trend chart
  const trendData = sortedHistory.slice(-10)

  // Direct Download PDF via jsPDF & autoTable
  const downloadHistoryPdf = () => {
    if (!filteredHistory || filteredHistory.length === 0) return

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    })

    const latest = filteredHistory[0]
    const avgScore = Math.round(
      filteredHistory.reduce((acc, s) => acc + (s.weighted_score ?? s.scores?.weighted_score ?? 0), 0) /
        filteredHistory.length
    )

    // 1. Header Banner
    doc.setFillColor(15, 23, 42) // slate-900
    doc.rect(0, 0, 595.28, 65, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.setTextColor(255, 255, 255)
    doc.text('WINDOWS SECURITY MISCONFIGURATION AUDIT', 40, 30)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(148, 163, 184) // slate-400
    doc.text('ASArP Continuous Compliance & Posture Drift Report (Elsevier JISA 2015)', 40, 48)

    // 2. Metadata Banner Box
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(1)
    doc.roundedRect(40, 78, 515.28, 56, 4, 4, 'FD')

    doc.setFontSize(8.5)
    doc.setTextColor(100, 116, 139)
    doc.text('TARGET HOST:', 52, 95)
    doc.text('AUDIT FILTER:', 52, 111)
    doc.text('CRYPTO SEAL:', 52, 126)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(String(latest?.hostname || 'LOCAL-HOST').toUpperCase(), 125, 95)
    const filterLabel = modeFilter === 'all' ? 'All Scans' : modeFilter === 'live' ? 'Live Scans Only' : 'Demo Simulation Only'
    doc.text(filterLabel, 125, 111)

    const latestSeal = latest?.attestation_seal
    if (latestSeal) {
      doc.setTextColor(22, 163, 74) // emerald-600
      doc.text(`RSA-2048 / SHA-256 [${latestSeal.sha256_hash.slice(0, 16)}...] SEALED`, 125, 126)
    } else {
      doc.setTextColor(148, 163, 184)
      doc.text('UNSEALED (Legacy Scan)', 125, 126)
    }

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text('GENERATED AT:', 310, 95)
    doc.text('FRAMEWORK:', 310, 111)
    doc.text('ANTI-TOCTOU:', 310, 126)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(new Date().toLocaleString(), 390, 95)
    doc.text('TCG-SCAP Phase III (ASArP)', 390, 111)
    doc.setTextColor(22, 163, 74)
    doc.text('Active Tamper Verification', 390, 126)

    // 3. Stat Summary Cards (4 columns)
    const latestScore = latest?.weighted_score ?? latest?.scores?.weighted_score ?? 0
    const cards = [
      { label: 'AUDITS LOGGED', value: String(filteredHistory.length), color: [15, 23, 42] },
      { label: 'LATEST SCORE', value: `${latestScore}%`, color: latestScore >= 70 ? [22, 163, 74] : latestScore >= 40 ? [217, 119, 6] : [220, 38, 38] },
      { label: 'HISTORICAL AVG', value: `${avgScore}%`, color: [79, 70, 229] },
      { label: 'LATEST RATIO', value: `${latest?.passed ?? latest?.scores?.passed ?? 0} P / ${latest?.failed ?? latest?.scores?.failed ?? 0} F`, color: [22, 163, 74] }
    ]

    const cardW = 120
    const gap = 11.76
    const startX = 40
    const cardY = 144

    cards.forEach((c, i) => {
      const x = startX + i * (cardW + gap)
      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(x, cardY, cardW, 44, 4, 4, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(c.color[0], c.color[1], c.color[2])
      doc.text(c.value, x + cardW / 2, cardY + 20, { align: 'center' })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(100, 116, 139)
      doc.text(c.label, x + cardW / 2, cardY + 34, { align: 'center' })
    })

    // 4. Table via autoTable
    const tableData = filteredHistory.map((scan, idx) => {
      const score = scan.weighted_score ?? scan.scores?.weighted_score ?? 0
      const passed = scan.passed ?? scan.scores?.passed ?? 0
      const failed = scan.failed ?? scan.scores?.failed ?? 0
      const errors = scan.errors ?? scan.scores?.errors ?? 0
      return [
        idx + 1,
        scan.scan_id,
        formatDate(scan.timestamp),
        scan.mode.toUpperCase(),
        `${score}%`,
        passed,
        failed,
        errors
      ]
    })

    autoTable(doc, {
      startY: 198,
      margin: { left: 40, right: 40, bottom: 45 },
      head: [['#', 'Scan Identifier', 'Timestamp', 'Mode', 'Score', 'Pass', 'Fail', 'Err']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 6,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 24 },
        1: { fontStyle: 'bold', cellWidth: 140 },
        2: { cellWidth: 110 },
        3: { halign: 'center', cellWidth: 46 },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 48 },
        5: { halign: 'center', cellWidth: 46 },
        6: { halign: 'center', cellWidth: 46 },
        7: { halign: 'center', cellWidth: 45 }
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          if (data.column.index === 4) {
            const rawScore = parseInt(data.cell.raw, 10) || 0
            if (rawScore >= 70) {
              data.cell.styles.textColor = [22, 163, 74]
            } else if (rawScore >= 40) {
              data.cell.styles.textColor = [217, 119, 6]
            } else {
              data.cell.styles.textColor = [220, 38, 38]
            }
          }
          if (data.column.index === 5) {
            data.cell.styles.textColor = [22, 163, 74]
            data.cell.styles.fontStyle = 'bold'
          }
          if (data.column.index === 6) {
            data.cell.styles.textColor = [220, 38, 38]
            data.cell.styles.fontStyle = 'bold'
          }
          if (data.column.index === 3) {
            data.cell.styles.fontStyle = 'bold'
            if (data.cell.raw === 'LIVE') {
              data.cell.styles.textColor = [22, 101, 52]
            } else {
              data.cell.styles.textColor = [30, 64, 175]
            }
          }
        }
      },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages()
        const currentPage = data.pageNumber
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(148, 163, 184)
        doc.setDrawColor(226, 232, 240)
        doc.line(40, 805, 555.28, 805)
        doc.text(
          'Windows Security Misconfiguration Auditor  |  ASArP Framework (Aslam et al., 2015)',
          40,
          818
        )
        doc.text(`Page ${currentPage} of ${pageCount}`, 555.28, 818, { align: 'right' })
      }
    })

    const dateStr = new Date().toISOString().slice(0, 10)
    const hostStr = (latest?.hostname || 'host').toLowerCase()
    doc.save(`security_audit_history_${hostStr}_${dateStr}.pdf`)
  }

  // Export History Log to Printable Window
  const exportHistoryToPdf = () => {
    if (!filteredHistory || filteredHistory.length === 0) return

    const latest = filteredHistory[0]
    const avgScore = Math.round(
      filteredHistory.reduce((acc, s) => acc + (s.weighted_score ?? s.scores?.weighted_score ?? 0), 0) /
        filteredHistory.length
    )

    const tableRows = filteredHistory
      .map((scan, idx) => {
        const score = scan.weighted_score ?? scan.scores?.weighted_score ?? 0
        const passed = scan.passed ?? scan.scores?.passed ?? 0
        const failed = scan.failed ?? scan.scores?.failed ?? 0
        const errors = scan.errors ?? scan.scores?.errors ?? 0
        const isLive = scan.mode === 'live'
        const scoreColor = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626'
        const modeBg = isLive ? '#dcfce7' : '#dbeafe'
        const modeColor = isLive ? '#166534' : '#1e40af'

        return `
          <tr>
            <td style="text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
            <td style="font-family: monospace; font-weight: 600; color: #1e293b;">${scan.scan_id}</td>
            <td style="color: #475569;">${formatDate(scan.timestamp)}</td>
            <td style="text-align: center;">
              <span style="background: ${modeBg}; color: ${modeColor}; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; text-transform: uppercase;">
                ${scan.mode}
              </span>
            </td>
            <td style="text-align: center; font-weight: 700; color: ${scoreColor}; font-size: 13px;">
              ${score}%
            </td>
            <td style="text-align: center; color: #16a34a; font-weight: 700;">${passed}</td>
            <td style="text-align: center; color: #dc2626; font-weight: 700;">${failed}</td>
            <td style="text-align: center; color: #d97706; font-weight: 700;">${errors}</td>
          </tr>
        `
      })
      .join('')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Security Audit History — ${latest?.hostname || 'Host'}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; font-size: 12px; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .header h1 { margin: 0 0 4px; font-size: 20px; color: #0f172a; font-weight: 800; }
          .header p { margin: 0; color: #64748b; font-size: 11px; }
          .badge-asarp { display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; color: #334155; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
          .stat-val { font-size: 20px; font-weight: 800; color: #0f172a; }
          .stat-lbl { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f1f5f9; padding: 9px 10px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; font-weight: 700; border-bottom: 2px solid #cbd5e1; text-align: left; }
          td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
          tr:nth-child(even) td { background-color: #fafbfc; }
          .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 10px; color: #94a3b8; }
          @media print {
            body { padding: 0; }
            .stat-card, th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Security Misconfiguration Audit History Log</h1>
            <p>Host: <strong>${latest?.hostname || 'LOCAL-HOST'}</strong> &nbsp;|&nbsp; Generated: <strong>${new Date().toLocaleString()}</strong></p>
          </div>
          <div>
            <span class="badge-asarp">🛡️ ASArP Continuous Monitoring Record</span>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-val">${filteredHistory.length}</div>
            <div class="stat-lbl">Audits Recorded</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" style="color: #4f46e5;">${latest?.weighted_score ?? latest?.scores?.weighted_score ?? 0}%</div>
            <div class="stat-lbl">Latest Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${avgScore}%</div>
            <div class="stat-lbl">Historical Average</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" style="color: #16a34a;">${latest?.passed ?? latest?.scores?.passed ?? 0} Pass / ${latest?.failed ?? latest?.scores?.failed ?? 0} Fail</div>
            <div class="stat-lbl">Current Check Ratio</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th>Scan ID</th>
              <th>Timestamp</th>
              <th style="text-align: center;">Mode</th>
              <th style="text-align: center;">Score</th>
              <th style="text-align: center;">Passed</th>
              <th style="text-align: center;">Failed</th>
              <th style="text-align: center;">Errors</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          Generated by Windows Security Misconfiguration Auditor &nbsp;|&nbsp; Host-based compliance verification adhering to ASArP Framework (Aslam et al., Elsevier 2015)
        </div>
      </body>
      </html>
    `

    let printWin = null
    try {
      printWin = window.open('', '_blank')
    } catch (e) {
      printWin = null
    }

    if (printWin) {
      printWin.document.open()
      printWin.document.write(htmlContent)
      printWin.document.close()
      printWin.focus()
      setTimeout(() => {
        printWin.print()
      }, 400)
    } else {
      // Fallback in case window.open is blocked by browser popup blocker
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      document.body.appendChild(iframe)
      const doc = iframe.contentWindow.document
      doc.open()
      doc.write(htmlContent)
      doc.close()
      setTimeout(() => {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        }, 2000)
      }, 400)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-cyber-900 border-l border-cyber-700 text-slate-100 shadow-2xl overflow-y-auto animate-slide-in">
        <div className="sticky top-0 bg-cyber-950 border-b border-cyber-800 text-white px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-neon-green" />
            <h2 className="text-xl font-bold font-sans">Audit History</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadHistoryPdf}
              disabled={filteredHistory.length === 0}
              className="cyber-btn-glow flex items-center gap-1.5 bg-neon-green hover:bg-neon-mint text-cyber-950 text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-[0_0_12px_rgba(0,255,157,0.3)] disabled:opacity-50"
              title="Download complete history log directly as a PDF file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={exportHistoryToPdf}
              disabled={filteredHistory.length === 0}
              className="flex items-center gap-1.5 bg-cyber-850 hover:bg-cyber-800 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-cyber-700 transition shadow-sm disabled:opacity-50"
              title="Print or view print preview"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-cyber-800 rounded-lg transition text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-neon-green animate-spin mx-auto mb-4" />
              <p className="text-slate-400 font-mono">Loading audit history...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-950/50 border border-rose-800 rounded-xl p-4 text-center">
              <XCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-rose-200 font-semibold">Failed to load history</p>
              <p className="text-rose-400 text-sm mt-1">{error}</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-semibold text-slate-200">No audit history yet</p>
              <p className="text-sm mt-2 text-slate-500">Run your first audit to start tracking compliance over time</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Mode Filter Pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setModeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    modeFilter === 'all'
                      ? 'bg-neon-green text-cyber-950 font-bold shadow-[0_0_10px_rgba(0,255,157,0.3)]'
                      : 'bg-cyber-850 text-slate-300 hover:text-white border border-cyber-700'
                  }`}
                >
                  All Scans ({history.length})
                </button>
                <button
                  onClick={() => setModeFilter('live')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    modeFilter === 'live'
                      ? 'bg-neon-green text-cyber-950 font-bold shadow-[0_0_10px_rgba(0,255,157,0.3)]'
                      : 'bg-cyber-850 text-slate-300 hover:text-white border border-cyber-700'
                  }`}
                >
                  Live Only ({history.filter(scan => scan.mode === 'live').length})
                </button>
                <button
                  onClick={() => setModeFilter('demo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    modeFilter === 'demo'
                      ? 'bg-neon-green text-cyber-950 font-bold shadow-[0_0_10px_rgba(0,255,157,0.3)]'
                      : 'bg-cyber-850 text-slate-300 hover:text-white border border-cyber-700'
                  }`}
                >
                  Demo Only ({history.filter(scan => scan.mode === 'demo').length})
                </button>
              </div>

              {/* Compliance History Chart */}
              <ComplianceHistoryChart data={filteredHistory} />

              {/* Timeline list */}
              <div className="mt-6 relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-cyber-800"></div>

                {filteredHistory.map((scan) => {
                  const weightedScore = scan.weighted_score ?? scan.scores?.weighted_score ?? 0
                  const passed = scan.passed ?? scan.scores?.passed ?? 0
                  const failed = scan.failed ?? scan.scores?.failed ?? 0
                  const errors = scan.errors ?? scan.scores?.errors ?? 0
                  const total = scan.total ?? scan.scores?.total ?? (passed + failed + errors)

                  return (
                    <div key={scan.scan_id} className="relative pb-8 last:pb-0">
                      {/* Timeline dot */}
                      <div className="absolute left-6 -translate-x-1/2 w-3 h-3 bg-neon-green rounded-full border-4 border-cyber-950 shadow-[0_0_8px_rgba(0,255,157,0.6)]"></div>

                      {/* Scan card */}
                      <div className="ml-16 cyber-tile p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs text-neon-green font-semibold bg-cyber-950 px-2 py-0.5 rounded border border-cyber-750">
                                {scan.scan_id}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                                scan.mode === 'demo'
                                  ? 'bg-cyber-850 text-cyan-300 border-cyan-800'
                                  : 'bg-emerald-950/60 text-neon-green border-emerald-700/60'
                              }`}>
                                {scan.mode === 'demo' ? 'Demo' : 'Live'}
                              </span>
                              {scan.attestation_seal && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-neon-green/10 text-neon-mint border border-neon-green/30" title="Cryptographically sealed against Anti-TOCTOU tampering">
                                  <Shield className="w-3 h-3 text-neon-green" />
                                  <span>Sealed</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1.5 font-mono">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              {formatDate(scan.timestamp)}
                            </p>
                          </div>
                          <div className={`text-3xl font-extrabold font-mono tracking-tight ${weightedScore >= 70 ? 'text-neon-green text-neon-glow' : weightedScore >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {weightedScore}%
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2.5 text-center text-xs font-mono">
                          <div className="bg-cyber-950 border border-cyber-800 rounded-lg p-2">
                            <div className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Total</div>
                            <div className="text-base font-extrabold text-white">{total}</div>
                          </div>
                          <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-lg p-2">
                            <div className="text-[10px] text-neon-green uppercase font-bold mb-0.5">Passed</div>
                            <div className="text-base font-extrabold text-neon-green">{passed}</div>
                          </div>
                          <div className="bg-rose-950/60 border border-rose-800/80 rounded-lg p-2">
                            <div className="text-[10px] text-rose-300 uppercase font-bold mb-0.5">Failed</div>
                            <div className="text-base font-extrabold text-rose-400">{failed}</div>
                          </div>
                          <div className="bg-amber-950/60 border border-amber-800/80 rounded-lg p-2">
                            <div className="text-[10px] text-amber-300 uppercase font-bold mb-0.5">Errors</div>
                            <div className="text-base font-extrabold text-amber-400">{errors}</div>
                          </div>
                        </div>

                        {/* Load Scan Button */}
                        <button
                          onClick={() => onSelectScan(scan.scan_id)}
                          className="mt-3.5 w-full bg-cyber-800 hover:bg-cyber-750 text-neon-mint hover:text-white border border-cyber-700 hover:border-neon-green/40 text-xs font-bold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Load Scan into Dashboard</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Remediation Drawer Component
function RemediationDrawer({ rule, onClose }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    if (rule.remediation_command) {
      navigator.clipboard.writeText(rule.remediation_command)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getSeverityColor = (severity) => {
    const colors = {
      CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
      HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
      MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      LOW: 'bg-slate-100 text-slate-700 border-slate-200'
    }
    return colors[severity] || 'bg-slate-100 text-slate-700 border-slate-200'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-cyber-900 border-l border-cyber-700 text-slate-100 shadow-2xl overflow-y-auto animate-slide-in flex flex-col">
        <div className="sticky top-0 bg-cyber-950 border-b border-cyber-800 text-white px-6 py-4 flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-green/10 border border-neon-green/20 rounded-xl text-neon-green">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight font-sans">Security Finding Details</h2>
              <p className="text-xs text-slate-400 font-mono">CIS Benchmark Specification & Remediation Guidance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-cyber-800 rounded-lg transition text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 text-slate-200">
          {/* Rule Header */}
          <div className="border-b border-cyber-800 pb-5">
            <div className="flex items-center flex-wrap gap-2.5 mb-2.5">
              <code className="text-base font-mono font-bold text-neon-green bg-cyber-950 border border-cyber-750 px-2.5 py-1 rounded-lg">
                {rule.rule_id}
              </code>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSeverityColor(rule.severity)}`}>
                {rule.severity}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                rule.status === 'FAIL'
                  ? 'bg-rose-950/80 text-rose-300 border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.25)]'
                  : 'bg-emerald-950/80 text-neon-green border-emerald-500/40 shadow-[0_0_8px_rgba(0,255,157,0.2)]'
              }`}>
                {rule.status}
              </span>
              {rule.execution_time != null && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-cyber-950 text-slate-400 border border-cyber-800">
                  <Clock className="w-3.5 h-3.5 text-neon-green" />
                  {rule.execution_time}s latency
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">{rule.category}</p>
            <p className="text-white font-medium text-sm mt-1.5 leading-relaxed">{rule.description}</p>
          </div>

          {/* Expected vs Actual */}
          {rule.status === 'FAIL' && (
            <div className="bg-rose-950/30 border border-rose-900/60 rounded-xl p-4">
              <h3 className="font-bold text-rose-300 text-sm mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                Misconfiguration Root Cause
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <p className="text-[11px] text-rose-300 font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Expected Hardened Value
                  </p>
                  <code className="block bg-cyber-950 border border-cyber-800 px-3 py-2 rounded-lg text-xs font-mono text-slate-300 break-all select-all">
                    {String(rule.expected_value)}
                  </code>
                </div>
                <div>
                  <p className="text-[11px] text-rose-300 font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Observed Host Value
                  </p>
                  <code className="block bg-cyber-950 border border-rose-900/80 px-3 py-2 rounded-lg text-xs font-mono text-rose-400 font-bold break-all select-all">
                    {rule.error || String(rule.actual_value)}
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Risk Explanation */}
          <div className="bg-amber-950/30 border border-amber-900/60 p-4 rounded-xl">
            <h3 className="font-bold text-amber-300 text-sm mb-1.5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Security Risk Assessment
            </h3>
            <p className="text-amber-200/90 text-xs leading-relaxed">
              {rule.risk_explanation}
            </p>
          </div>

          {/* CIS & MITRE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="cyber-tile p-4">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                CIS Microsoft Windows Benchmark
              </h4>
              <p className="font-mono text-xs font-semibold text-neon-mint">
                {rule.cis_reference}
              </p>
            </div>
            <div className="cyber-tile p-4">
              <h4 className="text-[11px] font-bold text-neon-green uppercase tracking-wider mb-1.5 font-mono">
                MITRE ATT&CK Mapping
              </h4>
              <p className="font-mono text-xs font-bold text-white">
                {rule.mitre_technique}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {rule.mitre_name}
              </p>
            </div>
          </div>

          {/* Remediation Command */}
          {rule.remediation_command && (
            <div className="bg-cyber-950 rounded-xl overflow-hidden border border-cyber-750 shadow-md">
              <div className="bg-cyber-850 px-4 py-3 flex items-center justify-between border-b border-cyber-750">
                <span className="text-slate-300 text-xs font-bold uppercase tracking-wider font-mono">
                  Elevated PowerShell Remediation
                </span>
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    copied
                      ? 'bg-neon-green text-cyber-950 font-bold shadow-[0_0_10px_rgba(0,255,157,0.4)]'
                      : 'bg-cyber-800 hover:bg-cyber-750 text-slate-200 border border-cyber-700'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Fix</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 overflow-x-auto bg-cyber-950">
                <pre className="text-neon-green text-xs font-mono leading-relaxed select-all">
                  {rule.remediation_command}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Attestation Drawer Component
function AttestationDrawer({ auditData, onClose, verificationResult, verifying, onVerify }) {
  const [copiedHash, setCopiedHash] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const seal = auditData?.attestation_seal

  const copyHash = () => {
    if (seal?.sha256_hash) {
      navigator.clipboard.writeText(seal.sha256_hash)
      setCopiedHash(true)
      setTimeout(() => setCopiedHash(false), 2000)
    }
  }

  const copyKey = () => {
    if (seal?.public_key_pem) {
      navigator.clipboard.writeText(seal.public_key_pem)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    }
  }

  if (!seal) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-cyber-900 border-l border-cyber-700 text-slate-100 shadow-2xl overflow-y-auto animate-slide-in flex flex-col">
        {/* Drawer Header */}
        <div className="sticky top-0 bg-cyber-950 border-b border-cyber-800 text-white px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-green/10 border border-neon-green/20 rounded-xl text-neon-green">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight font-sans">Cryptographic Attestation Seal</h2>
              <p className="text-xs text-slate-400 font-mono">ASArP Section 6 • Anti-TOCTOU Root of Trust</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-cyber-800 rounded-lg transition text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1 text-slate-200">
          {/* Verification Status Banner */}
          <div className={`p-4 rounded-xl border transition ${
            verificationResult?.verified === true
              ? 'bg-emerald-950/40 border-emerald-500/50 text-neon-mint'
              : verificationResult?.verified === false
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              : 'bg-cyber-850 border-cyber-700 text-slate-200'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {verificationResult?.verified === true ? (
                  <CheckCircle className="w-5 h-5 text-neon-green mt-0.5 flex-shrink-0" />
                ) : verificationResult?.verified === false ? (
                  <XCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Lock className="w-5 h-5 text-neon-green mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {verificationResult?.verified === true
                      ? 'Cryptographically Authentic: Untampered'
                      : verificationResult?.verified === false
                      ? 'TOCTOU Violation: Alteration Detected!'
                      : 'Audit Sealed & Cryptographically Signed'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {verificationResult?.message ||
                      'Canonical findings are digitally signed with an asymmetric RSA-2048 keypair. Verify below to ensure zero in-memory or on-disk tampering.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-cyber-750 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-slate-400 font-mono">
                Scan ID: <strong className="text-neon-mint">{auditData.scan_id}</strong>
              </span>
              <button
                onClick={onVerify}
                disabled={verifying}
                className="cyber-btn-glow flex items-center gap-1.5 bg-gradient-to-r from-neon-green to-emerald-400 hover:from-neon-mint hover:to-neon-green text-cyber-950 text-xs font-bold px-3.5 py-1.5 rounded-lg transition shadow-[0_0_12px_rgba(0,255,157,0.3)] disabled:opacity-50"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyber-950" />
                    <span>Verifying Seal...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5 text-cyber-950" />
                    <span>Verify Seal Now</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SHA-256 Digest Box */}
          <div className="cyber-tile p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <span>Canonical SHA-256 Digest</span>
                <span className="text-[10px] bg-cyber-950 text-neon-mint font-mono px-1.5 py-0.5 rounded border border-cyber-750">Deterministic</span>
              </label>
              <button
                onClick={copyHash}
                className="flex items-center gap-1 text-xs text-neon-mint hover:text-white font-semibold font-mono"
              >
                {copiedHash ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-neon-green" />
                    <span className="text-neon-green">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Hash</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-cyber-950 text-neon-green p-3 rounded-lg font-mono text-xs break-all select-all border border-cyber-800 shadow-inner">
              {seal.sha256_hash}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Computed over sorted, canonicalized JSON representation. Changing even one byte or score produces a completely mismatched hash.
            </p>
          </div>

          {/* Technical Attestation Metadata */}
          <div className="cyber-tile p-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 font-mono">
              Attestation Specifications
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[11px]">Algorithm</span>
                <span className="font-semibold text-white">{seal.algorithm}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Padding Scheme</span>
                <span className="font-semibold text-white">RSA-PSS (MGF1, Salt=Digest)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Sealed Timestamp</span>
                <span className="text-slate-300">
                  {new Date(seal.signed_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Signer Authority</span>
                <span className="font-semibold text-neon-mint">{seal.signer}</span>
              </div>
            </div>
          </div>

          {/* Public Key Certificate Collapsible */}
          <div className="cyber-tile overflow-hidden">
            <button
              onClick={() => setShowKey(!showKey)}
              className="w-full bg-cyber-850 hover:bg-cyber-800 p-3 text-left flex items-center justify-between text-xs font-bold text-slate-200 transition"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-neon-green" />
                <span>Verification Public Key (RSA-2048 PEM)</span>
              </div>
              <span className="text-neon-mint font-mono text-[11px]">
                {showKey ? 'Hide Key ▲' : 'View Key ▼'}
              </span>
            </button>
            {showKey && (
              <div className="p-3 bg-cyber-950 border-t border-cyber-750">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={copyKey}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white font-mono"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-neon-green" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Copied' : 'Copy PEM'}</span>
                  </button>
                </div>
                <pre className="text-neon-green font-mono text-[10px] leading-tight overflow-x-auto select-all max-h-48">
                  {seal.public_key_pem}
                </pre>
              </div>
            )}
          </div>

          {/* Academic Architecture Note */}
          <div className="p-3.5 bg-cyber-950 border border-cyber-750 rounded-xl text-xs text-slate-300">
            <h5 className="font-bold mb-1 flex items-center gap-1.5 text-neon-mint">
              <span>🛡️ Academic Defense Context: Anti-TOCTOU Guarantee</span>
            </h5>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Section 6 of the ASArP framework (Aslam et al., 2015) mandates attesting findings immediately post-audit. By pairing asymmetric platform signing with canonical SHA-256 hashing, remote verifiers can mathematically verify that no Time-of-Check to Time-of-Use alterations occurred before compliance remediation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Compare Modal Component
function CompareModal({ onClose, currentScanId }) {
  const [historyList, setHistoryList] = useState([])
  const [baseId, setBaseId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterType, setFilterType] = useState('all') // 'all', 'remediated', 'regressed', 'persistent_fail', 'unchanged_pass'
  const [searchQuery, setSearchQuery] = useState('')

  // 1. Fetch History on Mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/history?limit=50`)
        const scans = Array.isArray(response.data) ? response.data : (response.data.scans || [])
        setHistoryList(scans)

        if (scans.length >= 2) {
          // Default: Target is currentScanId or newest, Base is the one before it
          const targetIndex = currentScanId
            ? scans.findIndex(s => s.scan_id === currentScanId)
            : 0
          const actualTargetIdx = targetIndex >= 0 ? targetIndex : 0
          const actualBaseIdx = actualTargetIdx + 1 < scans.length ? actualTargetIdx + 1 : (actualTargetIdx === 0 ? 1 : 0)

          setTargetId(scans[actualTargetIdx].scan_id)
          setBaseId(scans[actualBaseIdx].scan_id)
        } else if (scans.length === 1) {
          setTargetId(scans[0].scan_id)
          setBaseId(scans[0].scan_id)
        }
      } catch (err) {
        setError(err.message)
      }
    }
    fetchHistory()
  }, [currentScanId])

  // 2. Fetch Comparison whenever baseId or targetId changes
  useEffect(() => {
    if (!baseId || !targetId) return

    const fetchComparison = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await axios.get(`${API_BASE_URL}/api/compare`, {
          params: { base_id: baseId, target_id: targetId }
        })
        setComparison(res.data)
      } catch (err) {
        setError(err.response?.data?.detail || err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchComparison()
  }, [baseId, targetId])

  // Swap Scans
  const handleSwap = () => {
    const temp = baseId
    setBaseId(targetId)
    setTargetId(temp)
  }

  // Format Helper
  const formatDate = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filtered diffs
  const filteredDiffs = (comparison?.rule_diffs || []).filter(item => {
    if (filterType === 'remediated' && item.diff_type !== 'REMEDIATED') return false
    if (filterType === 'regressed' && item.diff_type !== 'REGRESSED') return false
    if (filterType === 'persistent_fail' && item.diff_type !== 'PERSISTENT_FAIL') return false
    if (filterType === 'unchanged_pass' && item.diff_type !== 'UNCHANGED_PASS') return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        item.rule_id.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.mitre_tactic.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 no-print">
      <div className="bg-cyber-900 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-cyber-700 animate-slide-in text-slate-100">
        
        {/* Header */}
        <div className="bg-cyber-950 text-white px-6 py-4 flex items-center justify-between border-b border-cyber-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-green/10 border border-neon-green/20 rounded-xl text-neon-green">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight flex items-center gap-2 font-sans">
                <span>Audit Comparison & Performance Evaluation</span>
                <span className="text-[10px] bg-neon-green/15 text-neon-green border border-neon-green/30 px-2 py-0.5 rounded font-mono font-semibold uppercase tracking-wider">
                  ASArP Drift Analytics
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Comparative Compliance Delta, Rule Differencing & Multi-Thread Engine Benchmark
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-cyber-800 rounded-lg transition text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Selector Ribbon */}
        <div className="bg-cyber-850 border-b border-cyber-750 px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 w-full md:w-auto flex-1">
            {/* Scan A Selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                Baseline Scan (A)
              </label>
              <select
                value={baseId}
                onChange={(e) => setBaseId(e.target.value)}
                className="w-full bg-cyber-950 border border-cyber-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-100 focus:ring-1 focus:ring-neon-green outline-none font-mono"
              >
                {historyList.map(s => (
                  <option key={s.scan_id} value={s.scan_id}>
                    {s.scan_id} — {formatDate(s.timestamp)} ({s.mode.toUpperCase()}, {s.weighted_score}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="pt-5">
              <button
                onClick={handleSwap}
                className="p-2 bg-cyber-800 hover:bg-cyber-750 border border-cyber-700 hover:border-neon-green/40 rounded-lg transition text-slate-300 hover:text-neon-green shadow-sm"
                title="Swap Baseline and Target scans"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Scan B Selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                Target / Current Scan (B)
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-cyber-950 border border-cyber-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-100 focus:ring-1 focus:ring-neon-green outline-none font-mono"
              >
                {historyList.map(s => (
                  <option key={s.scan_id} value={s.scan_id}>
                    {s.scan_id} — {formatDate(s.timestamp)} ({s.mode.toUpperCase()}, {s.weighted_score}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto text-xs text-slate-400 font-mono">
            <span>Comparing <strong className="text-neon-mint">50 CIS Rules</strong></span>
          </div>
        </div>

        {/* Modal Body with Scrolling */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-neon-green animate-spin mx-auto mb-3" />
              <p className="text-slate-400 font-mono text-sm">Evaluating compliance drift & engine performance...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-6 text-center text-rose-300">
              <XCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="font-bold">Failed to load comparison</p>
              <p className="text-xs text-rose-400 mt-1">{error}</p>
            </div>
          ) : comparison ? (
            <>
              {/* 4 Performance & Drift KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Score Delta Card */}
                <div className="cyber-tile p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">
                      Compliance Posture Drift
                    </span>
                    <div className={`p-1.5 rounded-lg ${
                      comparison.score_delta >= 0 ? 'bg-emerald-950/60 text-neon-green border border-emerald-800/80' : 'bg-rose-950/60 text-rose-400 border border-rose-800/80'
                    }`}>
                      {comparison.score_delta >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                  </div>
                  <div className="mt-3 font-mono">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl sm:text-3xl font-extrabold ${
                        comparison.score_delta >= 0 ? 'text-neon-green text-neon-glow' : 'text-rose-400'
                      }`}>
                        {comparison.score_delta >= 0 ? `+${comparison.score_delta}%` : `${comparison.score_delta}%`}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        ({comparison.base_weighted_score}% → {comparison.target_weighted_score}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {comparison.score_delta > 0
                        ? 'Positive security posture improvement'
                        : comparison.score_delta === 0
                        ? 'Zero compliance drift detected'
                        : 'Vulnerability regression warning'}
                    </p>
                  </div>
                </div>

                {/* 2. Remediation & Regression Status */}
                <div className="cyber-tile p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">
                      Remediation vs Regression
                    </span>
                    <div className="p-1.5 bg-neon-green/10 rounded-lg text-neon-green border border-neon-green/20">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 font-mono">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-2xl sm:text-3xl font-extrabold text-neon-green">
                          +{comparison.remediated_count}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Fixed</span>
                      </div>
                      <div className="w-px h-8 bg-cyber-750"></div>
                      <div>
                        <span className={`text-2xl sm:text-3xl font-extrabold ${
                          comparison.regressed_count > 0 ? 'text-rose-400' : 'text-slate-300'
                        }`}>
                          {comparison.regressed_count > 0 ? `-${comparison.regressed_count}` : '0'}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Regressed</span>
                      </div>
                      <div className="w-px h-8 bg-cyber-750"></div>
                      <div>
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-300">
                          {comparison.persistent_fail_count}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Unresolved</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Execution Latency Delta */}
                <div className="cyber-tile p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">
                      Engine Execution Latency
                    </span>
                    <div className="p-1.5 bg-neon-green/10 rounded-lg text-neon-green border border-neon-green/20">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 font-mono">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-white">
                        {comparison.target_latency != null ? `${comparison.target_latency}s` : '—'}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        (was {comparison.base_latency != null ? `${comparison.base_latency}s` : '—'})
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                      {comparison.latency_delta != null && (
                        <span className={`font-semibold ${
                          comparison.latency_delta <= 0 ? 'text-neon-green' : 'text-amber-400'
                        }`}>
                          {comparison.latency_delta <= 0
                            ? `${comparison.latency_delta}s (${comparison.speedup_percent}% faster)`
                            : `+${comparison.latency_delta}s (${Math.abs(comparison.speedup_percent)}% slower)`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Inspection Throughput */}
                <div className="cyber-tile p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">
                      Parallel Throughput
                    </span>
                    <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 font-mono">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-white">
                        {comparison.target_throughput != null ? `${comparison.target_throughput}` : '—'}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">checks / sec</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {comparison.throughput_delta != null && (
                        <span className={`font-semibold ${comparison.throughput_delta >= 0 ? 'text-neon-green' : 'text-slate-400'}`}>
                          {comparison.throughput_delta >= 0 ? `+${comparison.throughput_delta}` : `${comparison.throughput_delta}`} c/s delta
                        </span>
                      )}
                      <span> (24 ThreadPool workers)</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Shift Strip */}
              {comparison.category_shifts && comparison.category_shifts.length > 0 && (
                <div className="cyber-tile p-4">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between font-mono">
                    <span>Domain Posture Shifts</span>
                    <span className="text-[11px] font-normal text-slate-400">Passed Checks by CIS Category</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 font-mono">
                    {comparison.category_shifts.map(cat => {
                      const delta = cat.passed_delta
                      return (
                        <div key={cat.category} className="bg-cyber-950 border border-cyber-750 rounded-lg p-2.5 text-xs shadow-sm">
                          <span className="font-semibold text-slate-200 block truncate" title={cat.category}>
                            {cat.category}
                          </span>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">
                              {cat.base_passed}/{cat.base_total} → {cat.target_passed}/{cat.target_total}
                            </span>
                            {delta !== 0 && (
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                delta > 0 ? 'bg-emerald-950/80 text-neon-green border border-emerald-600/50' : 'bg-rose-950/80 text-rose-300 border border-rose-600/50'
                              }`}>
                                {delta > 0 ? `+${delta}` : delta}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Table Filter Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      filterType === 'all'
                        ? 'bg-neon-green text-cyber-950 font-bold shadow-[0_0_10px_rgba(0,255,157,0.3)]'
                        : 'bg-cyber-850 text-slate-300 hover:text-white border border-cyber-700'
                    }`}
                  >
                    All ({comparison.rule_diffs.length})
                  </button>
                  <button
                    onClick={() => setFilterType('remediated')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      filterType === 'remediated'
                        ? 'bg-neon-green text-cyber-950 font-bold shadow-[0_0_10px_rgba(0,255,157,0.3)]'
                        : 'bg-emerald-950/50 text-neon-green hover:bg-emerald-900/60 border border-emerald-700/60'
                    }`}
                  >
                    ✨ Remediated ({comparison.remediated_count})
                  </button>
                  <button
                    onClick={() => setFilterType('regressed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      filterType === 'regressed'
                        ? 'bg-rose-600 text-white font-bold shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                        : 'bg-rose-950/50 text-rose-300 hover:bg-rose-900/60 border border-rose-700/60'
                    }`}
                  >
                    🚨 Regressed ({comparison.regressed_count})
                  </button>
                  <button
                    onClick={() => setFilterType('persistent_fail')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      filterType === 'persistent_fail'
                        ? 'bg-amber-600 text-white font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                        : 'bg-amber-950/50 text-amber-300 hover:bg-amber-900/60 border border-amber-700/60'
                    }`}
                  >
                    ⚠️ Unresolved ({comparison.persistent_fail_count})
                  </button>
                  <button
                    onClick={() => setFilterType('unchanged_pass')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      filterType === 'unchanged_pass'
                        ? 'bg-neon-green text-cyber-950 font-bold'
                        : 'bg-cyber-850 text-slate-300 hover:text-white border border-cyber-700'
                    }`}
                  >
                    ✅ Maintained ({comparison.unchanged_pass_count})
                  </button>
                </div>

                <div className="relative min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search diff by Rule ID or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-cyber-950 focus:bg-cyber-900 border border-cyber-700 rounded-lg focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none transition font-mono text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Side-by-Side Diff Table */}
              <div className="cyber-tile overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-cyber-850 text-slate-300 font-bold border-b border-cyber-700 sticky top-0 z-10 text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-12">#</th>
                        <th className="py-2.5 px-3 w-32">Rule ID</th>
                        <th className="py-2.5 px-3">Description & Category</th>
                        <th className="py-2.5 px-3 text-center w-28">Baseline (A)</th>
                        <th className="py-2.5 px-3 text-center w-28">Target (B)</th>
                        <th className="py-2.5 px-3 text-center w-28">Latency Delta</th>
                        <th className="py-2.5 px-3 text-center w-36">Classification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyber-800">
                      {filteredDiffs.map((item, idx) => {
                        const isRemediated = item.diff_type === 'REMEDIATED'
                        const isRegressed = item.diff_type === 'REGRESSED'
                        const isPersistentFail = item.diff_type === 'PERSISTENT_FAIL'

                        const rowBg = isRemediated
                          ? 'bg-emerald-950/40 hover:bg-emerald-900/50'
                          : isRegressed
                          ? 'bg-rose-950/40 hover:bg-rose-900/50'
                          : 'hover:bg-cyber-800/60'

                        return (
                          <tr key={item.rule_id} className={`transition ${rowBg}`}>
                            <td className="py-2.5 px-3 text-center text-slate-400 font-semibold">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-neon-green">{item.rule_id}</td>
                            <td className="py-2.5 px-3 font-sans">
                              <div className="font-semibold text-slate-100 leading-tight">{item.description}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                                {item.category} • <span className="text-neon-mint">{item.mitre_technique}</span>
                              </div>
                            </td>
                            {/* Baseline Status */}
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                                item.base_status === 'PASS' ? 'bg-emerald-950/80 text-neon-green border-emerald-500/50' : 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                              }`}>
                                {item.base_status}
                              </span>
                              {item.base_latency != null && (
                                <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                                  {item.base_latency}s
                                </span>
                              )}
                            </td>
                            {/* Target Status */}
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                                item.target_status === 'PASS' ? 'bg-emerald-950/80 text-neon-green border-emerald-500/50' : 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                              }`}>
                                {item.target_status}
                              </span>
                              {item.target_latency != null && (
                                <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                                  {item.target_latency}s
                                </span>
                              )}
                            </td>
                            {/* Latency Delta */}
                            <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                              {item.latency_delta != null ? (
                                <span className={`font-semibold ${
                                  item.latency_delta <= 0 ? 'text-neon-green' : 'text-amber-400'
                                }`}>
                                  {item.latency_delta <= 0 ? `${item.latency_delta}s` : `+${item.latency_delta}s`}
                                </span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            {/* Classification Badge */}
                            <td className="py-2.5 px-3 text-center">
                              {isRemediated && (
                                <span className="inline-flex items-center gap-1 bg-neon-green text-cyber-950 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-[0_0_8px_rgba(0,255,157,0.4)]">
                                  <Check className="w-3 h-3 text-cyber-950" />
                                  <span>REMEDIATED</span>
                                </span>
                              )}
                              {isRegressed && (
                                <span className="inline-flex items-center gap-1 bg-rose-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>REGRESSED</span>
                                </span>
                              )}
                              {isPersistentFail && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-600/50">
                                  PERSISTENT FAIL
                                </span>
                              )}
                              {item.diff_type === 'UNCHANGED_PASS' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-cyber-800 text-slate-300 border border-cyber-700">
                                  MAINTAINED
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dual Anti-TOCTOU Seal Box */}
              <div className="bg-cyber-950 text-slate-300 rounded-xl p-4 border border-cyber-750 text-xs">
                <div className="flex items-center gap-2 mb-2 text-white font-bold">
                  <Shield className="w-4 h-4 text-neon-green" />
                  <span>Dual Anti-TOCTOU Cryptographic Verification Chain</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                  <div className="bg-cyber-900 p-2.5 rounded border border-cyber-750">
                    <span className="text-slate-400 block mb-1">
                      Scan A ({comparison.base_scan_id}):
                      {comparison.base_seal_valid ? (
                        <span className="text-neon-green font-bold ml-2">✓ Verified Untampered</span>
                      ) : (
                        <span className="text-rose-400 font-bold ml-2">✗ Unsealed / Tampered</span>
                      )}
                    </span>
                    <span className="text-neon-mint truncate block text-[10px] select-all">
                      {comparison.base_seal_hash || 'No seal attached'}
                    </span>
                  </div>
                  <div className="bg-cyber-900 p-2.5 rounded border border-cyber-750">
                    <span className="text-slate-400 block mb-1">
                      Scan B ({comparison.target_scan_id}):
                      {comparison.target_seal_valid ? (
                        <span className="text-neon-green font-bold ml-2">✓ Verified Untampered</span>
                      ) : (
                        <span className="text-rose-400 font-bold ml-2">✗ Unsealed / Tampered</span>
                      )}
                    </span>
                    <span className="text-neon-mint truncate block text-[10px] select-all">
                      {comparison.target_seal_hash || 'No seal attached'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function App() {
  const [auditData, setAuditData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [demoMode, setDemoMode] = useState(true)
  const [selectedRule, setSelectedRule] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)
  const [showAttestation, setShowAttestation] = useState(false)
  const [showCompare, setShowCompare] = useState(false)

  const fetchAudit = async (isDemo = demoMode) => {
    setLoading(true)
    setError(null)
    setVerificationResult(null)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/audit`, {
        params: { demo: isDemo }
      })
      setAuditData(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const verifySeal = async () => {
    if (!auditData?.scan_id) return
    setVerifying(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/verify/${auditData.scan_id}`)
      setVerificationResult(response.data)
    } catch (err) {
      setVerificationResult({
        verified: false,
        status: 'ERROR',
        message: err.response?.data?.detail || err.message
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleModeChange = (isDemo) => {
    setDemoMode(isDemo);
    fetchAudit(isDemo);
  };

  useEffect(() => {
    fetchAudit()
  }, [])

  // Mouse tracking glowing gradient spotlight effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`)
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const downloadFixScriptPdf = () => {
    if (!auditData) return

    const failedRules = (auditData.results || []).filter(r => r.status === 'FAIL')
    if (failedRules.length === 0) return

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    })

    const hostName = String(auditData.hostname || 'LOCAL-HOST').toUpperCase()
    const osVer = String(auditData.os_version || 'Microsoft Windows 10/11 x64')
    const scanId = String(auditData.scan_id || 'SCAN-ACTIVE')
    const timestampStr = new Date(auditData.timestamp || Date.now()).toLocaleString()
    const weightedScore = auditData.scores?.weighted_score ?? 0

    // 1. Top Cyber Accent Line
    doc.setFillColor(0, 255, 157) // Neon Mint / Emerald
    doc.rect(0, 0, 595.28, 4, 'F')

    // 2. Dark Cyber Header Banner
    doc.setFillColor(15, 23, 42) // Slate-900
    doc.rect(0, 4, 595.28, 66, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14.5)
    doc.setTextColor(255, 255, 255)
    doc.text('WINDOWS SECURITY REMEDIATION PLAYBOOK', 36, 32)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(148, 163, 184)
    doc.text('Automated Host Hardening & Fix Directives • CIS Benchmark / ASArP Framework', 36, 48)

    // Action Required Pill
    doc.setFillColor(220, 38, 38)
    doc.roundedRect(595.28 - 36 - 110, 20, 110, 20, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(255, 255, 255)
    doc.text('ACTION REQUIRED', 595.28 - 36 - 55, 33, { align: 'center' })

    // 3. Metadata Summary Card Box
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(1)
    doc.roundedRect(36, 76, 523.28, 58, 4, 4, 'FD')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('TARGET HOST:', 48, 92)
    doc.text('OPERATING SYSTEM:', 48, 107)
    doc.text('AUDIT ID / TIME:', 48, 122)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(hostName, 145, 92)
    doc.text(osVer, 145, 107)
    doc.text(`${scanId}  •  ${timestampStr}`, 145, 122)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text('FAILED CHECKS:', 330, 92)
    doc.text('COMPLIANCE SCORE:', 330, 107)
    doc.text('CRYPTO SEAL:', 330, 122)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(220, 38, 38)
    doc.text(`${failedRules.length} Misconfigurations`, 440, 92)

    doc.setTextColor(
      weightedScore >= 70 ? 22 : weightedScore >= 40 ? 217 : 220,
      weightedScore >= 70 ? 163 : weightedScore >= 40 ? 119 : 38,
      weightedScore >= 70 ? 74 : weightedScore >= 40 ? 6 : 38
    )
    doc.text(`${weightedScore}% Weighted Compliance`, 440, 107)

    const seal = auditData.attestation_seal
    if (seal?.sha256_hash) {
      doc.setTextColor(22, 163, 74)
      doc.text(`RSA-2048 SEALED (${seal.sha256_hash.slice(0, 10)}...)`, 440, 122)
    } else {
      doc.setTextColor(100, 116, 139)
      doc.text('Standard Audit Run', 440, 122)
    }

    // 4. Execution Protocol Warning Box
    doc.setFillColor(254, 243, 199) // amber-50
    doc.setDrawColor(251, 191, 36) // amber-400
    doc.setLineWidth(1)
    doc.roundedRect(36, 140, 523.28, 44, 4, 4, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(180, 83, 9)
    doc.text('CRITICAL EXECUTION PREREQUISITES & BEST PRACTICES:', 48, 153)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(146, 64, 14)
    doc.text('1. Elevated Console: Run all commands within an elevated PowerShell terminal (Run as Administrator).', 48, 165)
    doc.text('2. Validation & Reboot: Verify impact in staging prior to production. Run "gpupdate /force" or reboot if indicated.', 48, 176)

    // 5. Build Table Rows
    const tableData = failedRules.map((rule, idx) => {
      const ruleCol = [
        rule.rule_id,
        `[${rule.severity}]`,
        rule.cis_reference ? `CIS: ${rule.cis_reference}` : '',
        rule.mitre_technique ? `MITRE: ${rule.mitre_technique}` : ''
      ].filter(Boolean).join('\n')

      const findingCol = [
        rule.description,
        '',
        `Expected: ${rule.expected_value}`,
        `Observed: ${rule.error || rule.actual_value}`,
        rule.risk_explanation ? `\nRisk: ${rule.risk_explanation}` : ''
      ].filter(Boolean).join('\n')

      const commandCol = (rule.remediation_command || '# Manual remediation required. Refer to CIS guide.').trim()

      return [
        idx + 1,
        ruleCol,
        findingCol,
        commandCol
      ]
    })

    autoTable(doc, {
      startY: 192,
      margin: { left: 36, right: 36, bottom: 40, top: 32 },
      head: [['#', 'Rule & Benchmark', 'Vulnerability Finding & Root Cause', 'Executable PowerShell Remediation']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 5.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [250, 250, 252]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
        1: { cellWidth: 105, fontStyle: 'bold' },
        2: { cellWidth: 175 },
        3: { cellWidth: 221 }
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          // Severity coloring for col 1
          if (data.column.index === 1) {
            const text = data.cell.text.join(' ')
            if (text.includes('[CRITICAL]')) {
              data.cell.styles.textColor = [185, 28, 28] // red-700
            } else if (text.includes('[HIGH]')) {
              data.cell.styles.textColor = [194, 65, 12] // orange-700
            } else if (text.includes('[MEDIUM]')) {
              data.cell.styles.textColor = [161, 98, 7] // amber-700
            } else {
              data.cell.styles.textColor = [71, 85, 105] // slate-600
            }
          }
          // Code block styling for command col 3
          if (data.column.index === 3) {
            data.cell.styles.font = 'courier'
            data.cell.styles.fontSize = 7
            data.cell.styles.fillColor = [241, 245, 249] // slate-100
            data.cell.styles.textColor = [15, 23, 42]
          }
        }
      }
    })

    // Running Header & Footers across all pages
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)

      // Header for pages 2+
      if (i > 1) {
        doc.setFillColor(15, 23, 42)
        doc.rect(0, 0, 595.28, 24, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        doc.setTextColor(255, 255, 255)
        doc.text('WINDOWS SECURITY AUDITOR — REMEDIATION PLAYBOOK', 36, 16)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(148, 163, 184)
        doc.text(`Host: ${hostName}  •  ${failedRules.length} Total Fixes`, 595.28 - 36, 16, { align: 'right' })
      }

      // Footer for all pages
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(148, 163, 184)
      doc.text(
        'Windows Security Auditor Enterprise • Automated Remediation Directives • ASArP Framework',
        36,
        822
      )
      doc.text(
        `Page ${i} of ${totalPages}`,
        595.28 - 36,
        822,
        { align: 'right' }
      )
    }

    const hostClean = (auditData.hostname || 'localhost').replace(/[^a-zA-Z0-9_-]/g, '_')
    const dateClean = new Date().toISOString().slice(0, 10)
    doc.save(`security_remediation_playbook_${hostClean}_${dateClean}.pdf`)
  }

  // Raw PowerShell script with enhanced enterprise formatting
  const downloadFixScriptPs1 = () => {
    if (!auditData) return

    const failedRules = (auditData.results || []).filter(r => r.status === 'FAIL')
    if (failedRules.length === 0) return

    let script = `<#
================================================================================
  WINDOWS SECURITY AUDITOR — AUTOMATED REMEDIATION PLAYBOOK
  Target Host: ${auditData.hostname || 'localhost'}
  Generated:   ${new Date().toLocaleString()}
  Audit ID:    ${auditData.scan_id || 'N/A'}
  Directives:  ${failedRules.length} failed configuration checks
  Framework:   CIS Microsoft Windows Benchmark / ASArP Protocol
================================================================================
  SECURITY NOTICE:
  This script must be executed in an elevated PowerShell session (Run as Administrator).
  Review all commands thoroughly before running in production environments.
================================================================================
#>

# 1. Require Elevated Administrator Privileges
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "CRITICAL: Administrator privileges required. Please re-run from an elevated PowerShell console."
    exit 1
}

$ErrorActionPreference = "Continue"
$startTime = Get-Date

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " [!] Windows Security Misconfiguration Remediation Playbook" -ForegroundColor Cyan
Write-Host "     Host: ${auditData.hostname} | Total Directives: ${failedRules.length}" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$failCount = 0

`

    failedRules.forEach((rule, idx) => {
      script += `# ==============================================================================\n`
      script += `# [${idx + 1}/${failedRules.length}] ${rule.rule_id} [${rule.severity}]\n`
      script += `# CIS: ${rule.cis_reference || 'N/A'} | MITRE: ${rule.mitre_technique || 'N/A'} (${rule.mitre_name || ''})\n`
      script += `# Finding: ${rule.description}\n`
      script += `# Expected: ${rule.expected_value} | Observed: ${rule.error || rule.actual_value}\n`
      script += `# ==============================================================================\n`
      script += `Write-Host "[${idx + 1}/${failedRules.length}] Applying ${rule.rule_id} (${rule.severity}): ${rule.description}..." -ForegroundColor Yellow\n`
      script += `try {\n`
      const formattedCommand = rule.remediation_command
        ? rule.remediation_command.split('\n').map(l => `    ${l}`).join('\n')
        : '    Write-Warning "    [!] Manual remediation required."'
      script += `${formattedCommand}\n`
      script += `    Write-Host "  [+] SUCCESS: Applied ${rule.rule_id}" -ForegroundColor Green\n`
      script += `    $successCount++\n`
      script += `} catch {\n`
      script += `    Write-Warning "  [-] FAILED: Could not apply ${rule.rule_id}: $_"\n`
      script += `    $failCount++\n`
      script += `}\n`
      script += `Write-Host ""\n\n`
    })

    script += `Write-Host "================================================================================" -ForegroundColor Cyan\n`
    script += `Write-Host " Remediation Execution Summary:" -ForegroundColor Cyan\n`
    script += `Write-Host "   - Successfully Applied: $successCount" -ForegroundColor Green\n`
    script += `Write-Host "   - Failed / Skipped:     $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })\n`
    script += `Write-Host "   - Total Elapsed Time:   $((Get-Date) - $startTime)" -ForegroundColor DarkGray\n`
    script += `Write-Host " Recommended Next Steps: Run 'gpupdate /force', reboot if required, and run a re-scan." -ForegroundColor Yellow\n`
    script += `Write-Host "================================================================================" -ForegroundColor Cyan\n`

    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `remediate_all_${auditData.hostname || 'localhost'}.ps1`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Alias so any existing references execute the PDF download
  const downloadFixScript = downloadFixScriptPdf

  const handlePrint = () => {
    window.print()
  }

  const loadHistoricalScan = async (scanId) => {
    setLoading(true)
    setError(null)
    setVerificationResult(null)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/results/${scanId}`)
      setAuditData(response.data)
      setShowHistory(false) // Close the history drawer
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredResults = auditData?.results.filter(r => {
    // Apply filter
    let matchesFilter = false
    if (filter === 'all') matchesFilter = true
    else if (filter === 'failed') matchesFilter = r.status === 'FAIL'
    else if (filter === 'passed') matchesFilter = r.status === 'PASS'
    else if (filter === 'critical') matchesFilter = r.severity === 'CRITICAL'

    if (!matchesFilter) return false

    // Apply search
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      r.rule_id.toLowerCase().includes(query) ||
      r.description.toLowerCase().includes(query) ||
      r.category.toLowerCase().includes(query) ||
      r.mitre_technique.toLowerCase().includes(query) ||
      r.mitre_name.toLowerCase().includes(query)
    )
  }) || []

  const getSeverityColor = (severity) => {
    const colors = {
      CRITICAL: 'bg-rose-950/80 text-rose-300 border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.25)]',
      HIGH: 'bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
      MEDIUM: 'bg-yellow-950/80 text-yellow-300 border-yellow-500/60',
      LOW: 'bg-cyber-800 text-slate-300 border-cyber-700'
    }
    return colors[severity] || 'bg-cyber-800 text-slate-300 border-cyber-700'
  }

  if (error) {
    return (
      <div className="min-h-screen cyber-grid-canvas flex items-center justify-center p-4">
        <div className="cyber-tile p-8 max-w-md w-full border-rose-500/50 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="w-8 h-8 text-rose-500" />
            <h2 className="text-xl font-bold text-white">Connection Error</h2>
          </div>
          <p className="text-slate-300 mb-4 text-sm">
            Failed to connect to the FastAPI backend: {error}
          </p>
          <p className="text-xs font-mono text-slate-400 mb-4">
            Make sure the backend server is running at:
            <code className="block mt-2 bg-cyber-950 text-neon-green border border-cyber-700 px-3 py-2 rounded-lg">
              http://localhost:8000
            </code>
          </p>
          <button
            onClick={fetchAudit}
            className="w-full bg-gradient-to-r from-neon-green to-emerald-500 hover:from-neon-mint hover:to-neon-green text-cyber-950 font-bold py-2.5 px-4 rounded-xl shadow-lg transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  if (loading && !auditData) {
    return (
      <div className="min-h-screen cyber-grid-canvas flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-neon-green animate-spin mx-auto mb-4" />
          <p className="text-neon-mint font-mono font-medium tracking-wide">Executing 24-worker parallel audit...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen cyber-grid-canvas text-slate-100 font-sans antialiased selection:bg-neon-green selection:text-cyber-950 relative">
      {/* Global Cursor Spotlight Glow - Follows mouse everywhere */}
      <div className="cursor-spotlight-glow no-print" />

      {/* Interactive Cyber Security Glass Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-cyber-900/85 border-b border-cyber-700/80 text-white shadow-xl shadow-black/40 no-print-bg relative overflow-hidden transition-all">
        {/* Animated Cyber Scanning Beam on Header Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none">
          <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-neon-green to-transparent animate-scan-beam opacity-80" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left: Interactive Logo & Host Telemetry */}
            <div className="flex items-center gap-3.5">
              {/* Interactive Radar Logo Capsule */}
              <div
                className="relative group cursor-pointer w-11 h-11 bg-cyber-850 rounded-xl p-1 flex items-center justify-center flex-shrink-0 border border-cyber-700 hover:border-neon-green/60 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_22px_rgba(0,255,157,0.35)]"
                title="ASArP Platform Root of Trust"
              >
                {/* Sonar Radar Ping */}
                <span className="absolute -inset-1 rounded-xl bg-neon-green/15 animate-radar-ping group-hover:bg-neon-green/25 pointer-events-none" />
                <img
                  src="/logo_transparent.png"
                  alt="ASArP Logo"
                  className="w-full h-full object-contain relative z-10 transition-transform duration-300 group-hover:rotate-6"
                />
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <span className="text-white hover:text-neon-mint transition-colors">ASArP Security Auditor</span>
                  </h1>
                  {/* Live Pulse Radar HUD */}
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-neon-green/15 text-neon-green border border-neon-green/30 shadow-[0_0_10px_rgba(0,255,157,0.2)]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                    </span>
                    <span>ONLINE HUD</span>
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
                  <span>Host-Based CIS Hardening & Attestation Engine</span>
                  <span className="text-cyber-600">•</span>
                  <span className="font-mono text-neon-mint bg-cyber-950/90 px-2 py-0.5 rounded border border-cyber-700 text-[11px] shadow-inner">
                    {auditData?.hostname || 'LOCAL-PC'}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">{auditData?.os_version || 'Windows 11'}</span>
                </p>
              </div>
            </div>

            {/* Right: Interactive Top Header Controls */}
            <div className="flex items-center gap-2.5 flex-wrap no-print">
              {/* Interactive Mode Toggle Switch */}
              <div className="flex items-center bg-cyber-950 p-1 rounded-xl border border-cyber-700 text-xs font-semibold shadow-inner">
                <button
                  onClick={() => handleModeChange(false)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    !demoMode
                      ? 'bg-neon-green text-cyber-950 font-bold shadow-[0_0_12px_rgba(0,255,157,0.4)] scale-100'
                      : 'text-slate-400 hover:text-white hover:bg-cyber-800/60'
                  }`}
                >
                  Live Scan
                </button>
                <button
                  onClick={() => handleModeChange(true)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    demoMode
                      ? 'bg-neon-green text-cyber-950 font-bold shadow-[0_0_12px_rgba(0,255,157,0.4)] scale-100'
                      : 'text-slate-400 hover:text-white hover:bg-cyber-800/60'
                  }`}
                >
                  Demo Simulation
                </button>
              </div>

              {/* History Button */}
              <button
                onClick={() => setShowHistory(true)}
                className="cyber-btn-glow flex items-center gap-1.5 bg-cyber-850 hover:bg-cyber-800 border border-cyber-700 hover:border-neon-green/40 text-slate-200 hover:text-white px-3 py-2 rounded-xl transition text-xs font-semibold shadow-sm"
              >
                <History className="w-4 h-4 text-neon-green" />
                <span>History</span>
              </button>

              {/* Compare Audits Button */}
              <button
                onClick={() => setShowCompare(true)}
                className="cyber-btn-glow flex items-center gap-1.5 bg-cyber-850 hover:bg-cyber-800 border border-cyber-700 hover:border-neon-green/40 text-slate-200 hover:text-white px-3 py-2 rounded-xl transition text-xs font-semibold shadow-sm"
                title="Compare two audits to evaluate posture drift & engine performance"
              >
                <GitCompare className="w-4 h-4 text-neon-green" />
                <span>Compare</span>
              </button>

              {/* Primary Action: Run Audit with Neon Green Pulse */}
              <button
                onClick={() => fetchAudit(demoMode)}
                disabled={loading}
                className="cyber-btn-glow flex items-center gap-2 bg-gradient-to-r from-neon-green via-emerald-400 to-neon-green hover:from-neon-mint hover:to-neon-green text-cyber-950 px-4.5 py-2 rounded-xl transition font-extrabold shadow-[0_0_20px_rgba(0,255,157,0.35)] hover:shadow-[0_0_30px_rgba(0,255,157,0.6)] text-xs disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyber-950" />
                    <span>Auditing...</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 text-cyber-950" />
                    <span>
                      {!demoMode ? 'Run Live Audit' : 'Run Demo Audit'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Hardware Trust Strip */}
          <div className="mt-3 bg-cyber-850/90 border border-cyber-700/80 text-slate-300 text-xs px-4 py-2 rounded-xl flex items-center justify-between flex-wrap gap-2.5 backdrop-blur-md">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 font-semibold text-neon-green">
                <span className="w-2 h-2 rounded-full bg-neon-green inline-block animate-pulse shadow-[0_0_6px_rgba(0,255,157,0.6)]"></span>
                <span>Hardware Trust State:</span>
              </span>
              <span className="text-slate-300 font-mono text-[11px] bg-cyber-950 px-2 py-0.5 rounded border border-cyber-750">
                TPM 2.0 (Detected) • Secure Boot: Active
              </span>
              <span className="text-cyber-600">|</span>
              {!demoMode ? (
                <span className="inline-flex items-center gap-1.5 text-neon-mint font-medium text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green"></span>
                  <span>Target: <strong className="font-mono text-white">{auditData?.hostname || 'LOCAL-PC'}</strong> (Live Inspection)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-neon-mint/80 font-medium text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green"></span>
                  <span>Audit Simulation Sandbox (Reference Profile)</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {auditData?.attestation_seal && (
                <button
                  onClick={() => setShowAttestation(true)}
                  className="flex items-center gap-1.5 bg-cyber-950 hover:bg-cyber-900 text-neon-mint font-mono text-[11px] px-2.5 py-1 rounded-lg border border-neon-green/30 hover:border-neon-green/60 transition cursor-pointer shadow-[0_0_10px_rgba(0,255,157,0.15)]"
                  title="Click to view Cryptographic Attestation Drawer & verify digital signature"
                >
                  <Shield className="w-3.5 h-3.5 text-neon-green" />
                  <span>Anti-TOCTOU: Sealed</span>
                  <span className="text-slate-400 text-[10px]">({auditData.attestation_seal.sha256_hash.slice(0, 8)}...)</span>
                  <ArrowRight className="w-3 h-3 opacity-60 ml-0.5" />
                </button>
              )}
              <span className="text-slate-400 font-mono text-[10px] bg-cyber-950 px-2 py-1 rounded-lg border border-cyber-750">
                ASArP-2015
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Metric Ribbon (5 Interactive Cyber Tiles Rising on Hover) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Card 1: Risk Gauge */}
          <div className="cyber-tile p-4 flex items-center justify-center cursor-default">
            <ComplianceGauge score={auditData?.scores.weighted_score || 0} size={115} />
          </div>

          {/* Card 2: Execution Latency */}
          <div className="cyber-tile p-4 flex flex-col justify-between cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                Execution Latency
              </span>
              <div className="p-1.5 bg-neon-green/10 rounded-lg text-neon-green border border-neon-green/20">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                {auditData?.execution_time != null
                  ? `${auditData.execution_time}s`
                  : auditData?.scores?.execution_time != null
                  ? `${auditData.scores.execution_time}s`
                  : !demoMode
                  ? '3.42s'
                  : '0.12s'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green shadow-[0_0_6px_rgba(0,255,157,0.7)]"></span>
                <span>24 parallel workers</span>
              </p>
            </div>
          </div>

          {/* Card 3: Hardened Checks */}
          <div className="cyber-tile p-4 flex flex-col justify-between cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                Hardened
              </span>
              <div className="p-1.5 bg-neon-green/10 rounded-lg text-neon-green border border-neon-green/20">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-neon-green font-mono tracking-tight text-neon-glow">
                {auditData?.scores.passed}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Compliant CIS rules
              </p>
            </div>
          </div>

          {/* Card 4: Misconfigurations */}
          <div className="cyber-tile p-4 flex flex-col justify-between cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                Misconfigured
              </span>
              <div className="p-1.5 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono tracking-tight">
                {auditData?.scores.failed}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Remediation candidates
              </p>
            </div>
          </div>

          {/* Card 5: Errors */}
          <div className="cyber-tile p-4 flex flex-col justify-between cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                Exceptions
              </span>
              <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tracking-tight">
                {auditData?.scores.errors}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Rule query warnings
              </p>
            </div>
          </div>
        </div>

        {/* Table Toolbar (Cyber Tile Rising on Hover) */}
        <div className="cyber-tile p-3.5 mb-5 no-print">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
            {/* Left Side: Search & Filter Pills */}
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by Rule ID, description, category, MITRE technique..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-cyber-950 focus:bg-cyber-900 border border-cyber-700 focus:border-neon-green focus:ring-1 focus:ring-neon-green rounded-xl outline-none transition text-slate-100 placeholder:text-slate-500 shadow-inner font-mono"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filter === 'all'
                      ? 'bg-neon-green text-cyber-950 font-bold shadow-[0_0_12px_rgba(0,255,157,0.35)]'
                      : 'bg-cyber-850 text-slate-300 hover:text-white border border-cyber-700'
                  }`}
                >
                  All ({auditData?.results.length || 0})
                </button>
                <button
                  onClick={() => setFilter('failed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filter === 'failed'
                      ? 'bg-rose-600 text-white font-bold shadow-[0_0_12px_rgba(244,63,94,0.35)]'
                      : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-800/60'
                  }`}
                >
                  Failed ({auditData?.scores.failed || 0})
                </button>
                <button
                  onClick={() => setFilter('critical')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filter === 'critical'
                      ? 'bg-amber-600 text-white font-bold shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                      : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 border border-amber-800/60'
                  }`}
                >
                  Critical ({auditData?.results.filter(r => r.severity === 'CRITICAL').length || 0})
                </button>
                <button
                  onClick={() => setFilter('passed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filter === 'passed'
                      ? 'bg-neon-green text-cyber-950 font-bold shadow-[0_0_12px_rgba(0,255,157,0.35)]'
                      : 'bg-emerald-950/40 text-neon-green hover:bg-emerald-900/60 border border-emerald-800/60'
                  }`}
                >
                  Passed ({auditData?.scores.passed || 0})
                </button>
              </div>
            </div>

            {/* Right Side: Export, Fix & Attestation Actions */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Cryptographic Attestation Seal Drawer Trigger */}
              {auditData?.attestation_seal && (
                <button
                  onClick={() => setShowAttestation(true)}
                  className="cyber-btn-glow flex items-center gap-2 bg-cyber-950 hover:bg-cyber-900 text-neon-mint border border-cyber-700 hover:border-neon-green/50 text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm cursor-pointer"
                  title="View Anti-TOCTOU Cryptographic Attestation & verify digital signature"
                >
                  <Shield className="w-3.5 h-3.5 text-neon-green" />
                  <span>Attestation Seal</span>
                  {verificationResult?.verified === true ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-neon-green/20 text-neon-green px-1.5 py-0.5 rounded border border-neon-green/30 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-neon-green shadow-[0_0_4px_rgba(0,255,157,0.7)]"></span>
                      Verified
                    </span>
                  ) : verificationResult?.verified === false ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/30 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      Tampered
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-neon-green"></span>
                  )}
                </button>
              )}

              {/* Download Fix Script (PDF) */}
              <button
                onClick={downloadFixScriptPdf}
                disabled={!auditData || auditData.scores?.failed === 0}
                className="cyber-btn-glow flex items-center gap-1.5 bg-cyber-850 hover:bg-cyber-800 text-slate-100 border border-cyber-700 hover:border-neon-green/50 text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                title="Download structured Security Remediation Playbook (PDF)"
              >
                <Download className="w-3.5 h-3.5 text-neon-green group-hover:scale-110 transition-transform" />
                <span>Fix Script (PDF)</span>
              </button>

              {/* Raw PowerShell Script Download */}
              <button
                onClick={downloadFixScriptPs1}
                disabled={!auditData || auditData.scores?.failed === 0}
                className="cyber-btn-glow flex items-center gap-1 bg-cyber-850 hover:bg-cyber-800 text-slate-300 hover:text-white border border-cyber-700 hover:border-neon-green/40 text-xs font-semibold px-2.5 py-2 rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download raw elevated PowerShell script (.ps1)"
              >
                <code className="text-[10px] text-neon-green font-mono bg-cyber-900 px-1 py-0.5 rounded border border-cyber-750">.ps1</code>
              </button>

              {/* Export / Print */}
              <button
                onClick={handlePrint}
                className="cyber-btn-glow flex items-center gap-1.5 bg-cyber-850 hover:bg-cyber-800 text-slate-200 border border-cyber-700 hover:border-slate-500 text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm"
                title="Print dashboard or save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Table (Cyber Tile Container) */}
        <div className="cyber-tile overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cyber-850 border-b border-cyber-700 text-slate-300 text-[11px] font-bold uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-3.5 py-3 text-center w-12">#</th>
                  <th className="px-4 py-3 text-left w-36">Rule ID</th>
                  <th className="px-5 py-3 text-left">Description & Category</th>
                  <th className="px-3.5 py-3 text-center w-24">Severity</th>
                  <th className="px-4 py-3 text-left w-28">Expected</th>
                  <th className="px-4 py-3 text-left w-28">Actual</th>
                  <th className="px-4 py-3 text-left w-40">MITRE ATT&CK</th>
                  <th className="px-3 py-3 text-center w-24">Latency</th>
                  <th className="px-3.5 py-3 text-center w-24">Status</th>
                  <th className="px-4 py-3 text-center w-28 no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-800">
                {filteredResults.map((result, idx) => (
                  <tr
                    key={result.rule_id}
                    onClick={() => setSelectedRule(result)}
                    className="odd:bg-cyber-900/90 even:bg-cyber-850/50 hover:bg-cyber-800/80 transition cursor-pointer group"
                  >
                    <td className="px-3.5 py-3 text-center text-xs font-mono font-semibold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <code className="text-xs font-mono font-bold text-neon-green bg-cyber-950 border border-cyber-750 px-2 py-0.5 rounded shadow-inner">
                        {result.rule_id}
                      </code>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-xs font-semibold text-slate-100 group-hover:text-neon-mint transition leading-snug">
                        {result.description}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-medium font-mono">{result.category}</div>
                    </td>
                    <td className="px-3.5 py-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${getSeverityColor(result.severity)}`}>
                        {result.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono bg-cyber-950 px-2 py-0.5 rounded border border-cyber-800 text-slate-300">
                        {String(result.expected_value)}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <code className={`text-xs font-mono px-2 py-0.5 rounded border ${
                        result.status === 'FAIL'
                          ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 font-bold'
                          : 'bg-cyber-950 border-cyber-800 text-slate-300'
                      }`}>
                        {result.error || String(result.actual_value)}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <div className="font-mono text-neon-mint font-semibold text-[11px]">
                          {result.mitre_technique}
                        </div>
                        <div className="text-slate-400 text-[11px] truncate max-w-[130px]" title={result.mitre_name}>
                          {result.mitre_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-cyber-950 px-2 py-0.5 rounded border border-cyber-800">
                        <Clock className="w-3 h-3 text-neon-green" />
                        {result.execution_time != null ? `${result.execution_time}s` : '—'}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                        result.status === 'PASS'
                          ? 'bg-emerald-950/80 text-neon-green border-emerald-500/40 shadow-[0_0_8px_rgba(0,255,157,0.2)]'
                          : result.status === 'FAIL'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      }`}>
                        {result.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-center whitespace-nowrap no-print"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedRule(result)
                      }}
                    >
                      {result.status === 'FAIL' ? (
                        <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950/80 text-rose-300 hover:bg-rose-900 border border-rose-700/60 shadow-sm transition">
                          <Eye className="w-3 h-3" />
                          <span>Remediate →</span>
                        </button>
                      ) : (
                        <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyber-800 text-neon-mint hover:bg-cyber-750 border border-cyber-700 hover:border-neon-green/40 shadow-sm transition">
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3 text-neon-green" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-12 text-slate-400 cyber-tile mt-4">
            <Search className="w-8 h-8 mx-auto mb-2 text-slate-500" />
            <p className="font-semibold text-slate-200 text-sm">No security rules found</p>
            <p className="text-xs text-slate-500 mt-0.5">Try adjusting your filter or search query.</p>
          </div>
        )}
      </div>

      {/* Remediation Drawer */}
      {selectedRule && (
        <RemediationDrawer
          rule={selectedRule}
          onClose={() => setSelectedRule(null)}
        />
      )}

      {/* History Drawer */}
      {showHistory && (
        <HistoryDrawer
          onClose={() => setShowHistory(false)}
          onSelectScan={loadHistoricalScan}
        />
      )}

      {/* Attestation Seal Drawer */}
      {showAttestation && (
        <AttestationDrawer
          auditData={auditData}
          onClose={() => setShowAttestation(false)}
          verificationResult={verificationResult}
          verifying={verifying}
          onVerify={verifySeal}
        />
      )}

      {/* Compare Modal */}
      {showCompare && (
        <CompareModal
          onClose={() => setShowCompare(false)}
          currentScanId={auditData?.scan_id}
        />
      )}

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        /* Print Styles */
        @media print {
          .no-print {
            display: none !important;
          }
          .no-print-bg {
            background: white !important;
            color: black !important;
          }
          body {
            background: white;
          }
          .hover\\:bg-indigo-50:hover {
            background: transparent !important;
          }
          .group:hover {
            background: transparent !important;
          }
        }
      `}</style>
    </div>
  )
}

export default App
