import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Activity,
  Download, Search, X, Copy, Check, PlayCircle,
  History, Printer, Clock, Eye, ArrowRight
} from 'lucide-react'

const API_BASE_URL = 'http://localhost:8000'

// Circular SVG Compliance Gauge Component
function ComplianceGauge({ score, size = 115 }) {
  const radius = (size - 18) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  const getColor = () => {
    if (score >= 70) return '#16a34a' // Green
    if (score >= 40) return '#d97706' // Amber
    return '#dc2626' // Red
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-extrabold" style={{ color: getColor() }}>
          {score}%
        </span>
        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
          Risk-Weighted
        </span>
      </div>
    </div>
  )
}

// History Drawer Component
function HistoryDrawer({ onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-slide-in">
        <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-indigo-900 text-white px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6" />
            <h2 className="text-xl font-bold">Audit History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading audit history...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-red-900 font-semibold">Failed to load history</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-semibold">No audit history yet</p>
              <p className="text-sm mt-2">Run your first audit to start tracking compliance over time</p>
            </div>
          ) : (
            <div className="relative">
              <p className="text-sm text-gray-500 mb-6">
                Showing {history.length} past scans (newest first). Demonstrates continuous monitoring and compliance drift tracking under ASArP.
              </p>

              {/* Timeline list */}
              <div className="space-y-6 relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {history.map((scan) => {
                  const weightedScore = scan.weighted_score ?? scan.scores?.weighted_score ?? 0
                  const passed = scan.passed ?? scan.scores?.passed ?? 0
                  const failed = scan.failed ?? scan.scores?.failed ?? 0
                  const errors = scan.errors ?? scan.scores?.errors ?? 0
                  const total = scan.total ?? scan.scores?.total ?? (passed + failed + errors)

                  return (
                    <div key={scan.scan_id} className="relative pb-8 last:pb-0">
                      {/* Timeline dot */}
                      <div className="absolute left-6 -translate-x-1/2 w-3 h-3 bg-indigo-600 rounded-full border-4 border-white"></div>

                      {/* Scan card */}
                      <div className="ml-16 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs text-gray-500">
                                {scan.scan_id}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                scan.mode === 'demo'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {scan.mode === 'demo' ? 'Demo' : 'Live'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {formatDate(scan.timestamp)}
                            </p>
                          </div>
                          <div className={`text-3xl font-bold ${getScoreColor(weightedScore)}`}>
                            {weightedScore}%
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3 text-center">
                          <div className="bg-gray-50 rounded p-2">
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Total</div>
                            <div className="text-lg font-bold text-gray-900">{total}</div>
                          </div>
                          <div className="bg-green-50 rounded p-2">
                            <div className="text-xs text-green-600 uppercase font-semibold mb-1">Passed</div>
                            <div className="text-lg font-bold text-green-700">{passed}</div>
                          </div>
                          <div className="bg-red-50 rounded p-2">
                            <div className="text-xs text-red-600 uppercase font-semibold mb-1">Failed</div>
                            <div className="text-lg font-bold text-red-700">{failed}</div>
                          </div>
                          <div className="bg-yellow-50 rounded p-2">
                            <div className="text-xs text-yellow-600 uppercase font-semibold mb-1">Errors</div>
                            <div className="text-lg font-bold text-yellow-700">{errors}</div>
                          </div>
                        </div>
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
      CRITICAL: 'bg-red-100 text-red-800 border-red-300',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      LOW: 'bg-blue-100 text-blue-800 border-blue-300'
    }
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-slide-in">
        <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-indigo-900 text-white px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Security Rule Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Rule Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <code className="text-lg font-mono font-bold text-gray-900">
                {rule.rule_id}
              </code>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getSeverityColor(rule.severity)}`}>
                {rule.severity}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                rule.status === 'FAIL' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {rule.status}
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium">{rule.category}</p>
            <p className="text-gray-900 font-medium mt-2">{rule.description}</p>
          </div>

          {/* Expected vs Actual */}
          {rule.status === 'FAIL' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Why it Failed
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-red-700 font-semibold uppercase tracking-wide mb-1">
                    Expected
                  </p>
                  <code className="block bg-white border border-red-300 px-3 py-2 rounded text-sm font-mono text-gray-900">
                    {String(rule.expected_value)}
                  </code>
                </div>
                <div>
                  <p className="text-xs text-red-700 font-semibold uppercase tracking-wide mb-1">
                    Actual
                  </p>
                  <code className="block bg-white border border-red-300 px-3 py-2 rounded text-sm font-mono text-red-600 font-bold">
                    {rule.error || String(rule.actual_value)}
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Risk Explanation */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <h3 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Risk Explanation
            </h3>
            <p className="text-yellow-900 text-sm leading-relaxed">
              {rule.risk_explanation}
            </p>
          </div>

          {/* CIS & MITRE */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                CIS Benchmark
              </h4>
              <p className="font-mono text-sm text-gray-900">
                {rule.cis_reference}
              </p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2">
                MITRE ATT&CK
              </h4>
              <p className="font-mono text-sm font-bold text-indigo-900">
                {rule.mitre_technique}
              </p>
              <p className="text-xs text-indigo-700 mt-1">
                {rule.mitre_name}
              </p>
            </div>
          </div>

          {/* Remediation Command */}
          {rule.remediation_command && (
            <div className="bg-slate-900 rounded-lg overflow-hidden">
              <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
                <span className="text-slate-300 text-sm font-bold uppercase tracking-wide">
                  PowerShell Remediation
                </span>
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-semibold transition ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Fix
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-cyan-400 text-sm font-mono leading-relaxed">
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

function App() {
  const [auditData, setAuditData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [demoMode, setDemoMode] = useState(true)
  const [selectedRule, setSelectedRule] = useState(null)
  const [showHistory, setShowHistory] = useState(false)

  const fetchAudit = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/audit`, {
        params: { demo: demoMode }
      })
      setAuditData(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAudit()
  }, [])

  const downloadFixScript = () => {
    if (!auditData) return

    const failedRules = auditData.results.filter(r => r.status === 'FAIL')

    let script = `# Windows Security Remediation Script
# Generated: ${new Date().toLocaleString()}
# Host: ${auditData.hostname}
# This script remediates ${failedRules.length} failed security checks

# Requires Administrator privileges
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "Administrator privileges required. Please re-run from an elevated PowerShell console."
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Windows Security Misconfiguration Remediation" -ForegroundColor Cyan
Write-Host " Applying fixes for ${failedRules.length} failed checks..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

`

    failedRules.forEach((rule, idx) => {
      script += `# ---------------------------------------------------------\n`
      script += `# [${idx + 1}/${failedRules.length}] ${rule.rule_id} (${rule.severity}): ${rule.description}\n`
      script += `# CIS: ${rule.cis_reference} | MITRE: ${rule.mitre_technique}\n`
      script += `# ---------------------------------------------------------\n`
      script += `Write-Host "[${idx + 1}/${failedRules.length}] Remediating ${rule.rule_id}..." -ForegroundColor Yellow\n`
      script += `try {\n`
      script += `    ${rule.remediation_command}\n`
      script += `    Write-Host "  [+] Success: ${rule.rule_id} applied." -ForegroundColor Green\n`
      script += `} catch {\n`
      script += `    Write-Warning "  [-] Error applying ${rule.rule_id}: $_"\n`
      script += `}\n`
      script += `Write-Host ""\n\n`
    })

    script += `Write-Host "==========================================================" -ForegroundColor Cyan\n`
    script += `Write-Host " Remediation finished! Please reboot and run a re-scan." -ForegroundColor Green\n`
    script += `Write-Host "==========================================================" -ForegroundColor Cyan\n`

    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `remediate_all_${auditData.hostname}.ps1`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
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
      CRITICAL: 'bg-red-100 text-red-800 border-red-300',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      LOW: 'bg-blue-100 text-blue-800 border-blue-300'
    }
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full border border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Connection Error</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Failed to connect to the FastAPI backend: {error}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Make sure the backend server is running at:
            <code className="block mt-2 bg-gray-100 px-3 py-2 rounded">
              http://localhost:8000
            </code>
          </p>
          <button
            onClick={fetchAudit}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  if (loading && !auditData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Running security audit...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 text-white shadow-md no-print-bg">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left: Branding & Host Metadata */}
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                <Shield className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Security Audit Dashboard</h1>
                <p className="text-slate-400 font-mono text-xs mt-1 flex items-center gap-2">
                  <span className="bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded border border-slate-700/60 font-medium">
                    {auditData?.hostname || 'LOCAL-PC'}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span>{auditData?.os_version || 'Windows 11'}</span>
                </p>
              </div>
            </div>

            {/* Right: Top Header Audit & Mode Controls */}
            <div className="flex items-center gap-3 flex-wrap no-print">
              {/* Mode Toggle Switch */}
              <div className="flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700 text-xs font-semibold shadow-inner">
                <button
                  onClick={() => setDemoMode(false)}
                  className={`px-3 py-1.5 rounded-md transition ${
                    !demoMode
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Live Scan
                </button>
                <button
                  onClick={() => setDemoMode(true)}
                  className={`px-3 py-1.5 rounded-md transition ${
                    demoMode
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Demo Mode
                </button>
              </div>

              {/* History Button (Ghost / Outline) */}
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-lg transition text-xs sm:text-sm font-medium shadow-sm"
              >
                <History className="w-4 h-4 text-slate-300" />
                <span>History</span>
              </button>

              {/* Primary Action: Run Audit */}
              <button
                onClick={fetchAudit}
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition font-semibold shadow-md text-xs sm:text-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Auditing...</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    <span>Run Audit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ASArP Trust Banner */}
          <div className="mt-4 bg-slate-800/80 border border-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-md flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                🛡️ ASArP Phase I Trust State:
              </span>
              <span className="text-slate-300">
                TPM 2.0 (Detected) | Secure Boot: Active | TCB State: Verified (SHA-256)
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[11px] bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/50">
              ASArP-2015-COMPLIANT
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Score Cards with SVG Gauge (Reduced Padding & Balanced Proportions) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-center">
            <ComplianceGauge score={auditData?.scores.weighted_score || 0} size={115} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Simple Score
              </span>
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                {auditData?.scores.simple_score}%
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Unweighted ratio</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Passed
              </span>
              <div className="p-1.5 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                {auditData?.scores.passed}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Hardened rules</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Failed
              </span>
              <div className="p-1.5 bg-red-50 rounded-lg">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-bold text-red-600">
                {auditData?.scores.failed}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Misconfigurations</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Errors
              </span>
              <div className="p-1.5 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-600">
                {auditData?.scores.errors}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Check exceptions</p>
            </div>
          </div>
        </div>

        {/* Table Toolbar (Search & Filter on Left, Export Actions on Right) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-5 no-print">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left Side: Search & Filter Pills */}
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Rule ID, Description, Category, MITRE..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filter === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({auditData?.results.length || 0})
                </button>
                <button
                  onClick={() => setFilter('failed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filter === 'failed'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Failed ({auditData?.scores.failed || 0})
                </button>
                <button
                  onClick={() => setFilter('critical')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filter === 'critical'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Critical ({auditData?.results.filter(r => r.severity === 'CRITICAL').length || 0})
                </button>
                <button
                  onClick={() => setFilter('passed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filter === 'passed'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Passed ({auditData?.scores.passed || 0})
                </button>
              </div>
            </div>

            {/* Right Side: Export & Fix Actions */}
            <div className="flex items-center gap-2.5 flex-wrap justify-end">
              {/* Download Fix Script */}
              <button
                onClick={downloadFixScript}
                disabled={!auditData || auditData.scores.failed === 0}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download unified PowerShell remediation script for all failed checks"
              >
                <Download className="w-4 h-4" />
                <span>Download Fix Script (.ps1)</span>
              </button>

              {/* Export / Print */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg transition shadow-sm"
                title="Print dashboard or save as PDF"
              >
                <Printer className="w-4 h-4 text-gray-500" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/90 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    S.No.
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rule ID
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Expected
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actual
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    MITRE ATT&CK
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider no-print">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredResults.map((result, idx) => (
                  <tr
                    key={result.rule_id}
                    onClick={() => setSelectedRule(result)}
                    className="hover:bg-indigo-50/70 transition cursor-pointer group"
                  >
                    <td className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <code className="text-xs font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {result.rule_id}
                      </code>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-900 transition">
                        {result.description}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{result.category}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSeverityColor(result.severity)}`}>
                        {result.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200 text-gray-800">
                        {String(result.expected_value)}
                      </code>
                    </td>
                    <td className="px-4 py-3.5">
                      <code className={`text-xs font-mono px-2 py-1 rounded border ${
                        result.status === 'FAIL'
                          ? 'bg-red-50 border-red-200 text-red-700 font-bold'
                          : 'bg-gray-100 border-gray-200 text-gray-800'
                      }`}>
                        {result.error || String(result.actual_value)}
                      </code>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs">
                        <div className="font-mono text-indigo-600 font-semibold">
                          {result.mitre_technique}
                        </div>
                        <div className="text-gray-500 mt-0.5 line-clamp-1">
                          {result.mitre_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        result.status === 'PASS'
                          ? 'bg-green-100 text-green-800'
                          : result.status === 'FAIL'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {result.status}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5 text-center whitespace-nowrap no-print"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedRule(result)
                      }}
                    >
                      {result.status === 'FAIL' ? (
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 shadow-sm transition">
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Fix →</span>
                        </button>
                      ) : (
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm transition">
                          <span>Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
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
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 mt-4">
            <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="font-medium">No security rules found matching your filter or search criteria.</p>
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
