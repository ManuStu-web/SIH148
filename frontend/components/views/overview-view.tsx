'use client'

import React from 'react'
import { ArrowDownToLine, Play, RefreshCw, Plus } from 'lucide-react'
import { useToast } from '@/components/ui'
import {
  MetricsGrid,
  EndpointAgentsTable,
  RecentForensicJobsTable,
} from '@/components/dashboard'
import { metricsData } from '@/data/metrics'
import { forensicJobsData } from '@/data/forensicJobs'
import { Endpoint, ForensicJob } from '@/types'

interface OverviewViewProps {
  running: boolean
  onRun: (targetHostname?: string, scriptNameToRun?: string) => void
  onExport: () => void
  filteredEndpoints: Endpoint[]
  totalEndpointsCount: number
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedEndpoint: string | null
  onSelectEndpoint: (name: string) => void
  onNavigate: (viewName: string) => void
  onNavigateScript?: (scriptName: string) => void
  onOpenAddEndpoint: () => void
  jobs?: ForensicJob[]
}

export function OverviewView({
  running,
  onRun,
  onExport,
  filteredEndpoints,
  totalEndpointsCount,
  searchQuery,
  onSearchChange,
  selectedEndpoint,
  onSelectEndpoint,
  onNavigate,
  onNavigateScript,
  onOpenAddEndpoint,
  jobs,
}: OverviewViewProps) {
  const { toast } = useToast()
  const [selectedTarget, setSelectedTarget] = React.useState<string>('all')

  // Keep selected target in sync if user clicks a table row
  React.useEffect(() => {
    if (selectedEndpoint) {
      setSelectedTarget(selectedEndpoint)
    }
  }, [selectedEndpoint])

  const handleRunClick = () => {
    const isSingle = selectedTarget !== 'all'
    onRun(isSingle ? selectedTarget : undefined)
    const targetLabel = isSingle ? selectedTarget : 'all 5 fleet agents'
    toast(`Triggered live in-memory forensic analysis on ${targetLabel}!`, 'info')
  }

  const handleExportClick = () => {
    onExport()
    toast('Exporting comprehensive forensic telemetry and records JSON...', 'success')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1f2328] dark:text-[#f0f6fc]">
            Control Center
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-[#656d76] dark:text-[#8b949e]">
            Upload or select an analysis script, dispatch across a single endpoint or all 5 connected agents, and review execution output.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedTarget}
            onChange={(e) => {
              setSelectedTarget(e.target.value)
              if (e.target.value !== 'all') {
                onSelectEndpoint(e.target.value)
              }
            }}
            className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] px-3 py-2 text-xs font-semibold text-[#1f2328] dark:text-[#c9d1d9] shadow-2xs cursor-pointer outline-none hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] transition-colors"
          >
            <option value="all">🎯 Target: All 5 Agents (Broadcast)</option>
            {filteredEndpoints.map((ep) => (
              <option key={ep.agentId || ep.name} value={ep.hostname || ep.name}>
                🎯 Target: {ep.hostname || ep.name} ({ep.platform})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onNavigate('Deploy scripts')}
            className="flex items-center gap-1.5 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] px-3.5 py-2 text-xs font-semibold text-[#1f2328] dark:text-[#c9d1d9] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" /> Stage Script
          </button>
          <button
            type="button"
            onClick={handleRunClick}
            disabled={running}
            className="flex items-center gap-1.5 rounded-md bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-75 cursor-pointer"
          >
            {running ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : (
              <Play className="size-3.5 fill-current" />
            )}
            {running
              ? 'Dispatching…'
              : selectedTarget === 'all'
              ? 'Run Across 5 Agents'
              : `Run on ${selectedTarget}`}
          </button>
        </div>
      </div>

      {/* 6 Top KPI Metrics Cards */}
      <MetricsGrid metrics={metricsData} onNavigate={onNavigate} />

      {/* Primary Section: ENDPOINT AGENTS (8) */}
      <EndpointAgentsTable
        endpoints={filteredEndpoints}
        totalCount={totalEndpointsCount}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedEndpoint={selectedEndpoint}
        onSelectEndpoint={onSelectEndpoint}
        onViewAll={() => onNavigate('Endpoints')}
        onNavigateScript={onNavigateScript}
      />

      {/* Secondary Section: RECENT FORENSIC JOBS (8) */}
      <RecentForensicJobsTable
        jobs={jobs || forensicJobsData}
        onSelectJob={(job: ForensicJob) => {
          toast(`Selected job ${job.id}: ${job.findings}`, 'info')
          onNavigate('Results')
        }}
        onNewJobClick={() => onNavigate('Deploy scripts')}
      />
    </div>
  )
}
