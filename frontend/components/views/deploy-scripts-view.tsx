'use client'

import React, { useState } from 'react'
import {
  Upload,
  Code2,
  ShieldCheck,
  Binary,
  Cpu,
  CheckCircle2,
  Terminal,
  FileCode2,
  Layers,
  ChevronRight,
  Eye,
  Edit3,
  Trash2,
  Save,
  RotateCcw,
  Server,
  Radio,
  Check,
} from 'lucide-react'
import { Card, useToast } from '@/components/ui'
import { DestinationViewShell } from './destination-view-shell'
import { ImportScriptModal, GuardrailPolicyModal } from '@/components/modals'
import { ScriptItem, Endpoint } from '@/types'

interface DeployScriptsViewProps {
  scripts: ScriptItem[]
  endpoints?: Endpoint[]
  selectedScriptName?: string | null
  onRun: (targetHostname?: string, scriptNameToRun?: string) => void
  onExport: () => void
  onToggleDeploy: (name: string) => void
  onImportScript: (script: ScriptItem) => void
  onUpdateScript?: (script: ScriptItem) => void
  onDeleteScript?: (name: string) => void
}

export function DeployScriptsView({
  scripts,
  endpoints,
  selectedScriptName,
  onRun,
  onExport,
  onToggleDeploy,
  onImportScript,
  onUpdateScript,
  onDeleteScript,
}: DeployScriptsViewProps) {
  const { toast } = useToast()
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isPolicyOpen, setIsPolicyOpen] = useState(false)
  const [selectedScriptForInspect, setSelectedScriptForInspect] = useState<ScriptItem>(() => {
    if (selectedScriptName) {
      const found = scripts.find((s) => s.name === selectedScriptName || s.name.includes(selectedScriptName))
      if (found) return found
    }
    return scripts[0] || {
      name: 'mem_dump.go',
      version: 'v2.4.1',
      lastDeployedOrDraft: 'Draft ready',
      isDeployed: true,
      technique: 'In-Memory Reflective Injection',
      avBypassRate: '100% (0 Detections)',
      targetPlatforms: ['Windows 11', 'Windows Server 2022'],
      mutationHash: '7f8b9a2c',
      description: 'Scans virtual address descriptors without disk footprint.',
      sourceCode: 'package main\n\nfunc main() {}\n',
    }
  })
  const [activeCodeTab, setActiveCodeTab] = useState<'dsl' | 'ast' | 'ir'>('dsl')

  // Target system selection: 'all' or specific hostname (e.g. 'NTRO-WIN-04')
  const [selectedTargetNode, setSelectedTargetNode] = useState<string>('all')

  // Interactive script code editing state
  const [isEditingSource, setIsEditingSource] = useState<boolean>(false)
  const [editedSourceCode, setEditedSourceCode] = useState<string>(() => {
    return selectedScriptForInspect?.sourceCode || ''
  })

  React.useEffect(() => {
    if (selectedScriptName) {
      const found = scripts.find((s) => s.name === selectedScriptName || s.name.includes(selectedScriptName))
      if (found) {
        setSelectedScriptForInspect(found)
        setEditedSourceCode(found.sourceCode || '')
        setIsEditingSource(false)
      }
    }
  }, [selectedScriptName, scripts])

  // Synchronize editor text whenever inspected script changes
  const handleSelectScriptToInspect = (script: ScriptItem) => {
    setSelectedScriptForInspect(script)
    setEditedSourceCode(script.sourceCode || '')
    setIsEditingSource(false)
  }

  const [policy, setPolicy] = useState({
    peerReview: true,
    autoSmoke: true,
    rollbackKeep: true,
  })

  const handleToggle = (script: ScriptItem) => {
    onToggleDeploy(script.name)
    if (script.isDeployed) {
      toast(`Rolled back script "${script.name}" to draft buffer.`, 'info')
    } else {
      toast(`Deployed polymorphic script "${script.name} (${script.version})" with 100% AV evasion!`, 'success')
    }
  }

  const handleImport = (newScript: ScriptItem) => {
    onImportScript(newScript)
    setSelectedScriptForInspect(newScript)
    setEditedSourceCode(newScript.sourceCode || '')
    toast(`Imported JOCKY polymorphic script "${newScript.name}" into library.`, 'success')
  }

  const handleSavePolicy = (newPolicy: typeof policy) => {
    setPolicy(newPolicy)
    toast('Deployment guardrail policies updated successfully.', 'success')
  }

  const handleSaveSourceEdit = () => {
    if (!selectedScriptForInspect) return
    const newHash = Math.random().toString(16).substring(2, 10)
    const updated: ScriptItem = {
      ...selectedScriptForInspect,
      sourceCode: editedSourceCode,
      mutationHash: newHash,
      lastDeployedOrDraft: 'Edited & recompiled just now',
      astStructure: `PackageDeclaration: main\nRecompiledRoutine: ${selectedScriptForInspect.name}\n  ├── AST Validated (Go 1.22 Compiler)\n  └── In-Memory Execution Flow Verified`,
      irRepresentation: `// JOCKEY IR (Recompiled from ${selectedScriptForInspect.name})\n%0 = call_builtin @jocky.runtime.init()\n%1 = call_builtin @jocky.scan.volatile_memory()\nret void`,
    }

    setSelectedScriptForInspect(updated)
    setIsEditingSource(false)

    if (onUpdateScript) {
      onUpdateScript(updated)
    }
    toast(`Saved & recompiled "${updated.name}" (Polymorphic Hash: ${newHash})!`, 'success')
  }

  const handleDeleteScript = (scriptName: string) => {
    if (scripts.length <= 1) {
      toast('Cannot remove the last remaining script in the library.', 'error')
      return
    }

    if (onDeleteScript) {
      onDeleteScript(scriptName)
    }

    if (selectedScriptForInspect?.name === scriptName) {
      const remaining = scripts.filter((s) => s.name !== scriptName)
      if (remaining.length > 0) {
        setSelectedScriptForInspect(remaining[0])
        setEditedSourceCode(remaining[0].sourceCode || '')
      }
    }
    toast(`Removed script "${scriptName}" from library.`, 'info')
  }

  const handleDispatch = () => {
    const isSingle = selectedTargetNode !== 'all'
    const target = isSingle ? selectedTargetNode : undefined
    onRun(target, selectedScriptForInspect?.name)

    const targetDesc = isSingle ? `endpoint ${selectedTargetNode}` : 'all 5 fleet agents'
    toast(`Dispatched "${selectedScriptForInspect?.name || 'routine'}" to ${targetDesc}!`, 'success')
  }

  // Fleet nodes list
  const targetFleet =
    endpoints && endpoints.length > 0
      ? endpoints.map((e) => ({
          name: e.hostname || e.name,
          os: e.platform,
          ip: e.ip || '10.42.18.91',
        }))
      : [
          { name: 'NTRO-WIN-04', os: 'Windows 11', ip: '10.42.18.91' },
          { name: 'FORENSIC-LNX-11', os: 'Ubuntu 22.04', ip: '10.42.20.104' },
          { name: 'NTRO-WIN-08', os: 'Windows 10', ip: '10.42.18.112' },
          { name: 'NTRO-SRV-02', os: 'Windows Server 2022', ip: '10.42.15.50' },
          { name: 'SEC-UBUNTU-01', os: 'Ubuntu 24.04', ip: '10.42.22.88' },
        ]

  return (
    <>
      <DestinationViewShell name="Deploy scripts" onRun={() => handleDispatch()} onExport={onExport}>
        <div className="flex flex-col gap-6">
          {/* Interactive JOCKEY Script IDE & Compiler Pipeline */}
          <Card className="overflow-hidden border-[#d0d7de] dark:border-[#30363d]">
            <div className="flex flex-col gap-3 border-b border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <FileCode2 className="size-4 text-[#0969da] dark:text-[#58a6ff]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1f2328] dark:text-[#f0f6fc]">
                  Go Forensic Routine Compiler & Execution Inspector (Go → SSA)
                </h3>
                <span className="rounded bg-[#ddf4ff] dark:bg-[#388bfd]/15 border border-[#54aeff]/40 dark:border-[#388bfd]/30 px-2 py-0.5 font-mono text-[10px] font-bold text-[#0969da] dark:text-[#58a6ff]">
                  {selectedScriptForInspect?.name || 'jockey-core-forensics.go'}
                </span>
                {isEditingSource && (
                  <span className="rounded bg-[#fff8c5] dark:bg-[#d29922]/20 border border-[#d4a72c]/40 text-[#9a6700] dark:text-[#d29922] px-2 py-0.5 text-[10px] font-bold animate-pulse">
                    Editing Mode Active
                  </span>
                )}
              </div>

              {/* Stage Switcher + Edit Button */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-[#f6f8fa] dark:bg-[#0d1117] p-1 rounded-md text-xs border border-[#d0d7de] dark:border-[#30363d]">
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab('dsl')}
                    className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                      activeCodeTab === 'dsl'
                        ? 'bg-[#1f883d] dark:bg-[#238636] text-white shadow-xs'
                        : 'text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                    }`}
                  >
                    1. Go Source (.go)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab('ast')}
                    className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                      activeCodeTab === 'ast'
                        ? 'bg-[#1f883d] dark:bg-[#238636] text-white shadow-xs'
                        : 'text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                    }`}
                  >
                    2. Go AST Tree
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab('ir')}
                    className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                      activeCodeTab === 'ir'
                        ? 'bg-[#1f883d] dark:bg-[#238636] text-white shadow-xs'
                        : 'text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                    }`}
                  >
                    3. Go SSA / Execution Stream
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] divide-y lg:divide-y-0 lg:divide-x divide-[#d0d7de] dark:divide-[#30363d]">
              {/* Left Code Editor Display */}
              <div className="bg-[#0d1117] p-4 font-mono text-xs text-[#e6edf3] overflow-x-auto flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#8b949e] pb-2 mb-3 border-b border-[#30363d]">
                    <div className="flex items-center gap-2">
                      <span>Go Editor · Runtime: JOCKEY Go Engine v2.4</span>
                      <span className="text-[#3fb950] font-bold">● Validated Go Package</span>
                    </div>

                    {activeCodeTab === 'dsl' && (
                      <div className="flex items-center gap-1.5">
                        {isEditingSource ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditedSourceCode(selectedScriptForInspect?.sourceCode || '')
                                setIsEditingSource(false)
                              }}
                              className="rounded border border-[#30363d] bg-[#21262d] px-2 py-1 text-[11px] text-[#c9d1d9] hover:bg-[#30363d] cursor-pointer flex items-center gap-1"
                            >
                              <RotateCcw className="size-3" /> Discard
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveSourceEdit}
                              className="rounded bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <Save className="size-3" /> Save & Recompile
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsEditingSource(true)}
                            className="rounded border border-[#30363d] bg-[#21262d] px-2.5 py-1 text-[11px] font-semibold text-[#58a6ff] hover:bg-[#30363d] hover:text-[#79c0ff] cursor-pointer flex items-center gap-1.5 transition-colors"
                          >
                            <Edit3 className="size-3 text-[#58a6ff]" /> Edit Script
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {activeCodeTab === 'dsl' && (
                    <>
                      {isEditingSource ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            value={editedSourceCode}
                            onChange={(e) => setEditedSourceCode(e.target.value)}
                            rows={14}
                            spellCheck={false}
                            className="w-full rounded-md border border-[#30363d] bg-[#161b22] p-3 font-mono text-xs text-[#7ee787] leading-relaxed outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] resize-y shadow-inner"
                            placeholder="// Enter or edit your Go forensic routine source code..."
                          />
                          <p className="text-[10px] text-[#8b949e]">
                            💡 Tip: Modify Go routine statements freely. Saving triggers the compiler pipeline & assigns a fresh polymorphic hash.
                          </p>
                        </div>
                      ) : (
                        <pre className="text-[#7ee787] leading-relaxed overflow-x-auto whitespace-pre">
                          {selectedScriptForInspect?.sourceCode || `// JOCKEY Forensic Script v2.4
collect system
collect processes
collect network
collect files "/var/log"
analyze persistence
generate report`}
                        </pre>
                      )}
                    </>
                  )}

                  {activeCodeTab === 'ast' && (
                    <pre className="text-[#79c0ff] leading-relaxed overflow-x-auto whitespace-pre">
                      {selectedScriptForInspect?.astStructure || `ProgramStructure {
  Statements: [
    CollectStmt(Target: "system"),
    CollectStmt(Target: "processes"),
    CollectStmt(Target: "network"),
    CollectFilesStmt(Path: "/var/log"),
    AnalyzeStmt(Type: "persistence"),
    ReportStmt(Format: "standard_evidence")
  ]
}`}
                    </pre>
                  )}

                  {activeCodeTab === 'ir' && (
                    <pre className="text-[#d2a8ff] leading-relaxed overflow-x-auto whitespace-pre">
                      {selectedScriptForInspect?.irRepresentation || `// Jocky IR (Platform Independent Intermediate Representation)
%0 = call_builtin @jocky.collect.system()
%1 = call_builtin @jocky.collect.process_tree()
%2 = call_builtin @jocky.collect.active_sockets()
%3 = call_builtin @jocky.collect.filesystem_path(str "/var/log")
%4 = call_builtin @jocky.analyze.persistence_artifacts(%0, %1)
%5 = call_builtin @jocky.report.synthesize(%0, %1, %2, %3, %4)
ret void`}
                    </pre>
                  )}
                </div>
              </div>

              {/* Right Compiler & Execution Target Summary */}
              <div className="bg-[#f6f8fa] dark:bg-[#161b22] p-4 flex flex-col justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-bold text-[#1f2328] dark:text-[#f0f6fc] text-xs uppercase tracking-wider mb-2">
                    Compiler & Agent Layer
                  </h4>

                  <div className="flex flex-col gap-2">
                    <div className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-2.5">
                      <span className="text-[10px] uppercase font-bold text-[#656d76] dark:text-[#8b949e]">Lexer & Parser</span>
                      <p className="font-semibold text-[#1f2328] dark:text-[#e6edf3] text-[11px] mt-0.5">Tokenize & AST Validation</p>
                      <p className="text-[10px] text-[#656d76] dark:text-[#8b949e]">Zero standard MSVC/GCC artifacts generated</p>
                    </div>

                    <div className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-2.5">
                      <span className="text-[10px] uppercase font-bold text-[#656d76] dark:text-[#8b949e]">Execution Engine</span>
                      <p className="font-semibold text-[#8250df] dark:text-[#d2a8ff] text-[11px] mt-0.5">Golang Function Registry</p>
                      <p className="text-[10px] text-[#656d76] dark:text-[#8b949e]">Cross-platform in-memory dispatch</p>
                    </div>

                    <div className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-2.5">
                      <span className="text-[10px] uppercase font-bold text-[#656d76] dark:text-[#8b949e]">Target Platforms</span>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {selectedScriptForInspect?.targetPlatforms?.map((p) => (
                          <span key={p} className="rounded bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-1.5 py-0.5 text-[10px] font-semibold text-[#1f2328] dark:text-[#c9d1d9]">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Script Library & Fleet Target Section */}
          <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <Card>
              <div className="flex items-center justify-between border-b border-[#d0d7de] dark:border-[#30363d] p-4 bg-white dark:bg-[#161b22]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                      JOCKEY Polymorphic Script Library
                    </h3>
                    <span className="rounded-full bg-[#dafbe1] dark:bg-[#238636]/20 border border-[#4ac26b]/40 dark:border-[#238636]/40 text-[#1a7f37] dark:text-[#3fb950] px-2 py-0.5 text-[10px] font-bold">
                      {scripts.length} Routines Ready
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e]">
                    Click any script to inspect or edit. Deploy to single systems or broadcast to the entire fleet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImportOpen(true)}
                  className="rounded-md bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="size-3.5" /> Stage New Script
                </button>
              </div>

              <div className="flex flex-col gap-3.5 p-4">
                {scripts.map((script) => {
                  const isSelected = selectedScriptForInspect?.name === script.name

                  return (
                    <div
                      key={script.name}
                      onClick={() => handleSelectScriptToInspect(script)}
                      className={`rounded-xl border p-4 transition-all shadow-2xs flex flex-col gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'border-[#0969da] dark:border-[#58a6ff] bg-[#ddf4ff]/20 dark:bg-[#388bfd]/10'
                          : 'border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                              script.isDeployed
                                ? 'bg-[#dafbe1] dark:bg-[#238636]/20 text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b]/40 dark:border-[#238636]/40'
                                : 'bg-[#fbefff] dark:bg-[#8250df]/20 text-[#8250df] dark:text-[#d2a8ff] border border-[#d8b9ff]/60 dark:border-[#8250df]/40'
                            }`}
                          >
                            <Binary className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                                {script.name}
                              </p>
                              {isSelected && (
                                <span className="rounded bg-[#0969da] text-white px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider">
                                  Inspecting
                                </span>
                              )}
                              <span className="text-xs font-mono font-bold text-[#0969da] dark:text-[#58a6ff] bg-[#ddf4ff] dark:bg-[#388bfd]/15 px-2 py-0.5 rounded border border-[#54aeff]/40 dark:border-[#388bfd]/30">
                                {script.version}
                              </span>
                              <span className="text-[10px] font-mono text-[#656d76] dark:text-[#8b949e] bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-1.5 py-0.5 rounded">
                                Hash: {script.mutationHash}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e] leading-relaxed">
                              {script.description}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons: Edit, Deploy, Delete */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            title="Edit script source"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectScriptToInspect(script)
                              setIsEditingSource(true)
                              setActiveCodeTab('dsl')
                            }}
                            className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] p-1.5 text-xs text-[#1f2328] dark:text-[#c9d1d9] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Edit3 className="size-3.5 text-[#0969da] dark:text-[#58a6ff]" />
                            <span className="hidden sm:inline text-[11px] font-medium">Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggle(script)
                            }}
                            className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all shadow-xs border cursor-pointer ${
                              script.isDeployed
                                ? 'border-[#d4a72c]/50 bg-[#fff8c5] dark:bg-[#d29922]/15 text-[#9a6700] dark:text-[#d29922] hover:bg-[#fcf3b8]'
                                : 'border-transparent bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] text-white'
                            }`}
                          >
                            {script.isDeployed ? 'Rollback' : 'Deploy'}
                          </button>

                          <button
                            type="button"
                            title="Remove script from library"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteScript(script.name)
                            }}
                            className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] hover:bg-[#ffebe9] hover:border-[#ff8182] dark:hover:bg-[#ff8182]/10 p-1.5 text-xs text-[#cf222e] dark:text-[#ff8182] transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Metadata footer */}
                      <div className="flex items-center justify-between border-t border-[#d0d7de]/60 dark:border-[#30363d] pt-2.5 text-[11px] text-[#656d76] dark:text-[#8b949e] flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-[#1a7f37] dark:text-[#3fb950] flex items-center gap-1">
                            <CheckCircle2 className="size-3.5 text-[#1a7f37] dark:text-[#3fb950]" />
                            {script.avBypassRate}
                          </span>
                          <span className="font-mono text-[#8250df] dark:text-[#d2a8ff] font-semibold">
                            {script.technique}
                          </span>
                        </div>
                        <span className="font-mono text-[#656d76] dark:text-[#8b949e]">{script.lastDeployedOrDraft}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Target Agent Fleet Selection (Single System or All Fleet) */}
            <Card className="p-5 flex flex-col justify-between border-[#d0d7de] dark:border-[#30363d]">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#1f2328] dark:text-[#f0f6fc] font-bold text-sm">
                    <Cpu className="size-4 text-[#1a7f37] dark:text-[#3fb950]" />
                    <h3>Target Agent Fleet</h3>
                  </div>
                  <span className="rounded-full bg-[#dafbe1] dark:bg-[#238636]/20 border border-[#4ac26b]/40 text-[#1a7f37] dark:text-[#3fb950] px-2 py-0.5 text-[10px] font-bold">
                    {targetFleet.length} Online
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#656d76] dark:text-[#8b949e]">
                  Select an individual target system below, or dispatch fleet-wide.
                </p>

                {/* Fleet Broadcast Selector Button */}
                <div className="mt-3.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTargetNode('all')}
                    className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      selectedTargetNode === 'all'
                        ? 'border-[#0969da] dark:border-[#58a6ff] bg-[#ddf4ff] dark:bg-[#388bfd]/20 text-[#0969da] dark:text-[#58a6ff] shadow-xs'
                        : 'border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] text-[#656d76] dark:text-[#8b949e] hover:bg-[#eaeef2] dark:hover:bg-[#21262d]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Server className="size-3.5" />
                      <span>All Endpoints (Fleet-Wide Broadcast)</span>
                    </div>
                    {selectedTargetNode === 'all' && (
                      <span className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider">
                        <Check className="size-3" /> Selected
                      </span>
                    )}
                  </button>
                </div>

                <div className="my-2 text-[10px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e] flex items-center gap-2">
                  <span className="h-px bg-[#d0d7de] dark:bg-[#30363d] flex-1" />
                  <span>Or Select 1 System Only</span>
                  <span className="h-px bg-[#d0d7de] dark:bg-[#30363d] flex-1" />
                </div>

                {/* Individual System Nodes */}
                <div className="flex flex-col gap-2">
                  {targetFleet.map((node) => {
                    const isNodeTargeted = selectedTargetNode === node.name

                    return (
                      <div
                        key={node.name}
                        onClick={() => setSelectedTargetNode(isNodeTargeted ? 'all' : node.name)}
                        className={`flex items-center justify-between rounded-lg border p-2.5 text-xs transition-all cursor-pointer ${
                          isNodeTargeted
                            ? 'border-[#1f883d] dark:border-[#3fb950] bg-[#dafbe1]/40 dark:bg-[#238636]/15 text-[#1f2328] dark:text-[#f0f6fc] shadow-xs'
                            : 'border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] hover:bg-[#eaeef2] dark:hover:bg-[#21262d]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`size-3 rounded-full border flex items-center justify-center ${
                              isNodeTargeted
                                ? 'border-[#1f883d] dark:border-[#3fb950] bg-[#1f883d] dark:bg-[#238636]'
                                : 'border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22]'
                            }`}
                          >
                            {isNodeTargeted && <span className="size-1 rounded-full bg-white" />}
                          </div>
                          <div>
                            <p className="font-bold text-[#1f2328] dark:text-[#e6edf3]">{node.name}</p>
                            <p className="font-mono text-[10px] text-[#656d76] dark:text-[#8b949e]">{node.ip}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-[#656d76] dark:text-[#8b949e]">{node.os}</span>
                          {isNodeTargeted && (
                            <span className="rounded bg-[#1f883d] dark:bg-[#238636] text-white px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                              Target
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Dynamic Dispatch Button */}
              <div className="mt-6 flex flex-col gap-2">
                <div className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] p-2 text-[11px] text-[#656d76] dark:text-[#8b949e] flex items-center justify-between">
                  <span>Target Scope:</span>
                  <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                    {selectedTargetNode === 'all' ? 'All 5 Fleet Endpoints' : `1 System: ${selectedTargetNode}`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDispatch}
                  className="w-full rounded-md bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] py-2.5 text-center font-bold text-xs text-white shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="size-4" />
                  {selectedTargetNode === 'all'
                    ? `Dispatch "${selectedScriptForInspect?.name || 'Routine'}" to All 5 Agents`
                    : `Dispatch "${selectedScriptForInspect?.name || 'Routine'}" to ${selectedTargetNode}`}
                </button>
              </div>
            </Card>
          </section>
        </div>
      </DestinationViewShell>

      <ImportScriptModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImport}
      />

      <GuardrailPolicyModal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
        onSave={handleSavePolicy}
      />
    </>
  )
}
