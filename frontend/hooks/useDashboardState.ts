'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { endpointsData } from '@/data/endpoints'
import { scriptsData } from '@/data/scripts'
import { reportsData } from '@/data/reports'
import { evidenceData } from '@/data/evidence'
import { forensicJobsData } from '@/data/forensicJobs'
import { timelineData } from '@/data/timeline'
import { Endpoint, ScriptItem, ReportItem, EvidenceItem, ForensicJob } from '@/types'

interface BackendAgent {
  agent_id: string
  hostname: string
  os: string
  architecture: string
  status: string
  ip?: string
  latency?: string
  last_run?: string
  technique?: string
  av_status?: string
  av_present?: string
  last_script?: string
  evasion_status?: string
}

export function useDashboardState(initialNav = 'Overview') {
  const [activeNav, setActiveNav] = useState<string>(initialNav)
  const [running, setRunning] = useState<boolean>(false)
  const [query, setQuery] = useState<string>('')
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null)
  const [alertsPaused, setAlertsPaused] = useState<boolean>(false)

  // Mutable datasets initialized with complete dummy demo fleets
  const [endpoints, setEndpoints] = useState<Endpoint[]>(endpointsData)
  const [scripts, setScripts] = useState<ScriptItem[]>(scriptsData)
  const [reports, setReports] = useState<ReportItem[]>(reportsData)
  const [evidence, setEvidence] = useState<EvidenceItem[]>(evidenceData)
  const [jobs, setJobs] = useState<ForensicJob[]>(forensicJobsData)

  // Sync agents from backend if available
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/agents/')
        if (!response.ok) return

        const backendAgents: BackendAgent[] = await response.json()
        if (Array.isArray(backendAgents) && backendAgents.length > 0) {
          const mappedEndpoints: Endpoint[] = backendAgents.map((agent) => ({
            name: agent.hostname,
            agentId: agent.agent_id,
            hostname: agent.hostname,
            ip: agent.ip || '10.42.18.91',
            url: `/c2/beacon/${agent.agent_id.toLowerCase()}`,
            method: 'POST',
            status: agent.status === 'online' ? 'Healthy' : 'Degraded',
            latency: agent.latency || '24 ms',
            lastRun: agent.last_run || 'Just now',
            platform: agent.os,
            color: agent.status === 'online' ? 'emerald' : 'amber',
            technique: (agent.technique as any) || 'In-Memory Reflective Injection',
            avStatus: (agent.av_status as any) || 'Bypassed (0 Detections)',
            avPresent: agent.av_present || 'CrowdStrike Falcon 7.14',
            lastScript: agent.last_script || 'mem_dump.go',
            evasionStatus: (agent.evasion_status as any) || 'Evaded',
          }))
          setEndpoints(mappedEndpoints)
        }
      } catch (error) {
        // Fallback remains endpointsData
        console.warn('Backend /agents unavailable, using demo endpoints:', error)
      }
    }

    fetchAgents()
  }, [])

  const filteredEndpoints = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return endpoints
    return endpoints.filter(
      (endpoint: Endpoint) =>
        endpoint.name.toLowerCase().includes(trimmed) ||
        endpoint.url.toLowerCase().includes(trimmed) ||
        endpoint.platform.toLowerCase().includes(trimmed)
    )
  }, [endpoints, query])

  const handleSelectNav = useCallback((label: string) => {
    setActiveNav(label)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setQuery(value)
  }, [])

  const handleSelectEndpoint = useCallback((name: string) => {
    setSelectedEndpoint((prev) => (prev === name ? null : name))
  }, [])

  // Dispatches script execution across all fleet agents or a single selected target system
  const handleRun = useCallback(async (targetHostname?: string, scriptNameToRun?: string) => {
    setRunning(true)

    const allEndpoints = endpoints.length > 0 ? endpoints : endpointsData
    const activeScriptName = scriptNameToRun || scripts.find((s) => s.isDeployed)?.name || scripts[0]?.name || 'mem_dump.go'
    const timestampStr = 'Just now'

    // Determine targeted endpoints (single system vs all fleet)
    const isSingleTarget = targetHostname && targetHostname.toLowerCase() !== 'all'
    const targetList = isSingleTarget
      ? allEndpoints.filter(
          (e) =>
            e.hostname?.toLowerCase() === targetHostname.toLowerCase() ||
            e.name.toLowerCase() === targetHostname.toLowerCase() ||
            e.agentId?.toLowerCase() === targetHostname.toLowerCase()
        )
      : allEndpoints.slice(0, 5)

    const executionTargets = targetList.length > 0 ? targetList : allEndpoints.slice(0, 1)

    // Create immediate running jobs for the targeted endpoints
    const newJobEntries: ForensicJob[] = executionTargets.map((endpoint, idx) => ({
      id: `JOB-${Date.now().toString().slice(-4)}${idx}`,
      scriptName: activeScriptName,
      target: endpoint.hostname || endpoint.name,
      targetOS: endpoint.platform,
      type: 'Live In-Memory Analysis',
      started: timestampStr,
      duration: 'Executing...',
      status: 'Running',
      findings: `Traversing in-memory address descriptors on ${endpoint.hostname || endpoint.name}...`,
      evasionStatus: 'Evaded',
      avPresent: endpoint.avPresent || 'EDR Active',
      command: `jocky-go --target ${endpoint.hostname || endpoint.name} --routine ${activeScriptName} --stealth`,
      outputLog: [
        `[+] Initializing in-memory execution of ${activeScriptName} on ${endpoint.hostname || endpoint.name}`,
        `[+] Target OS: ${endpoint.platform} | AV: ${endpoint.avPresent}`,
        '[+] Direct syscall SSN resolution successful',
        '[*] Scanning process memory space in volatile cache...',
      ],
    }))

    // Prepend newly running jobs into state
    setJobs((prev) => [...newJobEntries, ...prev])

    // Notify backend if online
    try {
      fetch('http://127.0.0.1:8000/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispatch_all: !isSingleTarget,
          target: isSingleTarget ? targetHostname : undefined,
          agent_id: isSingleTarget ? executionTargets[0]?.agentId : undefined,
          script_name: activeScriptName,
          exec_mode: 'in_memory',
        }),
      }).catch(() => {})
    } catch {
      // Ignored for offline demo mode
    }

    // After 2.5 seconds, transition jobs to Completed with rich output
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((job) => {
          const match = newJobEntries.find((nj) => nj.id === job.id)
          if (match) {
            return {
              ...job,
              status: 'Completed',
              duration: '2.4s',
              findings: '14 anomalous memory regions audited · 0 alert tripwires',
              outputLog: [
                ...(job.outputLog || []),
                '[+] Traversed 1,842 Virtual Address Descriptors (VAD) without disk write',
                '[!] Disarmed inline telemetry hook without kernel panic',
                `[✓] Execution of ${job.scriptName} finished successfully in 2.4s with 0 detections.`,
              ],
            }
          }
          return job
        })
      )
      setRunning(false)
    }, 2500)
  }, [endpoints, scripts])

  const addEndpoint = useCallback((newEndpoint: Endpoint) => {
    setEndpoints((prev) => [newEndpoint, ...prev])
  }, [])

  const updateEndpoint = useCallback((updated: Endpoint) => {
    setEndpoints((prev) =>
      prev.map((e) => (e.name === updated.name ? updated : e))
    )
  }, [])

  const deleteEndpoint = useCallback((name: string) => {
    setEndpoints((prev) => prev.filter((e) => e.name !== name))
  }, [])

  const toggleDeployScript = useCallback((scriptName: string) => {
    setScripts((prev) =>
      prev.map((s) => {
        if (s.name === scriptName) {
          const nextDeployed = !s.isDeployed
          return {
            ...s,
            isDeployed: nextDeployed,
            lastDeployedOrDraft: nextDeployed
              ? 'Deployed just now'
              : 'Draft rollback activated',
          }
        }
        return s
      })
    )
  }, [])

  const updateScript = useCallback((updatedScript: ScriptItem) => {
    setScripts((prev) =>
      prev.map((s) => (s.name === updatedScript.name ? updatedScript : s))
    )
    try {
      fetch(`http://127.0.0.1:8000/scripts/${encodeURIComponent(updatedScript.name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedScript.name,
          technique: updatedScript.technique,
          description: updatedScript.description,
          sourceCode: updatedScript.sourceCode,
          version: updatedScript.version,
          targetPlatforms: updatedScript.targetPlatforms,
        }),
      }).catch(() => {})
    } catch {
      // Ignored for offline demo mode
    }
  }, [])

  const deleteScript = useCallback((scriptName: string) => {
    setScripts((prev) => prev.filter((s) => s.name !== scriptName))
    try {
      fetch(`http://127.0.0.1:8000/scripts/${encodeURIComponent(scriptName)}`, {
        method: 'DELETE',
      }).catch(() => {})
    } catch {
      // Ignored for offline demo mode
    }
  }, [])

  const importScript = useCallback((newScript: ScriptItem) => {
    setScripts((prev) => [newScript, ...prev])
    try {
      fetch('http://127.0.0.1:8000/scripts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newScript.name,
          technique: newScript.technique,
          description: newScript.description,
          sourceCode: newScript.sourceCode || 'package main\n\nfunc main() {}\n',
        }),
      }).catch(() => {})
    } catch {
      // Ignored for offline demo mode
    }
  }, [])

  const addReport = useCallback((newReport: ReportItem) => {
    setReports((prev) => [newReport, ...prev])
  }, [])

  const togglePauseAlerts = useCallback(() => {
    setAlertsPaused((prev) => !prev)
  }, [])

  const exportWorkspaceData = useCallback(() => {
    const payload = {
      exported_at: new Date().toISOString(),
      workspace: 'JOCKEY Forensic & Telemetry Central Plane',
      metrics: {
        active_endpoints: endpoints.length,
        scripts_count: scripts.length,
        reports_count: reports.length,
        evidence_count: evidence.length,
        jobs_count: jobs.length,
      },
      endpoints,
      jobs,
      scripts,
      reports,
      evidence,
      timeline: timelineData,
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `jockey-workspace-export-${Date.now()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }, [endpoints, scripts, reports, evidence, jobs])

  const downloadEvidenceFile = useCallback((fileName: string) => {
    const mockContent = `[JOCKEY FORENSIC EVIDENCE DUMP]\nFilename: ${fileName}\nTimestamp: ${new Date().toISOString()}\nNode: us-east-prod-02\nIntegrity: SHA-256 Validated\nData: Telemetry buffer capture OK.`
    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(mockContent)
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', fileName)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }, [])

  return {
    activeNav,
    setActiveNav: handleSelectNav,
    running,
    query,
    setQuery: handleSearchChange,
    selectedEndpoint,
    setSelectedEndpoint: handleSelectEndpoint,
    filteredEndpoints,
    endpoints,
    scripts,
    reports,
    evidence,
    jobs,
    alertsPaused,
    handleRun,
    addEndpoint,
    updateEndpoint,
    deleteEndpoint,
    toggleDeployScript,
    importScript,
    updateScript,
    deleteScript,
    addReport,
    togglePauseAlerts,
    exportWorkspaceData,
    downloadEvidenceFile,
  }
}
