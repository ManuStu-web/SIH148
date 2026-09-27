import { MetricCard } from '@/types'

export const metricsData: MetricCard[] = [
  {
    label: 'Connected Target Agents',
    value: '5 / 5 Online',
    sub: 'Windows 11, Windows Server, Ubuntu LTS',
    iconName: 'Server',
    tone: 'emerald',
    targetView: 'Overview',
  },
  {
    label: 'Staged Analysis Scripts',
    value: '3 Routines Ready',
    sub: 'Go forensic collection routines',
    iconName: 'TerminalSquare',
    tone: 'sky',
    targetView: 'Deploy scripts',
  },
  {
    label: 'Simulation Pipeline',
    value: 'Ready',
    sub: 'Asynchronous multi-agent execution',
    iconName: 'Activity',
    tone: 'cyan',
    targetView: 'Results',
  },
]
