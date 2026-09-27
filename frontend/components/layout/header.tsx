'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Radar,
  Bell,
  Server,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react'
import { useToast, ThemeToggle } from '@/components/ui'

interface HeaderProps {
  activeNav: string
  onNavigate?: (viewName: string) => void
  onOpenCommandPalette?: () => void
  onOpenAddEndpoint?: () => void
  isSidebarOpen?: boolean
  onToggleSidebar?: () => void
}

const mockForensicAlerts = [
  {
    id: 'ALT-101',
    title: 'BYOVD Callback Subversion Detected',
    time: '2m ago',
    type: 'warning',
    targetView: 'Live status',
    desc: 'Target driver handle disarmed kernel telemetry without EDR alert on NTRO-WIN-04.',
  },
  {
    id: 'ALT-102',
    title: 'Polymorphic Routine Regenerated',
    time: '14m ago',
    type: 'success',
    targetView: 'Deploy scripts',
    desc: 'Intermediate code hash mutated for jocky-core-forensics v2.4.1.',
  },
  {
    id: 'ALT-103',
    title: 'Covert Channel Verified',
    time: '26m ago',
    type: 'success',
    targetView: 'Endpoints',
    desc: 'Port 443 TLS 1.3 encrypted tunnel confirmed on FORENSIC-LNX-11.',
  },
]

export function Header({
  activeNav,
  onNavigate,
  onOpenCommandPalette,
  onOpenAddEndpoint,
  isSidebarOpen = true,
  onToggleSidebar,
}: HeaderProps) {
  const { toast } = useToast()
  const [isAlertsOpen, setIsAlertsOpen] = useState(false)
  const [selectedTarget, setSelectedTarget] = useState('All Targets (Windows & Ubuntu)')
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false)
  const alertsRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(event.target as Node)) {
        setIsAlertsOpen(false)
      }
      if (targetRef.current && !targetRef.current.contains(event.target as Node)) {
        setIsTargetDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAlertClick = (alert: (typeof mockForensicAlerts)[0]) => {
    setIsAlertsOpen(false)
    if (onNavigate) {
      onNavigate(alert.targetView)
      toast(`Navigating to ${alert.targetView}: ${alert.title}`, 'info')
    }
  }

  const handleSelectTarget = (targetName: string) => {
    setSelectedTarget(targetName)
    setIsTargetDropdownOpen(false)
    toast(`Switched active forensic target to: ${targetName}`, 'info')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#d0d7de] dark:border-[#30363d] bg-white/95 dark:bg-[#010409]/90 px-4 sm:px-8 backdrop-blur z-20 relative transition-colors duration-200">
      {/* Left title, toggle & breadcrumb */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex size-8 items-center justify-center rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] text-[#656d76] dark:text-[#e6edf3] hover:bg-[#eff1f3] dark:hover:bg-[#21262d] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] transition-colors cursor-pointer shadow-2xs"
            title={isSidebarOpen ? 'Close sidebar (Ctrl+B)' : 'Open sidebar (Ctrl+B)'}
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeftOpen className="size-4 text-[#0969da] dark:text-[#58a6ff]" />
            )}
          </button>
        )}

        {!isSidebarOpen && (
          <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-[#0969da] dark:text-[#58a6ff] ring-1 ring-sky-500/30">
            <Radar className="size-4" />
          </div>
        )}

        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#656d76] dark:text-[#8b949e] font-medium">
            <span>JOCKEY</span>
            <span className="text-[#afb8c1] dark:text-[#6e7681]">/</span>
            <span className="text-[#1f2328] dark:text-[#f0f6fc] font-semibold">{activeNav}</span>
          </div>
        </div>
      </div>

      {/* Right controls: Clean Target status badge & Theme toggle */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="flex items-center gap-1.5 rounded-full border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] px-3 py-1 text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3]">
          <span className="size-2 rounded-full bg-[#1a7f37] dark:bg-[#3fb950] animate-pulse" />
          <span>5 Agents Online</span>
        </div>

        <ThemeToggle compact />
      </div>
    </header>
  )
}
